const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
require("dotenv").config();
const { sendTransactionEmail } = require("./email");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { connectDB } = require("./database");

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;


const app = express();
app.use(express.json());
app.use(cors());

const DB_FILE = path.join(__dirname, "db.json");
const PRODUCT_DB_FILE = path.join(__dirname, "productdb.json");
const USERS_FILE = path.join(__dirname, "users.json");
const TRACKING_FILE = path.join(__dirname, "tracking.json");

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

if (!fs.existsSync(TRACKING_FILE)) {
  const initTracking = { loginTimes: {}, sessions: [] };
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(initTracking, null, 2));
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

// tracking DB helpers
function loadTracking() {
  try {
    const raw = fs.readFileSync(TRACKING_FILE, "utf8").trim();
    if (!raw) {
      const init = { loginTimes: {}, sessions: [] };
      fs.writeFileSync(TRACKING_FILE, JSON.stringify(init, null, 2));
      return init;
    }
    const data = JSON.parse(raw);
    // Ensure loginTimes exists
    if (!data.loginTimes) data.loginTimes = {};
    return data;
  } catch (e) {
    const init = { loginTimes: {}, sessions: [] };
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(init, null, 2));
    return init;
  }
}

function saveTracking(tracking) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(tracking, null, 2));
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
    const loginTime = Date.now();

    // Store login time for tracking window (10 seconds)
    const tracking = loadTracking();
    if (!tracking.loginTimes) tracking.loginTimes = {};
    tracking.loginTimes[newUser.id] = loginTime;
    saveTracking(tracking);

    res.json({
      success: true,
      message: "Account created successfully",
      token,
      loginTime: loginTime,  // Send to frontend for tracking
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
    const loginTime = Date.now();

    // Store login time for tracking window (10 seconds)
    const tracking = loadTracking();
    if (!tracking.loginTimes) tracking.loginTimes = {};
    tracking.loginTimes[user.id] = loginTime;
    saveTracking(tracking);

    res.json({
      success: true,
      message: "Login successful",
      token,
      loginTime: loginTime,  // Send to frontend for tracking
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
// GitHub OAuth Routes
// --------------------

// Step 1: Redirect to GitHub for authentication
app.get("/auth/github", (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&scope=user:email`;
  res.redirect(githubAuthUrl);
});

// Step 2: Handle GitHub callback
app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect("http://localhost:3001?error=no_code");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.redirect("http://localhost:3001?error=no_token");
    }

    // Get user data from GitHub
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubUser = userResponse.data;

    // Get user's email if not public
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await axios.get("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const primaryEmail = emailResponse.data.find((e) => e.primary);
      email = primaryEmail ? primaryEmail.email : `${githubUser.login}@github.com`;
    }

    // Find or create user in our system
    const usersData = loadUsers();
    let user = usersData.users.find(
      (u) => u.githubId === githubUser.id || u.email === email
    );

    if (!user) {
      // Create new user
      user = {
        id: Date.now().toString(),
        username: githubUser.login,
        email: email,
        githubId: githubUser.id,
        avatarUrl: githubUser.avatar_url,
        name: githubUser.name || githubUser.login,
        createdAt: new Date().toISOString(),
      };
      usersData.users.push(user);
      saveUsers(usersData);
    } else {
      // Update existing user with GitHub data
      user.githubId = githubUser.id;
      user.avatarUrl = githubUser.avatar_url;
      user.name = githubUser.name || user.name;
      saveUsers(usersData);
    }

    // Generate token
    const token = Buffer.from(`${user.username}:${Date.now()}`).toString("base64");
    const loginTime = Date.now();

    // Store login time for tracking window (10 seconds)
    const tracking = loadTracking();
    if (!tracking.loginTimes) tracking.loginTimes = {};
    tracking.loginTimes[user.id] = loginTime;
    saveTracking(tracking);

    // Redirect to frontend with token and user data
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      name: user.name,
      loginTime: loginTime
    }));

    res.redirect(`http://localhost:3001/auth/callback?token=${token}&user=${userData}`);
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    res.redirect("http://localhost:3001?error=oauth_failed");
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

// --------------------
// POST /track
// body: { userId, location, timestamp, typingSpeed, sessionId, action }
// Track user activity including location, time, and typing speed
// --------------------
app.post("/track", (req, res) => {
  try {
    const { userId, location, timestamp, typingSpeed, sessionId, action, metadata } = req.body;
    
    if (!userId || userId === 'anonymous') {
      return res.status(400).json({ 
        success: false,
        error: "userId is required for tracking" 
      });
    }

    const tracking = loadTracking();
    
    // Check if tracking is within 10 seconds of login
    if (!tracking.loginTimes || !tracking.loginTimes[userId]) {
      return res.status(403).json({ 
        success: false,
        error: "No active tracking session. Please login first."
      });
    }

    const loginTime = tracking.loginTimes[userId];
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - loginTime) / 1000;

    // Only track for first 10 seconds after login
    if (elapsedSeconds > 10) {
      return res.status(403).json({ 
        success: false,
        error: "Tracking window expired. Only first 10 seconds after login are tracked.",
        elapsedSeconds: elapsedSeconds.toFixed(2)
      });
    }
    
    // Get client IP address
    const clientIp = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     'unknown';
    
    const trackingEntry = {
      sessionId: sessionId || loginTime.toString(),
      userId: userId,
      timestamp: timestamp || new Date().toISOString(),
      loginTime: new Date(loginTime).toISOString(),
      elapsedSeconds: elapsedSeconds.toFixed(2),
      action: action || 'activity',
      location: {
        ip: clientIp,
        provided: location || null  // Frontend can provide geolocation
      },
      typingSpeed: typingSpeed || null,  // Words per minute or characters per minute
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: metadata || {}
    };

    tracking.sessions.push(trackingEntry);
    saveTracking(tracking);

    res.json({ 
      success: true, 
      message: 'Tracking data saved',
      sessionId: trackingEntry.sessionId,
      elapsedSeconds: elapsedSeconds.toFixed(2),
      remainingSeconds: (10 - elapsedSeconds).toFixed(2)
    });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// GET /tracking/:userId
// Get tracking data for a specific user
// --------------------
app.get("/tracking/:userId", (req, res) => {
  try {
    const userId = req.params.userId;
    const tracking = loadTracking();
    
    const userSessions = tracking.sessions.filter(s => s.userId === userId);
    
    res.json({
      userId,
      totalSessions: userSessions.length,
      sessions: userSessions
    });
  } catch (err) {
    console.error("Get tracking error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// GET /tracking/session/:sessionId
// Get tracking data for a specific session
// --------------------
app.get("/tracking/session/:sessionId", (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const tracking = loadTracking();
    
    const sessionData = tracking.sessions.filter(s => s.sessionId === sessionId);
    
    res.json({
      sessionId,
      events: sessionData.length,
      data: sessionData
    });
  } catch (err) {
    console.error("Get session tracking error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// GET /tracking/analytics
// Get analytics summary of all tracking data
// --------------------
app.get("/tracking/analytics", (req, res) => {
  try {
    const tracking = loadTracking();
    
    const totalSessions = tracking.sessions.length;
    const uniqueUsers = [...new Set(tracking.sessions.map(s => s.userId))].length;
    const uniqueIPs = [...new Set(tracking.sessions.map(s => s.location.ip))].length;
    
    // Calculate average typing speed (excluding null values)
    const typingSpeeds = tracking.sessions
      .filter(s => s.typingSpeed !== null)
      .map(s => s.typingSpeed);
    const avgTypingSpeed = typingSpeeds.length > 0 
      ? typingSpeeds.reduce((a, b) => a + b, 0) / typingSpeeds.length 
      : 0;
    
    // Group by action
    const actionCounts = tracking.sessions.reduce((acc, s) => {
      acc[s.action] = (acc[s.action] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalSessions,
      uniqueUsers,
      uniqueIPs,
      averageTypingSpeed: avgTypingSpeed.toFixed(2),
      actionBreakdown: actionCounts,
      recentSessions: tracking.sessions.slice(-10).reverse()
    });
  } catch (err) {
    console.error("Get analytics error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// DELETE /tracking/clear
// Clear all tracking data (admin only - add authentication in production)
// --------------------
app.delete("/tracking/clear", (req, res) => {
  try {
    const initTracking = { loginTimes: {}, sessions: [] };
    saveTracking(initTracking);
    
    res.json({ 
      success: true, 
      message: 'All tracking data cleared' 
    });
  } catch (err) {
    console.error("Clear tracking error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// POST /analyze-risk
// Analyze transaction risk using Google Gemini AI
// --------------------
app.post("/analyze-risk", async (req, res) => {
  try {
    if (!genAI) {
      return res.status(503).json({
        success: false,
        error: "Gemini AI not configured. Add GEMINI_API_KEY to .env file"
      });
    }

    const { userId, transaction, includeTracking = true } = req.body;

    if (!userId || !transaction) {
      return res.status(400).json({
        success: false,
        error: "userId and transaction data required"
      });
    }

    // Get user's transaction history
    const db = loadDB();
    const userTransactions = db.transactions.filter(t => t.userId === userId);
    
    // Get user's tracking data if available
    let trackingData = null;
    if (includeTracking) {
      const tracking = loadTracking();
      trackingData = tracking.sessions.filter(s => s.userId === userId);
    }

    // Build comprehensive prompt for Gemini
    const prompt = `You are a fraud detection AI for a payment system. Analyze this transaction and return ONLY a JSON object with risk score and reason.

**Current Transaction:**
- Amount: $${transaction.amount || 0}
- Type: ${transaction.type || 'unknown'}
- Location IP: ${transaction.location || 'unknown'}
- Device: ${transaction.userAgent || 'unknown'}
- Time: ${new Date().toISOString()}

**User History:**
- Total past transactions: ${userTransactions.length}
- Average transaction amount: $${userTransactions.length > 0 ? (userTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) / userTransactions.length).toFixed(2) : 0}
- Recent transactions (last 5): ${JSON.stringify(userTransactions.slice(-5).map(t => ({ amount: t.amount, date: t.timestamp, type: t.type })))}

**Behavioral Data:**
${trackingData ? `
- Login sessions: ${trackingData.length}
- Average typing speed: ${trackingData.length > 0 ? (trackingData.reduce((sum, t) => sum + (t.typingSpeed || 0), 0) / trackingData.length).toFixed(0) : 'N/A'} WPM
- Recent login IPs: ${[...new Set(trackingData.map(t => t.location?.ip).filter(Boolean))].slice(-3).join(', ')}
- Location consistency: ${trackingData.length > 0 ? 'Available' : 'N/A'}
` : '- No behavioral tracking data available'}

**Analysis Required:**
Consider:
1. Transaction amount vs user's normal patterns
2. Location/IP anomalies
3. Device changes
4. Behavioral pattern consistency
5. Timing patterns (unusual hours, rapid transactions)

Return ONLY valid JSON in this exact format:
{
  "riskScore": <number 0-100>,
  "riskLevel": "<low|medium|high|critical>",
  "decision": "<approve|review|block>",
  "reason": "<brief explanation>",
  "flags": ["<flag1>", "<flag2>"]
}`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON from response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      analysis = JSON.parse(jsonText.trim());
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.error("Gemini response parse error:", parseError);
      console.error("Raw response:", responseText);
      
      // Extract risk score from text if possible
      const scoreMatch = responseText.match(/\b(\d{1,3})\b/);
      const riskScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;
      
      analysis = {
        riskScore: Math.min(100, Math.max(0, riskScore)),
        riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
        decision: riskScore > 70 ? 'block' : riskScore > 50 ? 'review' : 'approve',
        reason: 'AI analysis completed with text response',
        flags: [],
        rawResponse: responseText.substring(0, 200)
      };
    }

    // Ensure risk score is within bounds
    analysis.riskScore = Math.min(100, Math.max(0, analysis.riskScore || 50));

    // Log analysis for monitoring
    console.log(`🔍 Risk Analysis - User: ${userId}, Score: ${analysis.riskScore}, Decision: ${analysis.decision}`);

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
      transactionId: transaction.id || Date.now()
    });

  } catch (err) {
    console.error("Risk analysis error:", err);
    
    // Fallback to basic rule-based analysis
    const db = loadDB();
    const userTransactions = db.transactions.filter(t => t.userId === req.body.userId);
    const avgAmount = userTransactions.length > 0 
      ? userTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) / userTransactions.length
      : 100;
    
    const currentAmount = req.body.transaction?.amount || 0;
    const isHighAmount = currentAmount > avgAmount * 3;
    const riskScore = isHighAmount ? 75 : 25;
    
    res.json({
      success: true,
      analysis: {
        riskScore,
        riskLevel: riskScore > 70 ? 'high' : 'low',
        decision: riskScore > 70 ? 'review' : 'approve',
        reason: 'Fallback rule-based analysis (AI unavailable)',
        flags: isHighAmount ? ['unusual_amount'] : []
      },
      fallback: true,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});