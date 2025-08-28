# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from database import init_db, insert_record, get_all_records

print("[versions]", "sklearn", sklearn.__version__, "joblib", joblib.__version__,
      "numpy", numpy.__version__, "scipy", scipy.__version__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize database
init_db()

# Load the trained model and scaler
try:
    model = joblib.load('model.joblib')
    scaler = joblib.load('scaler.joblib')
    print("Model and scaler loaded successfully!")
except:
    print("Error loading model or scaler. Please train the model first.")
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

