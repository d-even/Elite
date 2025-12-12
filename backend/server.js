const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const { sendEmail, sendTransactionEmail } = require("./email");

const app = express();
app.use(express.json());
app.use(cors());

const DB_FILE = path.join(__dirname, "db.json");

// utility: ensure db file exists
if (!fs.existsSync(DB_FILE)) {
  const init = { cards: {}, scans: [], fees: [], transactions: [] };
  fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
}

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

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















// const express = require("express");
// const fs = require("fs");
// const cors = require("cors");

// const app = express();
// app.use(express.json());
// app.use(cors());

// const DB_FILE = "./db.json";

// function loadDB() {
//   return JSON.parse(fs.readFileSync(DB_FILE));
// }

// function saveDB(data) {
//   fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
// }

// // ESP32 sends UID
// app.post("/scan", (req, res) => {
//   const { uid } = req.body;

//   const db = loadDB();

//   if (!db.cards[uid]) {
//     db.cards[uid] = { balance: 0 };
//   }

//   db.scans.push({
//     uid,
//     time: new Date().toISOString()
//   });

//   saveDB(db);

//   res.json({
//     message: "UID saved",
//     uid,
//     balance: db.cards[uid].balance
//   });
// });

// // Top-up route
// app.post("/topup", (req, res) => {
//   const { uid, amount } = req.body;

//   const db = loadDB();

//   if (!db.cards[uid]) {
//     return res.status(400).json({ error: "Card not found. Scan first." });
//   }

//   db.cards[uid].balance += Number(amount);
//   saveDB(db);

//   res.json({
//     message: "Top-up successful",
//     uid,
//     newBalance: db.cards[uid].balance
//   });
// });

// // Deduct amount for merchant
// app.post("/deduct", (req, res) => {
//   const { uid, amount } = req.body;
//   const db = loadDB();

//   if (!db.cards[uid]) {
//     return res.status(400).json({ error: "Card not found." });
//   }

//   if (db.cards[uid].balance < amount) {
//     return res.status(400).json({ error: "Insufficient balance." });
//   }

//   db.cards[uid].balance -= amount;
//   saveDB(db);

//   res.json({
//     message: "Amount deducted",
//     uid,
//     newBalance: db.cards[uid].balance
//   });
// });








// // Register user info for a card
// app.post("/register-user", (req, res) => {
//   const { uid, email, pin } = req.body;

//   const db = loadDB();

//   if (!db.cards[uid]) {
//     db.cards[uid] = { balance: 0 };
//   }

//   db.cards[uid].email = email;
//   db.cards[uid].pin = pin;

//   saveDB(db);

//   res.json({
//     message: "User linked with card",
//     uid,
//     email,
//     pin
//   });
// });



// // Fetch balance
// app.get("/balance/:uid", (req, res) => {
//   const uid = req.params.uid;
//   const db = loadDB();

//   if (!db.cards[uid]) {
//     return res.json({ uid, balance: 0 });
//   }

//   res.json({ uid, balance: db.cards[uid].balance });
// });

// // Get ALL scans
// app.get("/scans", (req, res) => {
//   res.json(loadDB());
// });

// app.listen(3000, () => console.log("Backend running on port 3000"));
