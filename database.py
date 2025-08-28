# database.py
import sqlite3
from datetime import datetime

def init_db():
    conn = sqlite3.connect('financial_health.db')
    c = conn.cursor()
    
    # Create table for user submissions
    c.execute('''CREATE TABLE IF NOT EXISTS financial_records
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  monthly_income REAL,
                  monthly_expenses REAL,
                  loan_emi REAL,
                  savings REAL,
                  investments REAL,
                  financial_score REAL,
                  risk_category TEXT,
                  created_at TIMESTAMP)''')
    
    conn.commit()
    conn.close()

def insert_record(data):
    conn = sqlite3.connect('financial_health.db')
    c = conn.cursor()
    
    c.execute('''INSERT INTO financial_records 
                 (monthly_income, monthly_expenses, loan_emi, savings, investments, 
                  financial_score, risk_category, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
              (data['monthly_income'], data['monthly_expenses'], data['loan_emi'],
               data['savings'], data['investments'], data['financial_score'],
               data['risk_category'], datetime.now()))
    
    conn.commit()
    conn.close()

def get_all_records():
    conn = sqlite3.connect('financial_health.db')
    c = conn.cursor()
    
    c.execute('''SELECT * FROM financial_records ORDER BY created_at DESC''')
    records = c.fetchall()
    
    conn.close()
    return records