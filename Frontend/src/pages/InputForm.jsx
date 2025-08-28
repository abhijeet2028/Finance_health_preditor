// src/pages/InputForm.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, Calculator, AlertCircle, IndianRupee, PieChart } from 'lucide-react';

const InputForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    monthly_income: '',
    monthly_expenses: '',
    loan_emi: '',
    savings: '',
    investments: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const formatIndianRupee = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(num);
  };

  const parseIndianNumber = (value) => {
    return value.replace(/,/g, '');
  };

  const calculateTotalExpenses = () => {
    const expenses = parseFloat(parseIndianNumber(formData.monthly_expenses || '0'));
    const loanEmi = parseFloat(parseIndianNumber(formData.loan_emi || '0'));
    const savings = parseFloat(parseIndianNumber(formData.savings || '0'));
    const investments = parseFloat(parseIndianNumber(formData.investments || '0'));
    
    return expenses + loanEmi + savings + investments;
  };

  const calculateBalance = () => {
    const income = parseFloat(parseIndianNumber(formData.monthly_income || '0'));
    const totalExpenses = calculateTotalExpenses();
    
    return income - totalExpenses;
  };

  const validateForm = () => {
    const newErrors = {};
    const numericFields = ['monthly_income', 'monthly_expenses', 'loan_emi', 'savings', 'investments'];

    numericFields.forEach(field => {
      const rawValue = parseIndianNumber(formData[field]);
      
      // Check for empty field
      if (!rawValue) {
        newErrors[field] = 'This field is required';
        return;
      }

      // Check if value is a valid number
      const numValue = parseFloat(rawValue);
      if (isNaN(numValue)) {
        newErrors[field] = 'Please enter a valid number';
        return;
      }

      // Check for negative values
      if (numValue < 0) {
        newErrors[field] = 'Value cannot be negative';
        return;
      }

      // Check for zero values in critical fields
      if ((field === 'monthly_income') && numValue === 0) {
        newErrors[field] = 'Income cannot be zero';
        return;
      }

      // Check for unreasonable large numbers (100 crore limit)
      if (numValue > 10000000000) {
        newErrors[field] = 'Value exceeds reasonable limit';
        return;
      }

      // Check if monthly_income exceeds 150,000
      if (field === 'monthly_income' && numValue > 150000) {
        newErrors[field] = 'Monthly income cannot exceed ₹150,000';
        return;
      }

      // Check if monthly_expenses exceeds 150,000
      if (field === 'monthly_expenses' && numValue > 150000) {
        newErrors[field] = 'Monthly expenses cannot exceed ₹150,000';
        return;
      }
    });

    // Validate that income equals sum of all other fields
    const income = parseFloat(parseIndianNumber(formData.monthly_income || '0'));
    const totalExpenses = calculateTotalExpenses();
    const balance = calculateBalance();

    if (income > 0 && totalExpenses > 0) {
      if (Math.abs(balance) > 1) { // Allow small rounding differences
        newErrors.monthly_income = 'Income must equal the sum of Expenses, Loan EMI, Savings, and Investments';
        newErrors.monthly_expenses = 'Total must match monthly income';
        newErrors.loan_emi = 'Total must match monthly income';
        newErrors.savings = 'Total must match monthly income';
        newErrors.investments = 'Total must match monthly income';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Remove any non-numeric characters except decimal point and commas
    const sanitizedValue = value.replace(/[^0-9.,]/g, '');
    
    // Prevent multiple decimal points
    const decimalCount = sanitizedValue.split('.').length - 1;
    let finalValue = decimalCount > 1 ? sanitizedValue.slice(0, -1) : sanitizedValue;

    // Format with Indian numbering system as user types
    const rawValue = parseIndianNumber(finalValue);
    
    // Check if monthly_income exceeds 150,000 in real-time
    if (name === 'monthly_income' && rawValue && !isNaN(parseFloat(rawValue))) {
      const numValue = parseFloat(rawValue);
      if (numValue > 150000) {
        setErrors(prev => ({
          ...prev,
          monthly_income: 'Monthly income cannot exceed ₹150,000'
        }));
        return; // Don't update the field if it exceeds the limit
      } else if (errors.monthly_income) {
        // Clear error if it was previously set
        setErrors(prev => ({
          ...prev,
          monthly_income: ''
        }));
      }
    }
    
    // Check if monthly_expenses exceeds 150,000 in real-time
    if (name === 'monthly_expenses' && rawValue && !isNaN(parseFloat(rawValue))) {
      const numValue = parseFloat(rawValue);
      if (numValue > 150000) {
        setErrors(prev => ({
          ...prev,
          monthly_expenses: 'Monthly expenses cannot exceed ₹150,000'
        }));
        return; // Don't update the field if it exceeds the limit
      } else if (errors.monthly_expenses) {
        // Clear error if it was previously set
        setErrors(prev => ({
          ...prev,
          monthly_expenses: ''
        }));
      }
    }

    if (rawValue && !isNaN(parseFloat(rawValue))) {
      finalValue = formatIndianRupee(rawValue);
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Clear error when user starts typing (for other fields)
    if (errors[name] && name !== 'monthly_income' && name !== 'monthly_expenses') {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      monthly_income: '',
      monthly_expenses: '',
      loan_emi: '',
      savings: '',
      investments: ''
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const numericData = {
        monthly_income: parseFloat(parseIndianNumber(formData.monthly_income)),
        monthly_expenses: parseFloat(parseIndianNumber(formData.monthly_expenses)),
        loan_emi: parseFloat(parseIndianNumber(formData.loan_emi)),
        savings: parseFloat(parseIndianNumber(formData.savings)),
        investments: parseFloat(parseIndianNumber(formData.investments))
      };

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(numericData),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      navigate('/dashboard', { state: { prediction: result, formData: numericData } });
      
      // Reset form after successful submission
      resetForm();
      
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to complete financial analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalExpenses = calculateTotalExpenses();
  const balance = calculateBalance();
  const income = parseFloat(parseIndianNumber(formData.monthly_income || '0'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200"
      >
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 px-8 py-6">
          <div className="flex items-center justify-center">
            <PieChart className="h-8 w-8 text-white mr-3" />
            <h1 className="text-2xl font-bold text-white">Financial Health Analyzer</h1>
          </div>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Calculator className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Comprehensive Financial Assessment
            </h1>
            <p className="text-gray-600 text-lg">
              Input your monthly financial distribution for detailed analysis
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Monthly Income */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-blue-50 rounded-lg p-4 border border-blue-200"
            >
              <label htmlFor="monthly_income" className="block text-sm font-semibold text-blue-800 mb-2 uppercase tracking-wide">
                Total Monthly Income
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee className="h-5 w-5 text-blue-600" />
                </div>
                <input
                  type="text"
                  id="monthly_income"
                  name="monthly_income"
                  value={formData.monthly_income}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors font-medium ${
                    errors.monthly_income 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-blue-300 bg-white'
                  }`}
                  placeholder="1,50,000"
                  max="150000"
                />
              </div>
              {errors.monthly_income && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.monthly_income}
                </div>
              )}
              <div className="mt-1 text-xs text-blue-600">
                Maximum allowed: ₹150,000
              </div>
            </motion.div>

            {/* Monthly Expenses Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <label htmlFor="monthly_expenses" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Monthly Expenses
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="monthly_expenses"
                  name="monthly_expenses"
                  value={formData.monthly_expenses}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors font-medium ${
                    errors.monthly_expenses 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 bg-white'
                  }`}
                  placeholder="75,000"
                  max="150000"
                />
              </div>
              {errors.monthly_expenses && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.monthly_expenses}
                </div>
              )}
              <div className="mt-1 text-xs text-gray-500">
                Maximum allowed: ₹150,000
              </div>
            </motion.div>

            {/* Other Distribution Fields */}
            {[
              { label: 'Loan EMI Payments', name: 'loan_emi', placeholder: '25,000' },
              { label: 'Monthly Savings', name: 'savings', placeholder: '30,000' },
              { label: 'Investment Contributions', name: 'investments', placeholder: '20,000' },
            ].map((field, index) => (
              <motion.div
                key={field.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * (index + 2) }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  {field.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors font-medium ${
                      errors[field.name] 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300 bg-white'
                    }`}
                    placeholder={field.placeholder}
                  />
                </div>
                {errors[field.name] && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors[field.name]}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Summary Section */}
            {income > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200"
              >
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-right font-semibold text-gray-700">Total Income:</div>
                  <div className="font-bold text-green-700">₹{formatIndianRupee(income)}</div>
                  
                  <div className="text-right font-semibold text-gray-700">Total Allocation:</div>
                  <div className="font-bold text-blue-700">₹{formatIndianRupee(totalExpenses)}</div>
                  
                  <div className="text-right font-semibold text-gray-700">Balance:</div>
                  <div className={`font-bold ${balance === 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ₹{formatIndianRupee(Math.abs(balance))} {balance === 0 ? '✓ Balanced' : balance > 0 ? '(Under-allocated)' : '(Over-allocated)'}
                  </div>
                </div>
                {balance !== 0 && (
                  <div className="mt-2 text-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Income must equal the sum of all allocations
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex space-x-4 pt-4"
            >
              <Button
                type="button"
                onClick={resetForm}
                disabled={isLoading}
                className="flex-1 py-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors shadow-md"
              >
                Clear All
              </Button>
              <Button
                type="submit"
                disabled={isLoading || (income > 0 && balance !== 0) || errors.monthly_income || errors.monthly_expenses}
                className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Generate Financial Report
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Professional Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Confidential Financial Analysis • For Executive Decision Making
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InputForm;