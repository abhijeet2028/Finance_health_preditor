# 🏦 Financial Health Predictor with AI-Powered Strategic Recommendations

A comprehensive financial health analysis system that combines machine learning predictions with AI-generated strategic recommendations using Ollama LLM.

## ✨ Features

### 🤖 **AI-Powered Financial Analysis**
- **Machine Learning Model**: Pre-trained financial health classifier
- **Ollama LLM Integration**: AI-generated strategic recommendations
- **Real-time Analysis**: Instant financial health scoring and risk assessment
- **Personalized Advice**: Tailored recommendations based on individual financial profiles

### 📊 **Comprehensive Financial Metrics**
- Monthly Income Analysis
- Expense Optimization Insights
- Debt Management Strategies
- Savings & Investment Recommendations
- Emergency Fund Planning
- Risk Assessment & Mitigation

### 🎯 **Strategic Recommendations Include**
- **Priority-based Actions**: High/Medium/Low priority recommendations
- **Actionable Steps**: Specific, implementable financial advice
- **Risk Analysis**: Detailed risk assessment and mitigation strategies
- **Next Steps Roadmap**: Clear implementation timeline

### 📈 **Interactive Visualizations**
- Financial Health Score Dashboard
- Income Allocation Pie Charts
- Assets vs Liabilities Analysis
- Historical Trend Tracking
- Professional Financial Reports

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **Ollama** (for AI recommendations)
- **Git**

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Finance_health_predictor
```

### 2. Backend Setup

```bash
cd Backend

# Create virtual environment
python -m venv myenv

# Activate virtual environment
# Windows:
myenv\Scripts\activate
# macOS/Linux:
source myenv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python app.py
```

The backend will run on `http://localhost:5000`

### 3. Ollama Setup

```bash
# Install Ollama (if not already installed)
# Visit: https://ollama.ai/download

# Pull the required model
ollama pull llama2

# Verify installation
ollama list
```

### 4. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🏗️ Architecture

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

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the Backend directory:

```env
FLASK_ENV=development
FLASK_DEBUG=True
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2
```

### Ollama Model Configuration

The system uses `llama2` by default. You can change this in `Backend/app.py`:

```python
ollama_url = "http://localhost:11434/api/chat"
payload = {
    "model": "llama2",  # Change to your preferred model
    # ... rest of configuration
}
```

## 📱 Usage

### 1. Input Financial Data
- Navigate to the main page
- Enter your monthly financial information:
  - Total Monthly Income
  - Monthly Expenses
  - Loan EMI Payments
  - Monthly Savings
  - Investment Contributions

### 2. Generate Analysis
- Click "Generate Financial Report"
- The system will:
  - Process data through ML model
  - Generate AI-powered recommendations
  - Display comprehensive analysis

### 3. View Results
- **Financial Health Score**: 0-100 scale with risk categories
- **AI Recommendations**: Strategic advice with priority levels
- **Visual Charts**: Income allocation and financial overview
- **Action Items**: Specific steps to improve financial health

### 4. Refresh AI Advice
- Use the "Refresh AI Advice" button to generate new recommendations
- Each refresh provides unique insights and strategies

## 🤖 AI Integration Details

### Ollama LLM Integration

The system uses Ollama's HTTP API to generate financial recommendations:

```python
# Example API call
ollama_url = "http://localhost:11434/api/chat"
payload = {
    "model": "llama2",
    "messages": [{"role": "user", "content": prompt}],
    "stream": False
}
```

### Prompt Engineering

The AI receives structured prompts including:
- Financial profile data
- Health score and risk category
- Specific request for strategic recommendations
- JSON response format requirements

### Response Processing

AI responses are processed to extract:
- Financial health summary
- Categorized recommendations
- Priority levels
- Action items
- Risk analysis
- Implementation steps

## 📊 Machine Learning Model

### Features
- Monthly Income
- Monthly Expenses
- Loan EMI Payments
- Monthly Savings
- Investment Contributions

### Output
- **Financial Health Score**: 0-100 scale
- **Risk Categories**: Good, Moderate, Risky
- **Probability Scores**: Confidence levels for each category

### Training
The model is trained on financial datasets and can be retrained using `model_training.py`.

## 🛠️ Development

### Adding New Features

1. **Backend Extensions**
   - Add new routes in `app.py`
   - Extend database schema in `database.py`
   - Implement new ML features

2. **Frontend Enhancements**
   - Create new components in `src/components/`
   - Add new pages in `src/pages/`
   - Extend UI with Tailwind CSS

3. **AI Integration**
   - Modify prompts in `generate_llm_recommendations()`
   - Add new recommendation categories
   - Implement different LLM models

### Testing

```bash
# Backend testing
cd Backend
python -m pytest

# Frontend testing
cd Frontend
npm test
```

## 🔒 Security Considerations

- **Data Privacy**: Financial data is processed locally
- **No External APIs**: All AI processing happens via local Ollama instance
- **Secure Storage**: SQLite database with proper access controls
- **Input Validation**: Comprehensive form validation and sanitization

## 📈 Performance

### Optimization Features
- **Caching**: ML model and scaler loaded once at startup
- **Async Processing**: Non-blocking AI recommendation generation
- **Efficient Queries**: Optimized database operations
- **Responsive UI**: Smooth animations and transitions

### Scalability
- **Modular Architecture**: Easy to extend and maintain
- **Database Optimization**: Efficient data storage and retrieval
- **API Design**: RESTful endpoints for future integrations

## 🐛 Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   ```bash
   # Check if Ollama is running
   ollama list
   
   # Restart Ollama service
   ollama serve
   ```

2. **Model Not Found**
   ```bash
   # Pull the required model
   ollama pull llama2
   ```

3. **Port Already in Use**
   ```bash
   # Check port usage
   netstat -an | findstr :5000
   
   # Kill process using the port
   taskkill /f /im python.exe
   ```

4. **Frontend Dependencies**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

### Debug Mode

Enable debug logging in the backend:

```python
# In app.py
app.run(debug=True, port=5000)
```

Check console logs for detailed error information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama**: For providing the local LLM infrastructure
- **Flask**: For the robust backend framework
- **React**: For the modern frontend framework
- **Tailwind CSS**: For the beautiful UI components
- **Scikit-learn**: For the machine learning capabilities

## 📞 Support

## 📧 Contact
Maintained by **Abhijeet Warale**  

- 📩 Email: [abhijeet.warale28@gmail.com](mailto:abhijeet.warale28@gmail.com)  
- 🔗 [LinkedIn](https://www.linkedin.com/in/abhijeet-warale-70886724b)  

---

**Built with ❤️ for better financial health and AI-powered decision making**
