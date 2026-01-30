const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elitepay';
    
    await mongoose.connect(mongoURI);
    
    console.log('Connected to MongoDB database');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// User schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

const User = mongoose.model('User', userSchema);

// Card schema
const cardSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  pin: {
    type: String,
    default: ''
  },
  balance: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Card = mongoose.model('Card', cardSchema);

// Scan schema
const scanSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    trim: true
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card'
  },
  scanTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Scan = mongoose.model('Scan', scanSchema);

// Transaction schema
const transactionSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

const initializeDatabase = async () => {
  try {
    await connectDatabase();
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

module.exports = {
  initializeDatabase,
  User,
  Card,
  Scan,
  Transaction,
  mongoose
};