import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for tracking user activity for 10 seconds after login
 * Automatically tracks keystrokes, location, and typing speed
 */
export const useActivityTracking = (user, loginTime) => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState(null);
  const trackingInterval = useRef(null);
  const keystrokeCount = useRef(0);
  const startTime = useRef(Date.now());
  const sessionId = useRef(null);

  useEffect(() => {
    if (!user || !loginTime) {
      console.log('⚠️ Tracking: No user or loginTime provided');
      return;
    }

    console.log('✅ Tracking started for user:', user.id);
    setIsTracking(true);
    let trackingActive = true;
    sessionId.current = loginTime.toString();

    // Track keystrokes for typing speed
    const handleKeyPress = () => {
      if (trackingActive) {
        keystrokeCount.current++;
      }
    };

    document.addEventListener('keypress', handleKeyPress);

    // Get user location (if permission granted)
    let userLocation = null;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          console.log('📍 Location obtained:', userLocation);
        },
        (error) => {
          console.log('⚠️ Location access denied:', error.message);
        }
      );
    }

    // Calculate typing speed (Words Per Minute)
    const calculateTypingSpeed = () => {
      const minutes = (Date.now() - startTime.current) / 60000;
      if (minutes === 0) return 0;
      const words = keystrokeCount.current / 5; // Average word = 5 characters
      return Math.round(words / minutes);
    };

    // Send initial tracking event
    const sendTrackingData = async (action = 'activity') => {
      try {
        const response = await fetch('http://localhost:3000/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            sessionId: sessionId.current,
            action: action,
            typingSpeed: calculateTypingSpeed(),
            location: userLocation,
            metadata: {
              page: window.location.pathname,
              device: /Mobile|Tablet/.test(navigator.userAgent) ? 'mobile' : 'desktop',
              screenResolution: `${window.screen.width}x${window.screen.height}`,
              keystrokeCount: keystrokeCount.current
            }
          })
        });

        const data = await response.json();
        
        if (data.success) {
          console.log(`📊 Tracked (${data.elapsedSeconds}s / ${data.remainingSeconds}s remaining)`);
          setTrackingStatus({
            elapsed: parseFloat(data.elapsedSeconds),
            remaining: parseFloat(data.remainingSeconds)
          });
          return true;
        } else {
          console.log('⛔ Tracking stopped:', data.error);
          return false;
        }
      } catch (error) {
        console.error('❌ Tracking error:', error);
        return false;
      }
    };

    // Send initial tracking immediately
    sendTrackingData('login_activity');

    // Send tracking data every 2 seconds for 10 seconds
    trackingInterval.current = setInterval(async () => {
      const elapsed = (Date.now() - loginTime) / 1000;
      
      if (elapsed >= 10) {
        // Stop tracking after 10 seconds
        clearInterval(trackingInterval.current);
        setIsTracking(false);
        trackingActive = false;
        document.removeEventListener('keypress', handleKeyPress);
        console.log('✓ Tracking completed (10 seconds elapsed)');
        setTrackingStatus(null);
        return;
      }

      const success = await sendTrackingData('periodic_activity');
      
      if (!success) {
        // Server rejected tracking, stop
        clearInterval(trackingInterval.current);
        setIsTracking(false);
        trackingActive = false;
        document.removeEventListener('keypress', handleKeyPress);
        setTrackingStatus(null);
      }
    }, 2000); // Track every 2 seconds

    // Cleanup on unmount
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
      document.removeEventListener('keypress', handleKeyPress);
      setIsTracking(false);
      trackingActive = false;
    };
  }, [user, loginTime]);

  return { isTracking, trackingStatus };
};

/**
 * Tracking Indicator Component
 * Shows a visual indicator when tracking is active
 */
export const TrackingIndicator = ({ isTracking, trackingStatus }) => {
  if (!isTracking) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
      fontSize: '14px',
      fontWeight: '600'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'white',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}/>
      <span>
        🔴 Tracking: {trackingStatus ? Math.ceil(trackingStatus.remaining) : '10'}s remaining
      </span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default useActivityTracking;
