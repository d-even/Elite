// const express = require("express");
// const cors = require("cors");
// const { initializeDatabase, Card, Scan, Transaction } = require('./database');
// const authRoutes = require('./auth');

// const app = express();
// app.use(express.json());
// app.use(cors());

// // Email sending function placeholder
// function sendTransactionEmail(email, amount, balance, type, fee = 0, previousBalance = 0) {
//   // Placeholder for email functionality
//   console.log(`Email sent to ${email}: ${type} of ₹${amount}, new balance: ₹${balance}`);
// }

// // --------------------
// // POST /scan
// // body: { uid }
// // store scan and ensure card exists with default fields
// // --------------------
// app.post("/scan", async (req, res) => {
//   try {
//     const { uid } = req.body;
//     if (!uid) return res.status(400).json({ error: "Missing uid" });

//     // Find or create card
//     let card = await Card.findOne({ uid });
//     if (!card) {
//       card = new Card({
//         uid,
//         email: "",
//         pin: "",
//         balance: 0,
//         totalSpent: 0
//       });
//       await card.save();
//     }

//     // Create scan record
//     const scan = new Scan({
//       uid,
//       cardId: card._id,
//       scanTime: new Date()
//     });
//     await scan.save();

//     return res.json({ 
//       status: "ok", 
//       uid, 
//       balance: card.balance,
//       scanId: scan._id 
//     });
//   } catch (err) {
//     console.error("Scan error:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// });

// // --------------------
// // GET /scans
// // return scans with card information
// // --------------------
// app.get("/scans", async (req, res) => {
//   try {
//     const scans = await Scan.find()
//       .populate('cardId')
//       .sort({ scanTime: -1 })
//       .limit(100); // Limit to last 100 scans
    
//     const cards = await Card.find();
    
//     // Format response similar to old format for frontend compatibility
//     const formattedResponse = {
//       scans: scans.map(scan => ({
//         uid: scan.uid,
//         time: scan.scanTime.toISOString(),
//         scanId: scan._id
//       })),
//       cards: cards.reduce((acc, card) => {
//         acc[card.uid] = {
//           email: card.email,
//           pin: card.pin,
//           balance: card.balance,
//           totalSpent: card.totalSpent,
//           limits: card.limits || {}
//         };
//         return acc;
//       }, {}),
//       fees: [], // Keep for compatibility
//       transactions: [] // Keep for compatibility
//     };
    
//     res.json(formattedResponse);
//   } catch (err) {
//     console.error("Get scans error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // --------------------
// // GET /balance/:uid
// // return { uid, balance }
// // --------------------
// app.get("/balance/:uid", async (req, res) => {
//   try {
//     const uid = req.params.uid;
//     const card = await Card.findOne({ uid });
    
//     if (!card) {
//       return res.json({ uid, balance: 0 });
//     }
    
//     res.json({ uid, balance: card.balance });
//   } catch (err) {
//     console.error("Get balance error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // --------------------
// // POST /register-user
// // body: { uid, email, pin }
// // --------------------
// app.post("/register-user", async (req, res) => {
//   try {
//     const { uid, email, pin } = req.body;
//     if (!uid) return res.status(400).json({ error: "Missing uid" });

//     let card = await Card.findOne({ uid });
//     if (!card) {
//       card = new Card({
//         uid,
//         email: email || "",
//         pin: pin || "",
//         balance: 0,
//         totalSpent: 0
//       });
//     } else {
//       if (email) card.email = email;
//       if (pin) card.pin = pin;
//     }
    
//     await card.save();
//     res.json({ status: "user saved", uid });
//   } catch (err) {
//     console.error("Register user error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // --------------------
// // POST /topup
// // body: { uid, amount }
// // adds amount to card balance; records transaction
// // --------------------
// app.post("/topup", async (req, res) => {
//   try {
//     const { uid, amount } = req.body;
//     if (!uid || amount === undefined) return res.status(400).json({ error: "Missing uid or amount" });

//     let card = await Card.findOne({ uid });
//     if (!card) {
//       card = new Card({
//         uid,
//         email: "",
//         pin: "",
//         balance: 0,
//         totalSpent: 0
//       });
//     }

//     const amt = Number(amount);
//     card.balance += amt;
//     await card.save();

//     // Record transaction
//     const transaction = new Transaction({
//       uid,
//       amount: amt,
//       type: "credit",
//       description: "Top-up",
//       balanceBefore: card.balance - amt,
//       balanceAfter: card.balance
//     });
//     await transaction.save();

//     // Send email notification
//     sendTransactionEmail(
//       card.email,
//       amt,
//       card.balance,
//       "topup",
//       0
//     );

//     res.json({ newBalance: card.balance });
//   } catch (err) {
//     console.error("Topup error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // --------------------
// // POST /deduct
// // body: { uid, amount, pin? }
// // - requires PIN if amount > 100
// // - charges 2% platform fee if amount > 500
// // - stores transaction, updates totalSpent
// // --------------------
// app.post("/deduct", async (req, res) => {
//   try {
//     const { uid, amount, pin } = req.body;
//     if (!uid || amount === undefined) return res.status(400).json({ error: "Missing uid or amount" });

//     const card = await Card.findOne({ uid });
//     if (!card) return res.status(400).json({ error: "Card not found" });

//     const amt = Number(amount);

//     // PIN check
//     if (amt > 100) {
//       if (!card.pin) return res.status(400).json({ error: "User PIN not set" });
//       if (!pin || String(pin) !== String(card.pin)) {
//         return res.status(400).json({ error: "Incorrect PIN" });
//       }
//     }

//     // Check spending limits
//     if (card.limits) {
//       const limitTypes = Object.keys(card.limits);
//       for (const limitType of limitTypes) {
//         const limit = card.limits[limitType];
//         const currentSpending = await calculatePeriodSpending(uid, limitType);
        
//         // Check if adding this transaction would exceed the limit
//         if (currentSpending + amt > limit.amount) {
//           return res.status(400).json({ 
//             error: `Spending limit exceeded. Your ${limitType} limit is ₹${limit.amount} and you've already spent ₹${currentSpending.toFixed(2)}` 
//           });
//         }
//       }
//     }

//     // Platform fee
//     let platformFee = 0;
//     if (amt > 500) {
//       platformFee = +(amt * 0.02).toFixed(2); // 2% fee
//     }

//     const finalAmount = +(amt + platformFee).toFixed(2);

//     if (card.balance < finalAmount) {
//       return res.status(400).json({ error: "Insufficient balance" });
//     }

//     // Store previous balance
//     const previousBalance = card.balance;

//     // Deduct amount
//     card.balance = +(card.balance - finalAmount).toFixed(2);
//     card.totalSpent = Number(card.totalSpent || 0) + amt;
//     await card.save();

//     // Record transaction
//     const transaction = new Transaction({
//       uid,
//       amount: finalAmount,
//       type: "debit",
//       description: `Payment${platformFee > 0 ? ` (includes ₹${platformFee} fee)` : ''}`,
//       balanceBefore: previousBalance,
//       balanceAfter: card.balance
//     });
//     await transaction.save();

//     // Send email receipt
//     sendTransactionEmail(
//       card.email,
//       amt,
//       card.balance,
//       "payment",
//       platformFee,
//       previousBalance
//     );

//     const rewardEligible = (card.totalSpent || 0) > 5000;

//     res.json({ newBalance: card.balance, fee: platformFee, rewardEligible });
//   } catch (err) {
//     console.error("Deduct error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // --------------------
// // POST /set-limit
// // body: { uid, type (daily/weekly/monthly), amount }
// // Save spending limit for a user
// // --------------------
// app.post("/set-limit", async (req, res) => {
//   try {
//     const { uid, type, amount } = req.body;
//     if (!uid || !type || amount === undefined) {
//       return res.status(400).json({ error: "Missing uid, type, or amount" });
//     }

//     if (!["daily", "weekly", "monthly"].includes(type)) {
//       return res.status(400).json({ error: "Invalid limit type. Must be daily, weekly, or monthly" });
//     }

//     let card = await Card.findOne({ uid });
//     if (!card) {
//       card = new Card({
//         uid,
//         email: "",
//         pin: "",
//         balance: 0,
//         totalSpent: 0,
//         limits: {}
//       });
//     }

//     if (!card.limits) {
//       card.limits = {};
//     }

//     card.limits[type] = {
//       amount: Number(amount),
//       setAt: new Date()
//     };

//     await card.save();
//     res.json({ status: "limit set", uid, type, amount: Number(amount) });
//   } catch (err) {
//     console.error("Set limit error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // --------------------
// // GET /limit/:uid
// // Get current spending limit for a user
// // --------------------
// app.get("/limit/:uid", async (req, res) => {
//   try {
//     const uid = req.params.uid;
//     const card = await Card.findOne({ uid });
    
//     if (!card || !card.limits) {
//       return res.json({ uid, limits: null });
//     }

//     res.json({ uid, limits: card.limits });
//   } catch (err) {
//     console.error("Get limit error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // --------------------
// // DELETE /limit/:uid/:type
// // Remove a specific spending limit
// // --------------------
// app.delete("/limit/:uid/:type", async (req, res) => {
//   try {
//     const { uid, type } = req.params;
//     const card = await Card.findOne({ uid });
    
//     if (!card) {
//       return res.status(400).json({ error: "Card not found" });
//     }

//     if (card.limits && card.limits[type]) {
//       delete card.limits[type];
      
//       // If no limits left, remove limits object
//       if (Object.keys(card.limits).length === 0) {
//         card.limits = {};
//       }
      
//       await card.save();
//       res.json({ status: "limit removed", uid, type });
//     } else {
//       res.json({ status: "limit not found", uid, type });
//     }
//   } catch (err) {
//     console.error("Delete limit error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // --------------------
// // Helper function: Calculate current period spending
// // --------------------
// async function calculatePeriodSpending(uid, limitType) {
//   const transactions = await Transaction.find({ 
//     uid, 
//     type: "debit" 
//   });

//   const now = new Date();
//   let periodStart;

//   if (limitType === "daily") {
//     periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   } else if (limitType === "weekly") {
//     const dayOfWeek = now.getDay();
//     periodStart = new Date(now);
//     periodStart.setDate(now.getDate() - dayOfWeek);
//     periodStart.setHours(0, 0, 0, 0);
//   } else if (limitType === "monthly") {
//     periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
//   }

//   const periodTransactions = transactions.filter(t => {
//     const tDate = new Date(t.createdAt);
//     return tDate >= periodStart;
//   });

//   return periodTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
// }

// // --------------------
// // GET /transactions/:uid
// // Get transactions for a specific user
// // --------------------
// app.get("/transactions/:uid", async (req, res) => {
//   try {
//     const uid = req.params.uid;
//     const transactions = await Transaction.find({ uid }).sort({ createdAt: -1 });
//     res.json(transactions);
//   } catch (err) {
//     console.error("Get transactions error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Initialize database and setup authentication routes
// app.use('/auth', authRoutes);

// const PORT = process.env.PORT || 3000;

// // Initialize the database first, then start server
// initializeDatabase().then(() => {
//   app.listen(PORT, () => {
//     console.log(`Backend running on port ${PORT}`);
//     console.log('MongoDB database initialized successfully');
//   });
// }).catch((error) => {
//   console.error('Failed to initialize database:', error);
//   process.exit(1);
// });




const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const { sendTransactionEmail } = require("./email");


const app = express();
app.use(express.json());
app.use(cors());

const DB_FILE = path.join(__dirname, "db.json");
const PRODUCT_DB_FILE = path.join(__dirname, "productdb.json");
const USERS_FILE = path.join(__dirname, "users.json");

// utility: ensure db files exist
if (!fs.existsSync(DB_FILE)) {
  const init = { cards: {}, scans: [], fees: [], transactions: [] };
  fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
}

if (!fs.existsSync(PRODUCT_DB_FILE)) {
  const initProducts = { products: {} };
  fs.writeFileSync(PRODUCT_DB_FILE, JSON.stringify(initProducts, null, 2));
}

if (!fs.existsSync(USERS_FILE)) {
  const initUsers = { users: [] };
  fs.writeFileSync(USERS_FILE, JSON.stringify(initUsers, null, 2));
}

function loadDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8").trim();
    if (!raw) {
      const init = { cards: {}, scans: [], fees: [], transactions: [] };
      saveDB(init);
      return init;
    }
    return JSON.parse(raw);
  } catch (e) {
    const init = { cards: {}, scans: [], fees: [], transactions: [] };
    saveDB(init);
    return init;
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// product DB helpers
function loadProductDB() {
  try {
    const raw = fs.readFileSync(PRODUCT_DB_FILE, "utf8").trim();
    if (!raw) {
      const init = { products: {} };
      fs.writeFileSync(PRODUCT_DB_FILE, JSON.stringify(init, null, 2));
      return init;
    }
    return JSON.parse(raw);
  } catch (e) {
    const init = { products: {} };
    fs.writeFileSync(PRODUCT_DB_FILE, JSON.stringify(init, null, 2));
    return init;
  }
}

function saveProductDB(db) {
  fs.writeFileSync(PRODUCT_DB_FILE, JSON.stringify(db, null, 2));
}

// users DB helpers
function loadUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8").trim();
    if (!raw) {
      const init = { users: [] };
      fs.writeFileSync(USERS_FILE, JSON.stringify(init, null, 2));
      return init;
    }
    return JSON.parse(raw);
  } catch (e) {
    const init = { users: [] };
    fs.writeFileSync(USERS_FILE, JSON.stringify(init, null, 2));
    return init;
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// --------------------
// Authentication Routes
// --------------------
app.post("/auth/signup", (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Username, email, and password are required" 
      });
    }

    const usersData = loadUsers();
    
    // Check if user already exists
    const existingUser = usersData.users.find(
      u => u.username === username || u.email === email
    );
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Username or email already exists" 
      });
    }

    // Create new user (in production, hash the password!)
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password, // WARNING: In production, use bcrypt to hash this!
      createdAt: new Date().toISOString()
    };

    usersData.users.push(newUser);
    saveUsers(usersData);

    // Generate simple token (in production, use JWT!)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

app.post("/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Username and password are required" 
      });
    }

    const usersData = loadUsers();
    
    // Find user
    const user = usersData.users.find(u => u.username === username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    }

    // Generate simple token (in production, use JWT!)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// --------------------
// POST /scan
// body: { uid }
// store scan and ensure card exists with default fields
// --------------------
app.post("/scan", (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "Missing uid" });

    const db = loadDB();
    if (!db.cards[uid]) {
      db.cards[uid] = {
        email: "",
        pin: "",
        balance: 0,
        totalSpent: 0
      };
    }

    db.scans.push({ uid, time: new Date().toISOString() });
    saveDB(db);

    return res.json({ status: "ok", uid, balance: db.cards[uid].balance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// GET /scans
// return whole DB (frontend tolerates this shape)
// --------------------
app.get("/scans", (req, res) => {
  const db = loadDB();
  res.json(db);
});

// --------------------
// GET /balance/:uid
// return { uid, balance }
// --------------------
app.get("/balance/:uid", (req, res) => {
  const uid = req.params.uid;
  const db = loadDB();
  if (!db.cards[uid]) return res.json({ uid, balance: 0 });
  res.json({ uid, balance: db.cards[uid].balance });
});

// --------------------
// POST /register-user
// body: { uid, email, pin }
// --------------------
app.post("/register-user", (req, res) => {
  const { uid, email, pin } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing uid" });

  const db = loadDB();
  if (!db.cards[uid]) {
    db.cards[uid] = { email: "", pin: "", balance: 0, totalSpent: 0 };
  }

  if (email) db.cards[uid].email = email;
  if (pin) db.cards[uid].pin = pin;

  saveDB(db);
  res.json({ status: "user saved", uid });
});

// --------------------
// POST /topup
// body: { uid, amount }
// adds amount to card balance; records transaction and sends email
// --------------------
app.post("/topup", async (req, res) => {
  try {
    const { uid, amount } = req.body;
    if (!uid || amount === undefined) return res.status(400).json({ error: "Missing uid or amount" });

    const db = loadDB();
    if (!db.cards[uid]) {
      db.cards[uid] = { email: "", pin: "", balance: 0, totalSpent: 0 };
    }

    const amt = Number(amount);
    db.cards[uid].balance += amt;

    db.transactions.push({
      type: "topup",
      uid,
      amount: amt,
      fee: 0,
      finalAmount: amt,
      time: new Date().toISOString()
    });

    saveDB(db);

    // send professional transaction email receipt (non-blocking)
    sendTransactionEmail(
      db.cards[uid].email,
      amt,
      db.cards[uid].balance,
      "topup",
      0
    );

    res.json({ newBalance: db.cards[uid].balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// POST /deduct
// body: { uid, amount, pin? }
// - requires PIN if amount > 100
// - charges 2% platform fee if amount > 500 (fee recorded to db.fees)
// - stores transaction, updates totalSpent (sum of amount, excluding fee)
// - sends email receipt
// --------------------
app.post("/deduct", async (req, res) => {
  try {
    const { uid, amount, pin } = req.body;
    if (!uid || amount === undefined) return res.status(400).json({ error: "Missing uid or amount" });

    const db = loadDB();
    const user = db.cards[uid];
    if (!user) return res.status(400).json({ error: "Card not found" });

    const amt = Number(amount);

    // PIN check
    if (amt > 100) {
      if (!user.pin) return res.status(400).json({ error: "User PIN not set" });
      if (!pin || String(pin) !== String(user.pin)) {
        return res.status(400).json({ error: "Incorrect PIN" });
      }
    }

    // Check spending limits
    if (user.limits) {
      const limitTypes = Object.keys(user.limits);
      for (const limitType of limitTypes) {
        const limit = user.limits[limitType];
        const currentSpending = calculatePeriodSpending(uid, limitType, db);
        
        // Check if adding this transaction would exceed the limit
        if (currentSpending + amt > limit.amount) {
          return res.status(400).json({ 
            error: `Spending limit exceeded. Your ${limitType} limit is ₹${limit.amount} and you've already spent ₹${currentSpending.toFixed(2)}` 
          });
        }
      }
    }

    // platform fee
    let platformFee = 0;
    if (amt > 500) {
      platformFee = +(amt * 0.02).toFixed(2); // 2% fee
      db.fees.push({ uid, email: user.email || "", fee: platformFee, time: new Date().toISOString() });
    }

    const finalAmount = +(amt + platformFee).toFixed(2);

    if (user.balance < finalAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Store previous balance for email
    const previousBalance = user.balance;

    // deduct
    user.balance = +(user.balance - finalAmount).toFixed(2);

    // update totalSpent (sum of original amounts the user paid, excluding fee)
    user.totalSpent = Number(user.totalSpent || 0) + amt;

    // log transaction
    db.transactions.push({
      type: "payment",
      uid,
      amount: amt,
      fee: platformFee,
      finalAmount,
      time: new Date().toISOString()
    });

    saveDB(db);

    // send professional transaction email receipt
    sendTransactionEmail(
      user.email,
      amt,
      user.balance,
      "payment",
      platformFee,
      previousBalance
    );

    const rewardEligible = (user.totalSpent || 0) > 5000;

    res.json({ newBalance: user.balance, fee: platformFee, rewardEligible });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// GET /fees  (admin view)
// --------------------
app.get("/fees", (req, res) => {
  const db = loadDB();
  res.json(db.fees);
});

// --------------------
// GET /product/:uid
// return product info for a scanned product tag
// --------------------
app.get("/product/:uid", (req, res) => {
  const uid = req.params.uid;
  const productDb = loadProductDB();
  const product = productDb.products && productDb.products[uid];

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json({ uid, ...product });
});

// --------------------
// POST /product
// body: { uid, name, price }
// Save or update product linked to a tag UID
// --------------------
app.post("/product", (req, res) => {
  try {
    const { uid, name, price } = req.body;
    if (!uid || !name || price === undefined) {
      return res.status(400).json({ error: "Missing uid, name, or price" });
    }

    const productDb = loadProductDB();
    if (!productDb.products) {
      productDb.products = {};
    }

    productDb.products[uid] = {
      name: String(name),
      price: Number(price)
    };

    saveProductDB(productDb);

    res.json({ uid, name: String(name), price: Number(price) });
  } catch (err) {
    console.error("Error saving product:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// GET /transactions (optional - admin)
// --------------------
app.get("/transactions", (req, res) => {
  const db = loadDB();
  res.json(db.transactions);
});

// --------------------
// GET /transactions/:uid
// Get transactions for a specific user
// --------------------
app.get("/transactions/:uid", (req, res) => {
  const uid = req.params.uid;
  const db = loadDB();
  const userTransactions = db.transactions.filter(t => t.uid === uid && t.type === "payment");
  res.json(userTransactions);
});

// --------------------
// POST /set-limit
// body: { uid, type (daily/weekly/monthly), amount }
// Save spending limit for a user
// --------------------
app.post("/set-limit", (req, res) => {
  try {
    const { uid, type, amount } = req.body;
    if (!uid || !type || amount === undefined) {
      return res.status(400).json({ error: "Missing uid, type, or amount" });
    }

    if (!["daily", "weekly", "monthly"].includes(type)) {
      return res.status(400).json({ error: "Invalid limit type. Must be daily, weekly, or monthly" });
    }

    const db = loadDB();
    if (!db.cards[uid]) {
      db.cards[uid] = { email: "", pin: "", balance: 0, totalSpent: 0 };
    }

    if (!db.cards[uid].limits) {
      db.cards[uid].limits = {};
    }

    db.cards[uid].limits[type] = {
      amount: Number(amount),
      setAt: new Date().toISOString()
    };

    saveDB(db);
    res.json({ status: "limit set", uid, type, amount: Number(amount) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// GET /limit/:uid
// Get current spending limit for a user
// --------------------
app.get("/limit/:uid", (req, res) => {
  const uid = req.params.uid;
  const db = loadDB();
  
  if (!db.cards[uid] || !db.cards[uid].limits) {
    return res.json({ uid, limits: null });
  }

  res.json({ uid, limits: db.cards[uid].limits });
});

// --------------------
// DELETE /limit/:uid/:type
// Remove a specific spending limit
// --------------------
app.delete("/limit/:uid/:type", (req, res) => {
  try {
    const { uid, type } = req.params;
    const db = loadDB();
    
    if (!db.cards[uid]) {
      return res.status(400).json({ error: "Card not found" });
    }

    if (db.cards[uid].limits && db.cards[uid].limits[type]) {
      delete db.cards[uid].limits[type];
      
      // If no limits left, remove limits object
      if (Object.keys(db.cards[uid].limits).length === 0) {
        delete db.cards[uid].limits;
      }
      
      saveDB(db);
      res.json({ status: "limit removed", uid, type });
    } else {
      res.json({ status: "limit not found", uid, type });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// Helper function: Calculate current period spending
// --------------------
function calculatePeriodSpending(uid, limitType, db) {
  const transactions = db.transactions.filter(
    t => t.uid === uid && t.type === "payment"
  );

  const now = new Date();
  let periodStart;

  if (limitType === "daily") {
    periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (limitType === "weekly") {
    const dayOfWeek = now.getDay();
    periodStart = new Date(now);
    periodStart.setDate(now.getDate() - dayOfWeek);
    periodStart.setHours(0, 0, 0, 0);
  } else if (limitType === "monthly") {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const periodTransactions = transactions.filter(t => {
    const tDate = new Date(t.time);
    return tDate >= periodStart;
  });

  return periodTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

// --------------------
// POST /convert-eth-to-inr
// body: { uid, ethAmount, ethPriceINR }
// Converts ETH reward to INR and adds to card balance (for testnet rewards)
// --------------------
app.post("/convert-eth-to-inr", async (req, res) => {
  try {
    const { uid, ethAmount, ethPriceINR } = req.body;
    
    if (!uid || !ethAmount || !ethPriceINR) {
      return res.status(400).json({ error: "Missing uid, ethAmount, or ethPriceINR" });
    }

    const db = loadDB();
    if (!db.cards[uid]) {
      return res.status(400).json({ error: "Card not found. Please scan your card first." });
    }

    // Calculate INR equivalent
    const ethValue = Number(ethAmount);
    const priceINR = Number(ethPriceINR);
    const inrAmount = +(ethValue * priceINR).toFixed(2);

    if (inrAmount <= 0) {
      return res.status(400).json({ error: "Invalid conversion amount" });
    }

    // Add INR to card balance
    db.cards[uid].balance = +(db.cards[uid].balance + inrAmount).toFixed(2);

    // Record conversion transaction
    db.transactions.push({
      type: "eth_conversion",
      uid,
      ethAmount: ethValue,
      ethPriceINR: priceINR,
      inrAmount: inrAmount,
      time: new Date().toISOString()
    });

    saveDB(db);

    // Send professional transaction email notification
    sendTransactionEmail(
      db.cards[uid].email || "",
      inrAmount,
      db.cards[uid].balance,
      "topup",
      0
    );

    res.json({ 
      success: true,
      ethAmount: ethValue,
      inrAmount: inrAmount,
      newBalance: db.cards[uid].balance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));








