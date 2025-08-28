# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from database import init_db, insert_record, get_all_records
from pathlib import Path
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Resolve project paths reliably
BASE_DIR = Path(__file__).resolve().parent
MODEL_CANDIDATES = ["model.joblib", "model.pkl", "financial_model.joblib", "financial_model.pkl"]
SCALER_CANDIDATES = ["scaler.joblib", "scaler.pkl", "standard_scaler.joblib", "standard_scaler.pkl"]

def first_existing(base: Path, names):
    for name in names:
        p = base / name
        if p.exists():
            print(f"[artifacts] Found: {p}")
            return p
    print("[artifacts] Tried (no match):", [str(base / n) for n in names])
    return None

# Initialize database
init_db()

# Load the trained model and scaler
model = None
scaler = None
try:
    model_path = first_existing(BASE_DIR, MODEL_CANDIDATES)
    scaler_path = first_existing(BASE_DIR, SCALER_CANDIDATES)

    if model_path is None:
        raise FileNotFoundError("Missing model artifact. Place it in Backend/ as model.joblib or model.pkl")

    print(f"[artifacts] Loading model from: {model_path}")
    model = joblib.load(model_path)

    if scaler_path:
        print(f"[artifacts] Loading scaler from: {scaler_path}")
        scaler = joblib.load(scaler_path)
    else:
        print("[artifacts] No scaler file found. Continuing without scaler.")
except Exception as e:
    # Surface the real problem in Render logs
    print(f"[artifacts] ERROR while loading artifacts: {e}")
    model = None
    scaler = None
    
    
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Flask backend is running!"})

@app.route('/predict', methods=['POST'])
def predict():
    if model is None or scaler is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        # Get data from request
        data = request.get_json()
        
        # Extract features
        features = np.array([
            data['monthly_income'],
            data['monthly_expenses'],
            data['loan_emi'],
            data['savings'],
            data['investments']
        ]).reshape(1, -1)
        
        # Scale the features
        features_scaled = scaler.transform(features)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        
        # Calculate a score based on probabilities
        categories = model.classes_
        score_mapping = {'Risky': 20, 'Moderate': 55, 'Good': 85}
        financial_score = sum(prob * score_mapping[cat] for cat, prob in zip(categories, probabilities))
        
        # Prepare response
        response = {
            'financial_score': round(financial_score, 2),
            'risk_category': prediction,
            'probabilities': {cat: round(prob * 100, 2) for cat, prob in zip(categories, probabilities)}
        }
        
        # Store the record in database
        record_data = {
            'monthly_income': data['monthly_income'],
            'monthly_expenses': data['monthly_expenses'],
            'loan_emi': data['loan_emi'],
            'savings': data['savings'],
            'investments': data['investments'],
            'financial_score': financial_score,
            'risk_category': prediction
        }
        insert_record(record_data)
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/history', methods=['GET'])
def get_history():
    try:
        records = get_all_records()
        
        # Format records for response
        history = []
        for record in records:
            history.append({
                'id': record[0],
                'monthly_income': record[1],
                'monthly_expenses': record[2],
                'loan_emi': record[3],
                'savings': record[4],
                'investments': record[5],
                'financial_score': record[6],
                'risk_category': record[7],
                'created_at': record[8]
            })
        
        return jsonify(history)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':

    app.run(debug=True, port=5000)
