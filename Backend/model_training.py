# model_training.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib

def generate_dummy_data(n_samples=20000):
    np.random.seed(42)
    
    # Generate realistic financial data
    monthly_income = np.random.normal(50000, 20000, n_samples)
    monthly_income = np.clip(monthly_income, 10000, 150000)  # Reasonable range
    
    # Expenses typically 40-80% of income
    expense_ratio = np.random.normal(0.6, 0.15, n_samples)
    monthly_expenses = monthly_income * np.clip(expense_ratio, 0.4, 0.8)
    
    # Loan EMI typically 10-30% of income
    emi_ratio = np.random.normal(0.2, 0.08, n_samples)
    loan_emi = monthly_income * np.clip(emi_ratio, 0.1, 0.3)
    
    # Savings typically 10-30% of income
    savings_ratio = np.random.normal(0.2, 0.08, n_samples)
    savings = monthly_income * np.clip(savings_ratio, 0.1, 0.3)
    
    # Investments typically 5-20% of income
    investment_ratio = np.random.normal(0.12, 0.06, n_samples)
    investments = monthly_income * np.clip(investment_ratio, 0.05, 0.2)
    
    # Calculate financial health score based on rules
    expense_ratio = monthly_expenses / monthly_income
    debt_ratio = loan_emi / monthly_income
    savings_rate = (savings + investments) / monthly_income
    
    # Base score (0-100)
    base_score = 100 - (expense_ratio * 40) - (debt_ratio * 30) + (savings_rate * 30)
    base_score = np.clip(base_score, 0, 100)
    
    # Add some randomness
    financial_score = base_score + np.random.normal(0, 5, n_samples)
    financial_score = np.clip(financial_score, 0, 100)
    
    # Determine risk category
    risk_category = []
    for score in financial_score:
        if score >= 70:
            risk_category.append('Good')
        elif score >= 40:
            risk_category.append('Moderate')
        else:
            risk_category.append('Risky')
    
    # Create DataFrame
    data = pd.DataFrame({
        'MonthlyIncome': monthly_income,
        'MonthlyExpenses': monthly_expenses,
        'LoanEMI': loan_emi,
        'Savings': savings,
        'Investments': investments,
        'FinancialHealthScore': financial_score,
        'RiskCategory': risk_category
    })
    
    return data

def train_model():
    # Generate dummy data
    data = generate_dummy_data(20000)
    
    # Features and target
    X = data[['MonthlyIncome', 'MonthlyExpenses', 'LoanEMI', 'Savings', 'Investments']]
    y = data['RiskCategory']
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train a Random Forest classifier
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Save the model and scaler
    joblib.dump(model, 'model.joblib')
    joblib.dump(scaler, 'scaler.joblib')
    
    # Save the dummy data for reference
    data.to_csv('financial_data.csv', index=False)
    
    print("Model trained and saved successfully!")
    print(f"Training accuracy: {model.score(X_train_scaled, y_train):.2f}")
    print(f"Test accuracy: {model.score(X_test_scaled, y_test):.2f}")

if __name__ == "__main__":
    train_model()