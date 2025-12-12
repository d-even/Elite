# 📧 Elite Pay Email System - Step-by-Step Guide

## 🎯 Overview
The email system automatically sends professional transaction receipts (like Google Pay) whenever a user makes a payment or receives money.

---

## 📋 **STEP 1: Setup & Configuration**

### 1.1 Email Configuration
The email system uses Gmail SMTP. Configuration is in `backend/email.js`:

```javascript
const TRANSPORTER_CONFIG = {
  service: "gmail",
  auth: {
    user: "devensawant4554@gmail.com",  // Your Gmail address
    pass: "MumbaiS1$"                     // Gmail App Password
  }
};
```

### 1.2 Gmail App Password Setup (If Needed)
1. Go to your Google Account → Security
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Replace `MumbaiS1$` in `backend/email.js` with your app password

---

## 🔄 **STEP 2: How It Works - Complete Flow**

### **Scenario: User Spends ₹1,000**

#### **Step 2.1: User Makes Payment**
- User scans RFID card at merchant
- Merchant enters amount: ₹1,000
- Merchant clicks "Collect Payment"
- Frontend sends POST request to `/deduct` endpoint

#### **Step 2.2: Backend Processes Transaction**
```
POST /deduct
Body: { uid: "ABC123", amount: 1000, pin: "1234" }
```

**Backend does:**
1. ✅ Validates user exists
2. ✅ Checks PIN (if amount > ₹100)
3. ✅ Checks spending limits
4. ✅ Calculates platform fee (2% if amount > ₹500)
5. ✅ Deducts amount from balance
6. ✅ Saves transaction to database
7. ✅ **Sends email automatically**

#### **Step 2.3: Email Generation**
The `sendTransactionEmail()` function:
1. Creates HTML email template
2. Formats transaction details:
   - Amount: ₹1,000
   - Fee: ₹20 (if applicable)
   - Balance: ₹9,000
   - Date/Time: Current timestamp
3. Sends via Gmail SMTP

#### **Step 2.4: Email Delivery**
- Email sent to user's registered email address
- User receives email within seconds
- Email contains professional HTML design

---

## 📧 **STEP 3: Email Content**

### What's Included in the Email:

1. **Header**
   - Elite Pay branding
   - Gradient purple background

2. **Transaction Icon**
   - 💳 for payments (red)
   - 💰 for credits (green)

3. **Amount Display**
   - Large, bold amount
   - Color-coded (red for debit, green for credit)

4. **Transaction Details**
   - Transaction Type (Payment/Credit)
   - Platform Fee (if applicable)
   - Transaction Date & Time
   - **Available Balance** (highlighted)

5. **Footer**
   - Security notice
   - Copyright information

---

## 🎬 **STEP 4: When Emails Are Sent**

### **Automatic Triggers:**

1. **Payment Transaction** (`/deduct`)
   - When user spends money
   - Shows: Amount paid, fee, new balance

2. **Top-up Transaction** (`/topup`)
   - When user adds funds via Razorpay
   - Shows: Amount added, new balance

3. **ETH Conversion** (`/convert-eth-to-inr`)
   - When user converts ETH rewards to INR
   - Shows: Amount converted, new balance

---

## 🧪 **STEP 5: Testing the System**

### **Test Payment Email:**

1. **Start Backend Server:**
   ```bash
   cd backend
   node server.js
   ```

2. **Register User with Email:**
   - Go to `/user` page
   - Enter email: `your-email@example.com`
   - Set PIN: `1234`
   - Click "Pay and Activate"

3. **Add Funds:**
   - Add ₹10,000 to wallet
   - You'll receive top-up email

4. **Make a Payment:**
   - Go to `/merchant` page
   - Enter amount: ₹1,000
   - Scan card
   - Enter PIN
   - Click "Collect Payment"
   - **Check your email inbox!**

---

## 🔍 **STEP 6: Code Flow Diagram**

```
User Action (Payment)
    ↓
Frontend: POST /deduct
    ↓
Backend: server.js
    ├─ Validate transaction
    ├─ Deduct balance
    ├─ Save to database
    └─ Call sendTransactionEmail()
        ↓
email.js
    ├─ generateTransactionEmailHTML()
    │   └─ Creates HTML template
    └─ sendEmail()
        ↓
Nodemailer → Gmail SMTP
    ↓
Email Delivered to User
```

---

## ⚙️ **STEP 7: Customization**

### **Change Email Design:**
Edit `generateTransactionEmailHTML()` in `backend/email.js`

### **Change Email Content:**
Edit the HTML template in the function

### **Change Sender Email:**
Update `TRANSPORTER_CONFIG` in `backend/email.js`

---

## 🐛 **STEP 8: Troubleshooting**

### **Email Not Sending?**

1. **Check Gmail Credentials:**
   - Verify email and password in `backend/email.js`
   - Use App Password, not regular password

2. **Check User Has Email:**
   - User must register with email first
   - Check `db.json` to verify email is saved

3. **Check Backend Logs:**
   - Look for "Failed to send email" errors
   - Check console for SMTP errors

4. **Test Email Connection:**
   ```javascript
   // Add this to test
   transporter.verify((error, success) => {
     if (error) console.log(error);
     else console.log("Email server ready!");
   });
   ```

---

## 📊 **STEP 9: Example Email Output**

### **Payment Email:**
```
Subject: Payment of ₹1,000 - Elite Pay

[Elite Pay Header]
💳 Payment Icon

Amount Paid: -₹1,000.00

Transaction Details:
- Transaction Type: Payment
- Platform Fee: ₹20.00
- Transaction Date: Mon, Dec 16, 2024, 02:30 PM
- Available Balance: ₹9,000.00
```

### **Top-up Email:**
```
Subject: Credit of ₹10,000 - Elite Pay

[Elite Pay Header]
💰 Credit Icon

Amount Received: +₹10,000.00

Transaction Details:
- Transaction Type: Credit
- Transaction Date: Mon, Dec 16, 2024, 02:25 PM
- Available Balance: ₹10,000.00
```

---

## ✅ **Summary**

1. **Setup:** Configure Gmail credentials in `backend/email.js`
2. **Automatic:** Emails send automatically on every transaction
3. **Professional:** HTML emails with Google Pay-like design
4. **Complete:** Shows amount, fee, balance, and transaction details
5. **Reliable:** Uses Nodemailer with Gmail SMTP

**The system works automatically - no manual intervention needed!** 🚀

