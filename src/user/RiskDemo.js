import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RiskAnalyzer from '../components/RiskAnalyzer';
import './RiskDemo.css';

export default function RiskDemo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [transactionData, setTransactionData] = useState({
    amount: 100,
    type: 'payment',
    location: ''
  });

  const [showAnalysis, setShowAnalysis] = useState(false);

  const presetTests = [
    { name: '💚 Low Risk', amount: 50, type: 'payment', desc: 'Small payment' },
    { name: '💛 Medium Risk', amount: 500, type: 'withdrawal', desc: 'Normal withdrawal' },
    { name: '🧡 High Risk', amount: 2000, type: 'transfer', desc: 'Large transfer' },
    { name: '❤️ Critical Risk', amount: 10000, type: 'withdrawal', desc: 'Suspicious amount' }
  ];

  const applyPreset = (preset) => {
    setTransactionData({
      amount: preset.amount,
      type: preset.type,
      location: preset.amount > 1000 ? 'unknown' : ''
    });
    setShowAnalysis(false);
  };

  return (
    <div className="risk-demo-page">
      <div className="risk-demo-container">
        <div className="demo-header">
          <button className="back-button" onClick={() => navigate('/user')}>
            ← Back
          </button>
          <h1>🛡️ AI Risk Analysis Demo</h1>
          <p className="subtitle">
            Test Google Gemini fraud detection with different transaction scenarios
          </p>
        </div>

        <div className="demo-grid">
          {/* Left Column - Transaction Form */}
          <div className="demo-card">
            <h2>Transaction Details</h2>
            
            <div className="form-group">
              <label>User ID</label>
              <input 
                type="text" 
                value={user?.id || user?.username || 'testuser'}
                disabled
                className="input-disabled"
              />
              <small>Logged in user</small>
            </div>

            <div className="form-group">
              <label>Transaction Amount ($)</label>
              <input 
                type="number" 
                value={transactionData.amount}
                onChange={(e) => setTransactionData({
                  ...transactionData,
                  amount: parseFloat(e.target.value) || 0
                })}
                placeholder="Enter amount"
              />
            </div>

            <div className="form-group">
              <label>Transaction Type</label>
              <select 
                value={transactionData.type}
                onChange={(e) => setTransactionData({
                  ...transactionData,
                  type: e.target.value
                })}
              >
                <option value="payment">Payment</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="transfer">Transfer</option>
                <option value="refund">Refund</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location/IP (optional)</label>
              <input 
                type="text" 
                value={transactionData.location}
                onChange={(e) => setTransactionData({
                  ...transactionData,
                  location: e.target.value
                })}
                placeholder="e.g., 192.168.1.1 or 'unknown'"
              />
              <small>Leave empty for current location</small>
            </div>

            <div className="preset-tests">
              <h3>Quick Test Scenarios</h3>
              <div className="preset-grid">
                {presetTests.map((preset, idx) => (
                  <button 
                    key={idx}
                    className="preset-button"
                    onClick={() => applyPreset(preset)}
                  >
                    <div className="preset-name">{preset.name}</div>
                    <div className="preset-amount">${preset.amount}</div>
                    <div className="preset-desc">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Risk Analysis */}
          <div className="demo-card">
            <h2>AI Risk Analysis</h2>
            
            <RiskAnalyzer
              userId={user?.id || user?.username || 'testuser'}
              transaction={{
                ...transactionData,
                userAgent: navigator.userAgent
              }}
              onAnalysisComplete={(analysis) => {
                setShowAnalysis(true);
                console.log('✅ Analysis complete:', analysis);
              }}
            />

            {!showAnalysis && (
              <div className="analysis-placeholder">
                <div className="placeholder-icon">🔍</div>
                <p>Click "Analyze Risk" to see AI-powered fraud detection</p>
                <div className="features-list">
                  <div className="feature">✅ Transaction pattern analysis</div>
                  <div className="feature">✅ Behavioral tracking integration</div>
                  <div className="feature">✅ Location anomaly detection</div>
                  <div className="feature">✅ Real-time risk scoring</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="info-card">
          <h3>ℹ️ How It Works</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>1. Google Gemini AI</strong>
              <p>Analyzes transaction patterns using advanced language model</p>
            </div>
            <div className="info-item">
              <strong>2. Historical Data</strong>
              <p>Compares with your past transactions and spending patterns</p>
            </div>
            <div className="info-item">
              <strong>3. Behavioral Tracking</strong>
              <p>Uses typing speed and location data from login sessions</p>
            </div>
            <div className="info-item">
              <strong>4. Smart Decisions</strong>
              <p>Returns approve/review/block decision with detailed reasoning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
