
# app.py
# Flask backend for Finance Health Predictor + LLM recommendations (Ollama) + SQLite history using database.py
# -----------------------------------------------------------------------------------------------------------
# - Uses joblib .joblib artifacts
# - Fixes StandardScaler "feature names" warning by using a DataFrame
# - Tolerant to varied input key styles (monthlyIncome, MonthlyIncome, income, etc.)
# - Uses streaming + generous read timeout for Ollama chat API
# - Fallback to deterministic template so API never crashes
# - Persists analyses to SQLite via database.py and exposes /history

import os
import json
import logging
import traceback
from typing import Dict, Any, List

import numpy as np
import pandas as pd
import joblib
import requests
from requests.adapters import HTTPAdapter, Retry
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import the user's SQLite helper module
import database as db  # expects database.py in the same directory

# -----------------------------
# Config & logging
# -----------------------------
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

MODEL_PATH = os.getenv("MODEL_PATH", "model.joblib")
SCALER_PATH = os.getenv("SCALER_PATH", "scaler.joblib")

OLLAMA_CHAT_URL = os.getenv("OLLAMA_CHAT_URL", "http://localhost:11434/api/chat")
OLLAMA_TAGS_URL = os.getenv("OLLAMA_TAGS_URL", "http://localhost:11434/api/tags")
PRIMARY_MODEL = os.getenv("OLLAMA_MODEL_PRIMARY", "llama2")
FALLBACK_MODEL = os.getenv("OLLAMA_MODEL_FALLBACK", "llama2")

# Logical fields your app understands
LOGICAL_FIELDS = [
    "monthly_income",
    "monthly_expenses",
    "loan_emi",
    "savings",
    "investments",
]

# HTTP session with retries
session = requests.Session()
retries = Retry(total=2, backoff_factor=1.0, status_forcelist=[502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))

# -----------------------------
# Flask app
# -----------------------------
app = Flask(__name__)
CORS(app)

# Ensure DB exists
try:
    db.init_db()
    log.info("SQLite initialized (financial_health.db).")
except Exception as e:
    log.error(f"DB init failed: {e}")

# -----------------------------
# Load ML artifacts
# -----------------------------
try:
    scaler = joblib.load(SCALER_PATH)
    model = joblib.load(MODEL_PATH)
    log.info("Loaded scaler and model.")
except Exception as e:
    log.error(f"Failed to load model/scaler: {e}")
    scaler, model = None, None

# Resolve feature order expected by scaler
DEFAULT_FEATURES = LOGICAL_FIELDS[:]  # fallback if scaler lacks feature_names_in_
FEATURES: List[str] = (
    list(getattr(scaler, "feature_names_in_", DEFAULT_FEATURES))
    if scaler is not None
    else DEFAULT_FEATURES
)
log.info(f"Scaler FEATURES order: {FEATURES}")

# -----------------------------
# Flexible key handling
# -----------------------------
def _norm_key(s: str) -> str:
    """normalize a key to lowercase alphanumerics only for loose matching"""
    return "".join(ch for ch in str(s) if ch.isalnum()).lower()

# Common variants for each logical field
FIELD_ALIASES = {
    "monthly_income": ["monthly_income", "MonthlyIncome", "monthlyIncome", "income", "Income"],
    "monthly_expenses": ["monthly_expenses", "MonthlyExpenses", "monthlyExpenses", "expenses", "Expenses"],
    "loan_emi": ["loan_emi", "LoanEMI", "loanEmi", "emi", "EMI", "loanemi"],
    "savings": ["savings", "Savings"],
    "investments": ["investments", "Investments", "investment", "Investment"],
}

# Pre-compute a normalized alias -> logical map for quick lookup
ALIAS_NORM_TO_LOGICAL: Dict[str, str] = {}
for logical, aliases in FIELD_ALIASES.items():
    for a in aliases:
        ALIAS_NORM_TO_LOGICAL[_norm_key(a)] = logical

def get_number_from_payload(payload: dict, logical_name: str, default: float = 0.0) -> float:
    """Fetch a numeric value from the JSON payload using flexible aliases."""
    # Exact alias lookup first
    for alias in FIELD_ALIASES.get(logical_name, [logical_name]):
        if alias in payload:
            try:
                return float(payload[alias])
            except Exception:
                pass

    # Normalized lookup next
    norm_map = {_norm_key(k): k for k in payload.keys()}
    for alias in FIELD_ALIASES.get(logical_name, [logical_name]):
        nk = _norm_key(alias)
        if nk in norm_map:
            try:
                return float(payload[norm_map[nk]])
            except Exception:
                pass

    return float(default)

# -----------------------------
# Utilities
# -----------------------------
def build_feature_df(payload: Dict[str, Any]) -> pd.DataFrame:
    """
    Build a single-row DataFrame in the exact column order the scaler was trained on.
    It maps incoming payload keys (any style) to the scaler's expected column names.
    """
    row: Dict[str, float] = {}

    # map each scaler feature name to a logical field if possible
    for col in FEATURES:
        ncol = _norm_key(col)
        logical = ALIAS_NORM_TO_LOGICAL.get(ncol, None)

        val: float
        if logical:
            # use alias-tolerant extraction from payload
            val = get_number_from_payload(payload, logical, default=0.0)
        else:
            # try direct by column name then by normalized name
            if col in payload:
                try:
                    val = float(payload[col])
                except Exception:
                    val = 0.0
            else:
                # find any payload key that normalizes to this feature
                norm_map = {_norm_key(k): k for k in payload.keys()}
                if ncol in norm_map:
                    try:
                        val = float(payload[norm_map[ncol]])
                    except Exception:
                        val = 0.0
                else:
                    # last resort default
                    val = 0.0

        row[col] = val

    df = pd.DataFrame([row], columns=FEATURES)
    return df

def categorize_score(score: float) -> str:
    """Map numeric score (0-100) to label."""
    if score >= 90:
        return "Excellent"
    if score >= 75:
        return "Good"
    if score >= 60:
        return "Fair"
    return "Needs Work"

def derive_score_and_category(probabilities: np.ndarray | None) -> Dict[str, Any]:
    """
    If your model is a classifier with classes like: ["Low", "Medium", "High"] risk,
    you can map proba to a 0-100 score. Here we use confidence -> 60..95.
    """
    conf = float(np.max(probabilities)) if probabilities is not None and len(probabilities) else 0.5
    score = round(60 + conf * 35, 2)  # 60..95
    return {"financial_score": score, "risk_category": categorize_score(score)}

def ollama_health() -> bool:
    try:
        r = session.get(OLLAMA_TAGS_URL, timeout=(2, 5))
        r.raise_for_status()
        return True
    except Exception as e:
        log.warning(f"Ollama healthcheck failed: {e}")
        return False

def _ollama_chat(model_tag: str, prompt: str, read_timeout: int = 300) -> str:
    """
    Stream response from Ollama /api/chat.
    Returns the full assistant content as plain text.
    """
    payload = {"model": model_tag, "messages": [{"role": "user", "content": prompt}], "stream": True}
    chunks: List[str] = []
    with session.post(OLLAMA_CHAT_URL, json=payload, stream=True, timeout=(3, read_timeout)) as r:
        r.raise_for_status()
        for line in r.iter_lines(decode_unicode=True):
            if not line:
                continue
            try:
                obj = json.loads(line)
                msg = obj.get("message", {})
                if "content" in msg:
                    chunks.append(msg["content"])
            except Exception:
                # tolerate keepalives or non-JSON
                pass
    return "".join(chunks).strip()

def deterministic_fallback(score: float, category: str, note: str = "") -> Dict[str, Any]:
    band = categorize_score(score)
    summary = (f"[fallback used: {note}] " if note else "") + f"Score {round(score,2)} ({category} → {band})."
    return {
        "summary": summary,
        "recommendations": [
            {
                "category": "Savings",
                "title": "Automate a 10% sweep",
                "description": "Auto-transfer 10% of income to a dedicated savings account on payday.",
                "priority": "High",
                "action_items": ["Enable standing instruction", "Name it 'Emergency Fund'", "Review after 30 days"],
            },
            {
                "category": "Investments",
                "title": "Raise SIP by ₹1,000",
                "description": "Increase monthly SIP into a low-cost index fund to build long-term corpus.",
                "priority": "Medium",
                "action_items": ["Edit SIP mandate", "Prefer expense ratio <0.5%", "Rebalance annually"],
            },
            {
                "category": "Debt",
                "title": "Avalanche high-interest EMI",
                "description": "Prepay the highest-interest loan first while paying minimums on others.",
                "priority": "High",
                "action_items": ["List EMIs with APR", "Target top APR with extra ₹", "Check prepayment penalties"],
            },
        ],
        "risk_analysis": "Watch lifestyle creep, card revolvers, and concentration risk.",
        "next_steps": ["Monthly review", "Confirm term + health insurance", "Build 4–6 months emergency fund"],
    }

def generate_llm_recommendations(financial_data: Dict[str, Any], risk_category: str, financial_score: float) -> Dict[str, Any]:
    """
    Calls Ollama to generate JSON-like recommendations.
    Returns a dict (parsed JSON). Falls back to deterministic content if Ollama fails.
    """
    try:
        log.info(f"Starting LLM recommendation generation for score: {financial_score}, category: {risk_category}")

        prompt = f"""
As a certified financial advisor, analyze the following financial data and provide strategic recommendations.

Financial Profile:
- Monthly Income: ₹{financial_data.get('monthly_income', 0):,}
- Monthly Expenses: ₹{financial_data.get('monthly_expenses', 0):,}
- Loan EMI Payments: ₹{financial_data.get('loan_emi', 0):,}
- Monthly Savings: ₹{financial_data.get('savings', 0):,}
- Investment Contributions: ₹{financial_data.get('investments', 0):,}
- Financial Health Score: {financial_score}/100
- Risk Category: {risk_category}

Please provide a JSON object with:
{{
  "summary": "Brief financial health summary",
  "recommendations": [
    {{
      "category": "Category name",
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": "High/Medium/Low",
      "action_items": ["Action 1", "Action 2", "Action 3"]
    }}
  ],
  "risk_analysis": "Detailed risk assessment",
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}}

Keep it practical and implementable for an Indian context. Return ONLY valid JSON.
""".strip()

        if not ollama_health():
            return deterministic_fallback(financial_score, risk_category, note="Ollama not reachable")

        last_err = None
        for tag in [PRIMARY_MODEL, FALLBACK_MODEL]:
            try:
                text = _ollama_chat(tag, prompt, read_timeout=300)
                if not text:
                    raise RuntimeError("Empty response from LLM")

                # Attempt to extract/parse JSON (handles cases where model adds extra text)
                start = text.find("{")
                end = text.rfind("}")
                if start != -1 and end != -1 and end > start:
                    obj = json.loads(text[start : end + 1])
                    return obj

                # If not valid JSON, wrap as a single recommendation
                return {
                    "summary": "AI-generated financial analysis",
                    "recommendations": [
                        {
                            "category": "General",
                            "title": "AI Financial Advice",
                            "description": text,
                            "priority": "Medium",
                            "action_items": ["Review the analysis", "Pick top 3 actions", "Set reminders"],
                        }
                    ],
                    "risk_analysis": "AI analysis completed",
                    "next_steps": ["Review recommendations", "Plan implementation", "Monitor progress"],
                }
            except requests.exceptions.ReadTimeout as e:
                last_err = e
                log.warning(f"Timeout with model {tag}: {e}")
                continue
            except Exception as e:
                last_err = e
                log.warning(f"Ollama error with model {tag}: {e}")
                continue

        # Both models failed
        note = f"Ollama error: {last_err}" if last_err else "Unknown Ollama error"
        return deterministic_fallback(financial_score, risk_category, note=note)

    except Exception as e:
        log.error(f"Error generating LLM recommendations: {e}")
        traceback.print_exc()
        return deterministic_fallback(financial_score, risk_category, note=str(e))

# -----------------------------
# Routes
# -----------------------------
@app.route("/health", methods=["GET"])
def health():
    # best-effort check DB by fetching count
    try:
        records = db.get_all_records()
        db_ok = True
        count = len(records)
    except Exception as e:
        db_ok = False
        count = None
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
        "features": FEATURES,
        "ollama_reachable": ollama_health(),
        "primary_model": PRIMARY_MODEL,
        "fallback_model": FALLBACK_MODEL,
        "db_ok": db_ok,
        "history_count": count,
        "db_file": "financial_health.db"
    }), 200

@app.route("/predict", methods=["POST"])
def predict():
    """
    Expected JSON (any key style is accepted thanks to aliases):
    {
      "monthly_income": 50000,      # or MonthlyIncome / monthlyIncome / income
      "monthly_expenses": 25000,    # or MonthlyExpenses / monthlyExpenses / expenses
      "loan_emi": 7000,             # or LoanEMI / loanEmi / emi
      "savings": 8000,
      "investments": 5000,

      // optional overrides:
      "financial_score": 85.0,
      "risk_category": "Good"
    }
    """
    try:
        if model is None or scaler is None:
            return jsonify({"error": "Model or scaler not loaded"}), 500

        data = request.get_json(force=True, silent=False)
        if not isinstance(data, dict):
            return jsonify({"error": "Invalid JSON body"}), 400

        # Build features and scale (fixes the sklearn 'feature names' warning)
        X_df = build_feature_df(data)
        X_scaled = scaler.transform(X_df)

        # Predict
        y_pred = model.predict(X_scaled)
        pred = y_pred[0] if isinstance(y_pred, (list, np.ndarray)) else y_pred

        proba = None
        if hasattr(model, "predict_proba"):
            try:
                proba = model.predict_proba(X_scaled)[0].tolist()
            except Exception:
                proba = None

        # Score/category: prefer client-provided; otherwise derive
        financial_score = float(data.get("financial_score")) if data.get("financial_score") is not None else None
        risk_category = data.get("risk_category")

        if financial_score is None or risk_category is None:
            derived = derive_score_and_category(np.array(proba) if proba is not None else None)
            financial_score = financial_score or derived["financial_score"]
            risk_category = risk_category or derived["risk_category"]

        # Build a clean financial profile for the LLM from the original payload (alias-tolerant)
        fin_profile = {
            "monthly_income": get_number_from_payload(data, "monthly_income"),
            "monthly_expenses": get_number_from_payload(data, "monthly_expenses"),
            "loan_emi": get_number_from_payload(data, "loan_emi"),
            "savings": get_number_from_payload(data, "savings"),
            "investments": get_number_from_payload(data, "investments"),
        }

        llm = generate_llm_recommendations(fin_profile, risk_category, financial_score)

        response_obj = {
            "prediction": str(pred),
            "probabilities": proba,
            "features_order": FEATURES,
            "scaled_features": X_scaled[0].tolist(),
            "financial_score": financial_score,
            "risk_category": risk_category,
            "llm_recommendations": llm,
        }

        # --- Persist to SQLite via database.py ---
        try:
            db.insert_record({
                "monthly_income": fin_profile["monthly_income"],
                "monthly_expenses": fin_profile["monthly_expenses"],
                "loan_emi": fin_profile["loan_emi"],
                "savings": fin_profile["savings"],
                "investments": fin_profile["investments"],
                "financial_score": financial_score,
                "risk_category": risk_category
            })
        except Exception as e:
            log.warning(f"DB insert failed (non-fatal): {e}")

        return jsonify(response_obj), 200

    except Exception as e:
        log.error(f"/predict error: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
def history():
    """Return the last N records stored in financial_health.db (default 50)."""
    try:
        limit = int(request.args.get("limit", "50"))
        rows = db.get_all_records()  # returns list of tuples
        # Map DB rows -> dict using the known schema order
        # (id, monthly_income, monthly_expenses, loan_emi, savings, investments, financial_score, risk_category, created_at)
        items = []
        for r in rows[:limit]:
            items.append({
                "id": r[0],
                "monthly_income": r[1],
                "monthly_expenses": r[2],
                "loan_emi": r[3],
                "savings": r[4],
                "investments": r[5],
                "financial_score": r[6],
                "risk_category": r[7],
                "created_at": r[8],
            })
        return jsonify({"count": len(items), "items": items}), 200
    except Exception as e:
        log.error(f"/history error: {e}")
        return jsonify({"error": str(e)}), 500

# -----------------------------
# Entrypoint
# -----------------------------
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = bool(int(os.getenv("FLASK_DEBUG", "0")))
    app.run(host="0.0.0.0", port=port, debug=debug)
