import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";

const BACKEND = "http://localhost:3000";

export default function Merchant() {
  const [lastUid, setLastUid] = useState("");
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [cardPresent, setCardPresent] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanStatus, setScanStatus] = useState("Waiting for card tap...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [isReadingCard, setIsReadingCard] = useState(false);
  const [cardData, setCardData] = useState("");
  const [isReadingTag, setIsReadingTag] = useState(false);
  const [tagTextData, setTagTextData] = useState("");
  const { isDark } = useTheme();

  const loadData = async () => {
    try {
      const res = await fetch(`${BACKEND}/scans`);
      const data = await res.json();
      const db = data.scans ? data : data;
      const scansArr = db.scans || [];

      if (scansArr.length > 0) {
        const last = scansArr[scansArr.length - 1];
        setLastUid(last.uid);
        setCardPresent(true);

        const balRes = await fetch(`${BACKEND}/balance/${last.uid}`);
        const balData = await balRes.json();
        setBalance(Number(balData.balance || 0));

      } else {
        setLastUid("");
        setBalance(0);
        setCardPresent(false);
      }
    } catch (err) {
      console.error("Merchant load error:", err);
    }
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 1500);
    return () => clearInterval(iv);
  }, []);

  const handleDeduct = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return alert("Enter valid amount.");

    setShowScanModal(true);
    setScanStatus("Waiting for card tap...");

    try {
      const timeoutMs = 20000;
      const pollIntervalMs = 800;
      const start = Date.now();
      let detectedUid = "";
      const previousUid = lastUid;

      while (Date.now() - start < timeoutMs) {
        const res = await fetch(`${BACKEND}/scans`);
        const data = await res.json();
        const scansArr = (data.scans || []);
        if (scansArr.length > 0) {
          const latest = scansArr[scansArr.length - 1];
          if (latest && latest.uid) {
            detectedUid = latest.uid;
            if (!previousUid || detectedUid !== previousUid) break;
          }
        }
        setScanStatus("Waiting... Please tap card");
        await new Promise(r => setTimeout(r, pollIntervalMs));
      }

      if (!detectedUid) {
        setScanStatus("No card detected. Please try again.");
        setTimeout(() => setShowScanModal(false), 1500);
        return;
      }

      setScanStatus("Card detected! Checking balance...");
      setIsProcessing(true);

      const balRes = await fetch(`${BACKEND}/balance/${detectedUid}`);
      const balData = await balRes.json();
      const currentBal = Number(balData.balance || 0);

      if (currentBal < amt) {
        setScanStatus(`Insufficient balance: ₹${currentBal}`);
        setIsProcessing(false);
        setTimeout(() => setShowScanModal(false), 2000);
        return;
      }

      let pin = undefined;
      if (amt > 100) {
        setShowScanModal(false);
        pin = window.prompt("Amount > ₹100 — Enter customer PIN:");
        if (!pin) {
          setIsProcessing(false);
          return alert("PIN required for this transaction.");
        }
        setShowScanModal(true);
      }

      setScanStatus("Processing payment...");

      const deductRes = await fetch(`${BACKEND}/deduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: detectedUid, amount: amt, pin })
      });

      const resp = await deductRes.json();

      if (resp.error) {
        setIsProcessing(false);
        setShowScanModal(false);
        alert(resp.error);
        return;
      }

      const newBalance = resp.newBalance;
      const fee = resp.fee || 0;

      setScanStatus("Payment successful! ✓");
      setLastTransaction({ amount: amt, fee, newBalance });
      
      setTimeout(() => {
        setIsProcessing(false);
        setShowScanModal(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }, 1000);

      setBalance(newBalance);
      setAmount("");
      setLastUid(detectedUid);
      setCardPresent(true);
    } catch (err) {
      console.error("Deduct flow error:", err);
      setIsProcessing(false);
      setShowScanModal(false);
      alert("Something went wrong while processing payment.");
    }
  };

  const quickAmounts = [50, 100, 200, 500];

  // Function to read RFID card data from hardware
  async function readCardData() {
    try {
      setIsReadingCard(true);
      setCardData("Waiting for RFID card... Please tap your card on the reader.");
      
      const timeoutMs = 20000; // 20 seconds timeout
      const pollIntervalMs = 500; // Check every 500ms
      const start = Date.now();
      let previousUid = lastUid;
      let detectedUid = "";

      // Poll backend for new card scan
      while (Date.now() - start < timeoutMs) {
        try {
          const res = await fetch(`${BACKEND}/scans`);
          const data = await res.json();
          const scansArr = data.scans || [];
          
          if (scansArr.length > 0) {
            const latest = scansArr[scansArr.length - 1];
            if (latest && latest.uid) {
              detectedUid = latest.uid;
              // If it's a new card (different from previous), we found it
              if (!previousUid || detectedUid !== previousUid) {
                break;
              }
            }
          }
          
          setCardData(`Waiting for RFID card... (${Math.floor((Date.now() - start) / 1000)}s)`);
          await new Promise(r => setTimeout(r, pollIntervalMs));
        } catch (err) {
          console.error("Error polling scans:", err);
        }
      }

      if (!detectedUid) {
        setCardData("❌ No card detected. Please try again.");
        setIsReadingCard(false);
        return;
      }

      // Get card data from backend
      try {
        const balRes = await fetch(`${BACKEND}/balance/${detectedUid}`);
        const balData = await balRes.json();
        const balance = Number(balData.balance || 0);

        // Get user info from database
        const dbRes = await fetch(`${BACKEND}/scans`);
        const dbData = await dbRes.json();
        const cardInfo = dbData.cards && dbData.cards[detectedUid] ? dbData.cards[detectedUid] : null;

        // Format card data
        const formattedData = `RFID Card Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UID: ${detectedUid}
Balance: ₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${cardInfo ? `Email: ${cardInfo.email || 'Not set'}` : ''}
${cardInfo ? `Total Spent: ₹${(cardInfo.totalSpent || 0).toLocaleString('en-IN')}` : ''}
${cardInfo && cardInfo.limits ? `Spending Limits: ${Object.keys(cardInfo.limits).join(', ')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        setCardData(formattedData);
        setIsReadingCard(false);
      } catch (err) {
        console.error("Error fetching card data:", err);
        setCardData(`✅ Card detected!\nUID: ${detectedUid}\n\nError fetching additional data.`);
        setIsReadingCard(false);
      }

    } catch (err) {
      console.error("RFID Read Error:", err);
      setCardData("❌ Error reading card: " + err.message);
      setIsReadingCard(false);
    }
  }

  // Function to read text from NFC tags
  async function readTagText() {
    try {
      if (!('NDEFReader' in window)) {
        alert("NFC is not supported in this browser. Please use Chrome on Android.");
        return;
      }

      setIsReadingTag(true);
      setTagTextData("Waiting for NFC tag... Please hold tag near device.");
      // eslint-disable-next-line no-undef
      const reader = new NDEFReader();
      
      await reader.scan();
      
      reader.addEventListener("reading", ({ message, serialNumber }) => {
        console.log("NFC Tag detected:", serialNumber);
        
        // Read text records from NFC tag
        const textRecords = [];
        
        if (message && message.records) {
          message.records.forEach((record, index) => {
            try {
              if (record.recordType === "text") {
                const decoder = new TextDecoder();
                const textData = decoder.decode(record.data);
                textRecords.push({
                  index: index,
                  data: textData
                });
              }
            } catch (err) {
              console.error("Error decoding text record:", err);
            }
          });
        }
        
        if (textRecords.length > 0) {
          const formattedData = `NFC Tag Text Data:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tag UID: ${serialNumber || "N/A"}
Text Records Found: ${textRecords.length}

Text Content:
${textRecords.map(r => `[${r.index + 1}] ${r.data}`).join('\n\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
          
          setTagTextData(formattedData);
        } else {
          setTagTextData(`NFC Tag detected!\nUID: ${serialNumber || "N/A"}\n\nNo text data found on this tag.`);
        }
        
        setIsReadingTag(false);
      });

      reader.addEventListener("readingerror", () => {
        setTagTextData("❌ Error reading NFC tag. Please try again.");
        setIsReadingTag(false);
      });

    } catch (err) {
      console.error("NFC Tag Read Error:", err);
      setTagTextData("❌ Error accessing NFC: " + err.message);
      setIsReadingTag(false);
    }
  }

  return (
    <div className="pb-8">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && lastTransaction && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 z-50 px-6 py-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-bold">Payment Received!</p>
                <p className="text-sm opacity-90">₹{lastTransaction.amount} collected</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Merchant Portal 🏪
        </h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Accept payments from Elite Pay customers
        </p>
      </motion.div>

      {/* Payment Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-3xl p-6 md:p-8 ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl`}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-3xl shadow-lg shadow-red-500/30">
            💳
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Collect Payment</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Enter amount and tap to collect</p>
          </div>
        </div>

        {/* Card Ready Status */}
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
          cardPresent 
            ? isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
            : isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
        }`}>
          <span className="text-2xl">{cardPresent ? '✅' : '❌'}</span>
          <span className={`font-medium ${
            cardPresent 
              ? isDark ? 'text-emerald-300' : 'text-emerald-700'
              : isDark ? 'text-red-300' : 'text-red-700'
          }`}>
            {cardPresent ? 'Card is ready for payment' : 'Please ask customer to tap their card'}
          </span>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {quickAmounts.map((amt) => (
            <motion.button
              key={amt}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAmount(String(amt))}
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                amount === String(amt)
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                  : isDark 
                    ? 'bg-dark-600 text-gray-300 hover:bg-dark-500' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ₹{amt}
            </motion.button>
          ))}
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Enter Amount
          </label>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>₹</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full pl-12 pr-4 py-5 rounded-2xl text-3xl font-bold transition-all ${
                isDark 
                  ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-600 focus:border-red-500' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:border-red-500'
              } border-2 focus:outline-none focus:ring-4 focus:ring-red-500/10`}
            />
          </div>
        </div>

        {/* Deduct Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDeduct}
          disabled={isProcessing || !amount}
          className={`w-full py-5 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 ${
            isProcessing || !amount
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-xl shadow-red-500/30 hover:shadow-2xl'
          }`}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>💳</span>
              <span>Pay ₹{amount || '0'}</span>
            </>
          )}
        </motion.button>

        {/* Transaction Info */}
        <div className={`mt-6 p-4 rounded-2xl ${isDark ? 'bg-dark-600' : 'bg-gray-50'}`}>
          <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>📋 Transaction Info</h4>
          <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              PIN required for transactions above ₹100
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Platform fee: 2% for amounts above ₹500
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Transactions are processed instantly
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Read Card Data Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`mt-6 rounded-3xl p-6 md:p-8 ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl`}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30">
            📱
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Read Card Data</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Read data from RFID card</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Read Card Button */}
          <motion.button
            whileHover={{ scale: isReadingCard ? 1 : 1.02 }}
            whileTap={{ scale: isReadingCard ? 1 : 0.98 }}
            onClick={readCardData}
            disabled={isReadingCard || isReadingTag}
            className={`py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
              isReadingCard || isReadingTag
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl'
            }`}
          >
            {isReadingCard ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Reading...</span>
              </>
            ) : (
              <>
                <span>💳</span>
                <span>Read Card Data</span>
              </>
            )}
          </motion.button>

          {/* Read Tag Text Button */}
          <motion.button
            whileHover={{ scale: isReadingTag ? 1 : 1.02 }}
            whileTap={{ scale: isReadingTag ? 1 : 0.98 }}
            onClick={readTagText}
            disabled={isReadingTag || isReadingCard}
            className={`py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
              isReadingTag || isReadingCard
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl'
            }`}
          >
            {isReadingTag ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Reading...</span>
              </>
            ) : (
              <>
                <span>🏷️</span>
                <span>Read Tag Text</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Display Card Data */}
        {cardData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-dark-600 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}
          >
            <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              📄 Card Data:
            </h4>
            <pre className={`text-xs font-mono overflow-auto whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {cardData}
            </pre>
          </motion.div>
        )}

        {/* Display Tag Text Data */}
        {tagTextData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-dark-600 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}
          >
            <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              📝 Tag Text Data:
            </h4>
            <pre className={`text-xs font-mono overflow-auto whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {tagTextData}
            </pre>
          </motion.div>
        )}
      </motion.div>

      {/* Scan Modal */}
      <AnimatePresence>
        {showScanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md"
            >
              <div className={`rounded-3xl overflow-hidden ${isDark ? 'bg-dark-800 border border-white/10' : 'bg-white'} shadow-2xl`}>
                <div className="p-8 text-center">
                  {/* Animated Icon */}
                  <motion.div
                    animate={{ 
                      scale: isProcessing ? 1 : [1, 1.1, 1],
                      rotate: isProcessing ? 360 : 0
                    }}
                    transition={{ 
                      repeat: isProcessing ? Infinity : Infinity, 
                      duration: isProcessing ? 1 : 2 
                    }}
                    className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl shadow-xl shadow-indigo-500/30"
                  >
                    {isProcessing ? '⏳' : '📱'}
                  </motion.div>
                  
                  <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isProcessing ? 'Processing...' : 'Tap Card'}
                  </h3>
                  
                  <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {scanStatus}
                  </p>
                  
                  {/* Progress Bar for processing */}
                  {isProcessing && (
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2 }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      />
                    </div>
                  )}
                  
                  {!isProcessing && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowScanModal(false)}
                      className={`mt-4 px-8 py-3 rounded-xl font-medium transition-colors ${
                        isDark 
                          ? 'bg-dark-600 text-gray-300 hover:bg-dark-500' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Cancel
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
