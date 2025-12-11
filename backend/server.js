const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const { sendEmail } = require("./email");

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

    // send email receipt (non-blocking)
    sendEmail(
      db.cards[uid].email,
      "Wallet Top-up Successful",
      `₹${amt} has been added to your wallet. New balance: ₹${db.cards[uid].balance}`
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

    // send email receipt
    sendEmail(
      user.email,
      "Payment Successful",
      `You paid ₹${amt}. Platform fee: ₹${platformFee}. Total deducted: ₹${finalAmount}. New balance: ₹${user.balance}`
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
