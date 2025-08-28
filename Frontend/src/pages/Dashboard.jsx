// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Lightbulb, IndianRupee, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { prediction, formData } = location.state || {};
  const [history, setHistory] = useState([]);

  // Fix: Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (!prediction) {
      navigate('/');
      return;
    }

    // Fetch prediction history
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:5000/history');
        if (response.ok) {
          const data = await response.json();
          setHistory(data.slice(0, 5)); // Show only last 5 records
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    fetchHistory();
  }, [prediction, navigate]);

  if (!prediction) {
    navigate('/');
    return null;
  }

  const { financial_score, risk_category } = prediction;

  // Format Indian rupee function
  const formatIndianRupee = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(value);
  };

  // FIXED: Prepare correct data for pie chart (Income Distribution)
  const pieChartData = [
    { name: 'Essential Expenses', value: parseFloat(formData.monthly_expenses) },
    { name: 'Loan EMI', value: parseFloat(formData.loan_emi) },
    { name: 'Savings & Investments', value: parseFloat(formData.savings) + parseFloat(formData.investments) },
    { name: 'Disposable Income', value: parseFloat(formData.monthly_income) - 
        (parseFloat(formData.monthly_expenses) + 
         parseFloat(formData.loan_emi) + 
         parseFloat(formData.savings) + 
         parseFloat(formData.investments)) 
    },
  ].filter(item => item.value > 0); // Filter out negative or zero values

  const barChartData = [
    { name: 'Liabilities', amount: parseFloat(formData.loan_emi) },
    { name: 'Assets', amount: parseFloat(formData.savings) + parseFloat(formData.investments) },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Generate recommendations based on financial data
  const generateRecommendations = () => {
    const income = parseFloat(formData.monthly_income);
    const expenses = parseFloat(formData.monthly_expenses);
    const emi = parseFloat(formData.loan_emi);
    const savings = parseFloat(formData.savings);
    const investments = parseFloat(formData.investments);
    
    const expenseRatio = expenses / income;
    const debtRatio = emi / income;
    const savingsRate = (savings + investments) / income;
    
    const recommendations = [];
    
    if (expenseRatio > 0.6) {
      recommendations.push("Optimize expenses by 10-15% to enhance financial stability and improve your health score.");
    }
    
    if (debtRatio > 0.3) {
      recommendations.push("Explore debt consolidation strategies to reduce high-interest loan burden and improve cash flow.");
    }
    
    if (savingsRate < 0.2) {
      recommendations.push("Target a minimum 20% savings rate from income to build stronger financial security.");
    }
    
    if (investments < savings * 0.5) {
      recommendations.push("Consider strategic allocation of savings into investments for better wealth generation.");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Excellent financial discipline maintained. Continue current strategies for sustained growth.");
    }
    
    return recommendations.slice(0, 3);
  };

  const recommendations = generateRecommendations();

  const getRiskColor = (category) => {
    switch (category) {
      case 'Good': return 'text-green-700 bg-green-100 border-green-200';
      case 'Moderate': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'Risky': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getRiskIcon = (category) => {
    switch (category) {
      case 'Good': return <TrendingUp className="h-5 w-5" />;
      case 'Moderate': return <AlertCircle className="h-5 w-5" />;
      case 'Risky': return <TrendingDown className="h-5 w-5" />;
      default: return null;
    }
  };

  // Custom tooltip formatter for charts
  const rupeeTooltipFormatter = (value) => {
    return [`₹${formatIndianRupee(value)}`, 'Amount'];
  };

  // Custom label renderer for pie chart with better visibility
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        {/* Text outline for better visibility */}
        <text 
          x={x} 
          y={y} 
          fill="black" 
          stroke="black"
          strokeWidth="3"
          strokeOpacity="0.5"
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize="12"
          fontWeight="bold"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        {/* Main text */}
        <text 
          x={x} 
          y={y} 
          fill="white" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize="12"
          fontWeight="bold"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6 flex-col sm:flex-row gap-4">
            {/* FIXED: Back button styling - made it more visible */}
            <Button
              onClick={() => navigate('/')}
              className="bg-indigo-600 text-white hover:bg-indigo-700 font-medium py-3 px-6 rounded-lg shadow-md w-full sm:w-auto flex items-center justify-center transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Analysis
            </Button>
            
            <div className="text-center sm:text-right mt-4 sm:mt-0">
              <h1 className="text-3xl font-bold text-white mb-2">Financial Health Dashboard</h1>
              <p className="text-gray-300">Comprehensive financial analysis and strategic insights</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-white rounded-xl shadow-2xl p-6 border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <PieChartIcon className="mr-2 h-6 w-6 text-blue-600" />
              Financial Health Score
            </h2>
            
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                  <circle
                    className="text-gray-200 stroke-current"
                    strokeWidth="10"
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                  />
                  <circle
                    className="text-indigo-600 stroke-current"
                    strokeWidth="10"
                    strokeLinecap="round"
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * financial_score) / 100}
                    transform="rotate(-90 60 60)"
                  />
                  <text
                    x="60"
                    y="65"
                    className="text-2xl font-bold fill-gray-800"
                    textAnchor="middle"
                  >
                    {financial_score.toFixed(0)}
                  </text>
                </svg>
              </div>
              
              <div className={`inline-flex items-center px-4 py-2 rounded-full border ${getRiskColor(risk_category)} mt-4`}>
                {getRiskIcon(risk_category)}
                <span className="ml-2 font-medium">{risk_category}</span>
              </div>
            </div>
            
            <div className="text-center text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
              {risk_category === 'Good' && "Exceptional financial health! Maintain current strategies for continued success."}
              {risk_category === 'Moderate' && "Financial optimization opportunities identified. Review recommendations below."}
              {risk_category === 'Risky' && "Immediate financial review recommended. Implement strategic adjustments."}
            </div>
          </motion.div>

          {/* Charts */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-2xl p-6 border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Financial Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pie Chart - FIXED: Text visibility issue */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Income Allocation</h3>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={renderCustomizedLabel}
                        labelLine={false}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={rupeeTooltipFormatter} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Custom Legend to prevent text overflow */}
                  <div className="absolute bottom-0 left-0 right-0 mt-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      {pieChartData.map((entry, index) => (
                        <div key={`legend-${index}`} className="flex items-center text-xs">
                          <div 
                            className="w-3 h-3 rounded-full mr-1" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-gray-600 truncate max-w-[80px]">
                            {entry.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bar Chart */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Assets vs Liabilities</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={rupeeTooltipFormatter} />
                      <Legend />
                      <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-2xl p-6 mb-8 border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Lightbulb className="mr-2 h-6 w-6 text-yellow-500" />
            Strategic Recommendations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200"
              >
                <p className="text-blue-800 font-medium">{rec}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* History Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-2xl p-6 border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Analysis History</h2>
          
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ₹{formatIndianRupee(record.monthly_income)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ₹{formatIndianRupee(record.monthly_expenses)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(record.risk_category)}`}>
                          {record.financial_score.toFixed(0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.risk_category}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No analysis history available</p>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Confidential Financial Analysis • Executive Decision Support
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
