import React, { useState, useEffect } from 'react';
import './RiskAnalyzer.css';

function RiskAnalyzer({ userId, transaction, onAnalysisComplete }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [riskFactors, setRiskFactors] = useState([]);

  // Load user's tracking data for risk analysis
  const loadTrackingData = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`http://localhost:3000/tracking/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setTrackingData(data.sessions);
        analyzeRiskFactors(data.sessions);
      }
    } catch (err) {
      console.error('Failed to load tracking data:', err);
    }
  };

  // Analyze risk factors from tracking data
  const analyzeRiskFactors = (sessions) => {
    const factors = [];
    
    if (sessions.length === 0) {
      factors.push({
        type: 'no_behavioral_data',
        severity: 'medium',
        description: 'No behavioral tracking data available',
        score: 20
      });
      setRiskFactors(factors);
      return;
    }

    // Location analysis
    const locations = sessions
      .filter(s => s.location?.provided)
      .map(s => s.location.provided);
    
    if (locations.length > 0) {
      const uniqueLocations = new Set(locations.map(loc => 
        `${Math.round(loc.latitude * 100) / 100},${Math.round(loc.longitude * 100) / 100}`
      ));
      
      if (uniqueLocations.size > 1) {
        factors.push({
          type: 'location_variance',
          severity: 'high',
          description: `Multiple locations detected (${uniqueLocations.size} different locations)`,
          score: 35
        });
      }
    }

    // IP address analysis
    const ipAddresses = [...new Set(sessions.map(s => s.location.ip))];
    if (ipAddresses.length > 1) {
      factors.push({
        type: 'ip_variance',
        severity: 'critical',
        description: `Multiple IP addresses detected (${ipAddresses.length} different IPs)`,
        score: 50
      });
    }

    // Keystroke analysis (typing speed consistency)
    const typingSpeeds = sessions
      .filter(s => s.typingSpeed && s.typingSpeed > 0)
      .map(s => s.typingSpeed);
    
    if (typingSpeeds.length > 2) {
      const avgSpeed = typingSpeeds.reduce((sum, speed) => sum + speed, 0) / typingSpeeds.length;
      const speedVariance = typingSpeeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / typingSpeeds.length;
      const speedStdDev = Math.sqrt(speedVariance);
      
      if (speedStdDev > 20) {
        factors.push({
          type: 'typing_inconsistency',
          severity: 'medium',
          description: `Inconsistent typing speed (std dev: ${speedStdDev.toFixed(1)} WPM)`,
          score: 25
        });
      }
      
      if (avgSpeed > 80) {
        factors.push({
          type: 'abnormal_typing_speed',
          severity: 'medium',
          description: `Unusually fast typing speed (${avgSpeed.toFixed(0)} WPM average)`,
          score: 15
        });
      }
    }

    // Time pattern analysis
    const sessionTimes = sessions.map(s => new Date(s.timestamp).getHours());
    const isOffHours = sessionTimes.some(hour => hour < 6 || hour > 23);
    if (isOffHours) {
      factors.push({
        type: 'unusual_hours',
        severity: 'low',
        description: 'Activity detected during unusual hours',
        score: 10
      });
    }

    // Device analysis
    const userAgents = [...new Set(sessions.map(s => s.userAgent))];
    if (userAgents.length > 1) {
      factors.push({
        type: 'device_variance',
        severity: 'medium',
        description: `Multiple devices detected (${userAgents.length} different user agents)`,
        score: 20
      });
    }

    setRiskFactors(factors);
  };

  useEffect(() => {
    if (userId) {
      loadTrackingData();
    }
  }, [userId]);

  const analyzeTransaction = async () => {
    if (!userId || !transaction) {
      setError('User ID and transaction data required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user's current location and IP
      let currentLocation = null;
      let currentIP = null;

      // Try to get current location
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false
            });
          });
          
          currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
        } catch (err) {
          console.log('Location access denied or failed:', err);
        }
      }

      // Get current IP
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        currentIP = ipData.ip;
      } catch (err) {
        console.log('Failed to get IP address:', err);
      }

      // Calculate behavioral risk score
      const behavioralRiskScore = riskFactors.reduce((sum, factor) => sum + factor.score, 0);

      // Enhanced transaction data with current context
      const enhancedTransaction = {
        ...transaction,
        currentLocation,
        currentIP,
        behavioralRiskScore,
        riskFactors: riskFactors,
        trackingDataAvailable: trackingData ? trackingData.length > 0 : false,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('http://localhost:3000/analyze-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transaction: enhancedTransaction,
          includeTracking: true,
          riskContext: {
            behavioralRiskScore,
            riskFactors,
            trackingSessions: trackingData?.length || 0
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Enhance analysis with our risk factors
        const enhancedAnalysis = {
          ...data.analysis,
          riskFactors: riskFactors,
          behavioralScore: behavioralRiskScore,
          detailedFlags: [
            ...(data.analysis.flags || []),
            ...riskFactors.map(factor => factor.type)
          ]
        };

        setAnalysis(enhancedAnalysis);
        if (onAnalysisComplete) {
          onAnalysisComplete(enhancedAnalysis);
        }

        // Store risk analysis in tracking data
        if (trackingData) {
          try {
            await fetch('http://localhost:3000/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                sessionId: `risk_analysis_${Date.now()}`,
                action: 'risk_analysis',
                location: currentLocation,
                metadata: {
                  transactionAmount: transaction.amount,
                  riskScore: enhancedAnalysis.riskScore,
                  riskLevel: enhancedAnalysis.riskLevel,
                  decision: enhancedAnalysis.decision,
                  riskFactors: riskFactors.map(f => f.type),
                  currentIP
                }
              })
            });
          } catch (err) {
            console.error('Failed to store risk analysis:', err);
          }
        }

      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to analyze transaction. Make sure backend is running.');
      console.error('Risk analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const colors = {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#991b1b'
    };
    return colors[level] || '#666';
  };

  const getDecisionIcon = (decision) => {
    const icons = {
      approve: '✅',
      review: '⚠️',
      block: '⛔'
    };
    return icons[decision] || '❓';
  };

  const getRiskFactorIcon = (type) => {
    const icons = {
      location_variance: '📍',
      ip_variance: '🌐',
      typing_inconsistency: '⌨️',
      abnormal_typing_speed: '⚡',
      unusual_hours: '🕐',
      device_variance: '📱',
      no_behavioral_data: '❓'
    };
    return icons[type] || '⚠️';
  };

  return (
    <div className="risk-analyzer">
      {/* Tracking Status */}
      {trackingData && (
        <div className="tracking-info">
          <div className="tracking-summary">
            <span className="tracking-label">
              📊 Behavioral Data: {trackingData.length} sessions tracked
            </span>
            {riskFactors.length > 0 && (
              <span className="risk-indicators">
                {riskFactors.map((factor, index) => (
                  <span key={index} className={`risk-indicator risk-${factor.severity}`}>
                    {getRiskFactorIcon(factor.type)} {factor.type.replace('_', ' ')}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
      )}

      <button 
        className="analyze-button"
        onClick={analyzeTransaction}
        disabled={loading}
      >
        {loading ? '🔄 Analyzing...' : '🛡️ Analyze Risk'}
      </button>

      {error && (
        <div className="risk-error">
          ❌ {error}
        </div>
      )}

      {analysis && (
        <div className={`risk-result risk-${analysis.riskLevel}`}>
          <div className="risk-header">
            <div className="risk-score-display">
              <div 
                className="risk-score" 
                style={{ color: getRiskColor(analysis.riskLevel) }}
              >
                {analysis.riskScore}
              </div>
              <div className="risk-score-label">Risk Score</div>
              {analysis.behavioralScore > 0 && (
                <div className="behavioral-score">
                  +{analysis.behavioralScore} behavioral
                </div>
              )}
            </div>
            
            <div className="risk-info">
              <span 
                className="risk-level-badge"
                style={{ background: getRiskColor(analysis.riskLevel) }}
              >
                {analysis.riskLevel.toUpperCase()}
              </span>
              <div className={`decision-badge decision-${analysis.decision}`}>
                <span>{getDecisionIcon(analysis.decision)}</span>
                <span>{analysis.decision.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="risk-reason">
            <strong>Analysis:</strong>
            <p>{analysis.reason}</p>
          </div>

          {analysis.riskFactors && analysis.riskFactors.length > 0 && (
            <div className="risk-factors">
              <strong>Risk Factors Detected:</strong>
              <div className="factors-list">
                {analysis.riskFactors.map((factor, index) => (
                  <div key={index} className={`risk-factor risk-factor-${factor.severity}`}>
                    <span className="factor-icon">{getRiskFactorIcon(factor.type)}</span>
                    <div className="factor-content">
                      <span className="factor-type">{factor.type.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="factor-description">{factor.description}</span>
                      <span className="factor-score">+{factor.score} risk points</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.detailedFlags && analysis.detailedFlags.length > 0 && (
            <div className="risk-flags">
              <strong>Flags:</strong>
              <div className="flags-list">
                {analysis.detailedFlags.map((flag, index) => (
                  <span key={index} className="flag">{flag.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
          )}

          <div className="risk-progress">
            <div 
              className="risk-progress-bar"
              style={{ 
                width: `${Math.min(analysis.riskScore, 100)}%`,
                background: getRiskColor(analysis.riskLevel)
              }}
            />
            {analysis.behavioralScore > 0 && (
              <div 
                className="behavioral-progress-bar"
                style={{ 
                  width: `${Math.min(analysis.behavioralScore, 50)}%`,
                  background: 'rgba(239, 68, 68, 0.6)'
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskAnalyzer;