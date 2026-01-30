import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import useActivityTracking, { TrackingIndicator } from '../hooks/useActivityTracking';

/**
 * Example component demonstrating how to use activity tracking
 * This automatically tracks user activity for 10 seconds after login
 */
const TrackingDemo = () => {
  const { user, loginTime } = useAuth();
  const { isTracking, trackingStatus } = useActivityTracking(user, loginTime);

  return (
    <div style={{ padding: '20px' }}>
      {/* Visual tracking indicator */}
      <TrackingIndicator isTracking={isTracking} trackingStatus={trackingStatus} />
      
      {/* Optional: Show tracking info in the UI */}
      {isTracking && (
        <div style={{
          background: '#f3f4f6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #667eea'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>🔴 Active Tracking</h3>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            <strong>User:</strong> {user?.username}
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            <strong>Session:</strong> {loginTime}
          </p>
          {trackingStatus && (
            <>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Elapsed:</strong> {trackingStatus.elapsed.toFixed(1)}s
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Remaining:</strong> {trackingStatus.remaining.toFixed(1)}s
              </p>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#e5e7eb',
                borderRadius: '4px',
                marginTop: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(trackingStatus.elapsed / 10) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  transition: 'width 0.3s ease'
                }}/>
              </div>
            </>
          )}
          <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            💡 Tip: Start typing to increase your typing speed metric!
          </p>
        </div>
      )}

      {!isTracking && user && (
        <div style={{
          background: '#f3f4f6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, color: '#6b7280' }}>
            ✓ Tracking session completed or not active
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackingDemo;
