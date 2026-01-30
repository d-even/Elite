const mongoose = require('mongoose');

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elitepay';
    
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB error: ${err}`);
});

// User Schema
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  pin: { type: String, required: true },
  balance: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  limits: {
    daily: {
      amount: { type: Number },
      setAt: { type: Date }
    },
    weekly: {
      amount: { type: Number },
      setAt: { type: Date }
    },
    monthly: {
      amount: { type: Number },
      setAt: { type: Date }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  uid: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['topup', 'payment', 'fee'], required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  metadata: {
    merchantId: String,
    productId: String,
    paymentMethod: String,
    location: {
      ip: String,
      latitude: Number,
      longitude: Number
    }
  },
  timestamp: { type: Date, default: Date.now }
});

// Tracking Session Schema
const trackingSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  action: { type: String, required: true },
  loginTime: { type: Date },
  elapsedSeconds: { type: Number },
  location: {
    ip: { type: String },
    provided: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number }
    }
  },
  typingSpeed: { type: Number },
  userAgent: { type: String },
  metadata: {
    page: String,
    device: String,
    screenResolution: String,
    keystrokeCount: Number,
    transactionAmount: Number,
    riskScore: Number,
    riskLevel: String,
    decision: String,
    riskFactors: [String],
    currentIP: String,
    behavioralRiskScore: Number,
    flags: [String]
  },
  timestamp: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: String },
  inStock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Fee Schema
const feeSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  fee: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  transactionId: { type: String },
  type: { type: String, enum: ['transaction', 'service', 'penalty'], default: 'transaction' }
});

// Scan Schema (for RFID card scans)
const scanSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  location: { type: String },
  metadata: {
    reader_id: String,
    signal_strength: Number
  }
});

// Risk Analysis Schema
const riskAnalysisSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  transactionId: { type: String },
  riskScore: { type: Number, required: true },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  decision: { type: String, enum: ['approve', 'review', 'block'], required: true },
  reason: { type: String },
  flags: [String],
  riskFactors: [{
    type: String,
    severity: String,
    description: String,
    score: Number
  }],
  behavioralData: {
    totalSessions: Number,
    uniqueLocations: Number,
    uniqueIPs: Number,
    avgTypingSpeed: Number,
    offHoursSessions: Number,
    uniqueDevices: Number
  },
  transactionData: {
    amount: Number,
    type: String,
    currentLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number
    },
    currentIP: String,
    userAgent: String
  },
  timestamp: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const TrackingSession = mongoose.model('TrackingSession', trackingSessionSchema);
const Product = mongoose.model('Product', productSchema);
const Fee = mongoose.model('Fee', feeSchema);
const Scan = mongoose.model('Scan', scanSchema);
const RiskAnalysis = mongoose.model('RiskAnalysis', riskAnalysisSchema);

module.exports = {
  connectDB,
  User,
  Transaction,
  TrackingSession,
  Product,
  Fee,
  Scan,
  RiskAnalysis
};