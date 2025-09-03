# 💰 Finance Health Predictor

Finance Health Predictor is a data-driven application that helps users assess their **financial stability** by analyzing key financial parameters such as income, expenses, loans, savings, and investments.  
It provides a **risk category prediction** (e.g., Safe, Moderate, Risky) using **Machine Learning models** integrated with a simple **frontend dashboard** and **backend APIs**.

---

## 📑 Table of Contents
- [About](#about)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 📖 About
Managing personal finance can be overwhelming without clarity on long-term risk.  
This project predicts the **financial health score** of individuals and categorizes their risk level.  
It can be used by:
- Individuals tracking personal finances  
- Banks/fintech startups evaluating loan risks  
- Students/learners exploring **ML in finance**  

---

## ✨ Features
- 📊 **Dashboard** to input financial details  
- 🤖 **ML Model** to predict financial health  
- 📈 **Visualization** of income vs. expenses  
- 🔗 **API-based backend** for predictions  
- 🌐 **Frontend integration** for easy user access  

---

## 🏗 Architecture
The project follows a **Frontend + Backend** architecture:

```
Frontend (React/HTML-CSS-JS)  →  Backend (Flask/FastAPI/Django)  →  ML Model
```

- **Frontend**: Collects user financial details and displays predictions.  
- **Backend**: Handles API requests, loads trained ML model, and serves predictions.  
- **Model**: Trained on financial dataset with parameters like income, expenses, savings, loans, etc.  

---

## 🛠 Tech Stack
- **Programming Language**: Python (ML + Backend)  
- **Machine Learning**: Scikit-learn / Pandas / NumPy  
- **Backend**: Flask / FastAPI (assumed)  
- **Frontend**: React.js or HTML/CSS/JS  
- **Visualization**: Matplotlib / Seaborn 

*(Update based on your actual stack)*

---

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/abhijeet2028/Finance_health_preditor.git
cd Finance_health_preditor
```

### 2. Backend Setup
```bash
cd Backend
pip install -r requirements.txt
# Start the backend server
python app.py
```

### 3. Frontend Setup
```bash
cd ../Frontend
# If React
npm install
npm start
```

---

## ▶️ Usage
1. Start the backend server  
2. Run the frontend  
3. Enter your **financial details** (income, expenses, loan EMI, savings, investments)  
4. Click **Predict** to view your **Financial Health Score** & risk category  

Example API call:
```bash
POST /predict
{
  "MonthlyIncome": 50000,
  "MonthlyExpenses": 25000,
  "LoanEMI": 5000,
  "Savings": 10000,
  "Investments": 15000
}
```

Response:
```json
{
  "RiskCategory": "Moderate",
  "Score": 72
}
```

---

## 📂 Project Structure

### Backend (`Backend/`)
```
Backend/
├── app.py                 # Main Flask application
├── database.py            # Database operations
├── model_training.py      # ML model training script
├── model.joblib          # Trained ML model
├── scaler.joblib         # Feature scaler
├── feature_columns.joblib # Feature column names
├── financial_data.csv     # Training dataset
├── financial_health.db    # SQLite database
└── requirements.txt       # Python dependencies
```

### Frontend (`Frontend/`)
```
Frontend/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Main application pages
│   │   ├── InputForm.jsx # Financial data input form
│   │   └── Dashboard.jsx # Analysis results dashboard
│   ├── App.jsx           # Main application component
│   └── main.jsx          # Application entry point
├── package.json           # Node.js dependencies
└── tailwind.config.js    # Tailwind CSS configuration
```

---

## 📧 Contact
Maintained by **Abhijeet Warale**  
- 📩 Email: abhijeet.warale28@gmail.com  
- 🔗 [LinkedIn](https://www.linkedin.com/in/abhijeet-warale-70886724b)  

---
🚀 *Finance Health Predictor – Predict your tomorrow, today!*
