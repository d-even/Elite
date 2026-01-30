# Test Tracking API

## Test 1: Login and verify loginTime is returned
echo "Testing login..."
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}' \
  | json_pp

# Save the userId and loginTime from response

## Test 2: Send tracking data (replace USER_ID with actual value from login)
echo "\n\nTesting tracking (within 10 seconds)..."
curl -X POST http://localhost:3000/track \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID_HERE",
    "action": "test_activity",
    "typingSpeed": 65,
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "metadata": {
      "test": true
    }
  }' \
  | json_pp

## Test 3: Get tracking data
echo "\n\nGetting tracking data..."
curl http://localhost:3000/tracking/YOUR_USER_ID_HERE | json_pp

## Test 4: Get analytics
echo "\n\nGetting analytics..."
curl http://localhost:3000/tracking/analytics | json_pp
