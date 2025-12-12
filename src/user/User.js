import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";

const BACKEND = "http://localhost:3000";

// Razorpay loader
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.id = "razorpay-script";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function User() {
  const [scans, setScans] = useState([]);
  const [lastUid, setLastUid] = useState("");
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [totalSpent, setTotalSpent] = useState(0);
  const [notification, setNotification] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const loadData = async () => {
    try {
      const res = await fetch(`${BACKEND}/scans`);
      const data = await res.json();
      const db = data.scans ? data : data;
      const scansArr = db.scans || [];
      setScans(scansArr);

      if (scansArr.length > 0) {
        const last = scansArr[scansArr.length - 1];
        const uid = last.uid;
        setLastUid(uid);

        const balRes = await fetch(`${BACKEND}/balance/${uid}`);
        const balData = await balRes.json();
        setBalance(Number(balData.balance || 0));

        if (db.cards && db.cards[uid]) {
          setTotalSpent(Number(db.cards[uid].totalSpent || 0));
          if (db.cards[uid].email && !email) setEmail(db.cards[uid].email);
        } else {
          setTotalSpent(0);
        }

        if (Number(balData.balance || 0) === 0) {
          setNotification("Your card balance is 0. Please top-up to use merchant services.");
        }
      } else {
        setLastUid("");
        setBalance(0);
        setTotalSpent(0);
      }
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 1500);
    return () => clearInterval(iv);
  }, []);

  const registerUser = async () => {
    if (!lastUid) return alert("Scan a card first to link user.");
    if (!email) return alert("Enter email.");
    if (!pin) return alert("Set a PIN.");

    await fetch(`${BACKEND}/register-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: lastUid, email, pin })
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    loadData();
  };

  const handleRazorpay = async () => {
    if (!lastUid) return alert("Scan a card first.");
    if (!amount || Number(amount) <= 0) return alert("Enter valid amount.");

    setIsLoading(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setIsLoading(false);
      return alert("Razorpay failed to load.");
    }

    const options = {
      key: "rzp_test_Rq4W4iPAoySwFt",
      amount: Number(amount) * 100,
      currency: "INR",
      name: "Elite Pay",
      description: "Add money to wallet",
      handler: async function (response) {
        const res = await fetch(`${BACKEND}/topup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: lastUid, amount: Number(amount) })
        });
        const data = await res.json();
        if (data.newBalance !== undefined) {
          setBalance(data.newBalance);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
          setAmount("");
          loadData();
        }
        setIsLoading(false);
      },
      modal: {
        ondismiss: () => setIsLoading(false)
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const quickAmounts = [100, 500, 1000, 2000];
  const rewardProgress = Math.min((totalSpent / 5000) * 100, 100);

  return (
    <div className="pb-8">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 z-50 px-6 py-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2"
          >
            <span className="text-xl">✓</span>
            <span className="font-medium">Success!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-2xl flex items-center justify-between ${
              isDark 
                ? 'bg-amber-500/10 border border-amber-500/20' 
                : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <span className={`font-medium ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{notification}</span>
            </div>
            <button
              onClick={() => setNotification("")}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                isDark 
                  ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30' 
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              Dismiss
            </button>
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
          Welcome Back 👋
        </h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage your RFID wallet and track your rewards
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 md:col-span-2"
        >
          <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 ${
            isDark ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
          } shadow-xl shadow-indigo-500/20`}>
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="white" />
                </pattern>
                <rect width="100" height="100" fill="url(#dots)" />
              </svg>
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-white/80 text-sm font-medium mb-1">Available Balance</p>
                  <motion.h2
                    key={balance}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-4xl md:text-5xl font-bold text-white"
                  >
                    ₹{balance.toLocaleString()}
                  </motion.h2>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
                      <span className={`w-2 h-2 rounded-full ${lastUid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span className="text-white/90 text-sm font-medium">
                        {lastUid ? 'Card Connected' : 'No Card'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="text-white/80 text-xs font-medium">Card UID</div>
                  <div className="font-mono text-white bg-white/10 px-4 py-2 rounded-xl text-sm">
                    {lastUid ? `${lastUid.slice(0, 8)}...` : 'Tap card to connect'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Total Spent Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-3xl p-6 ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Spent</span>
            <span className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">💸</span>
          </div>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ₹{totalSpent.toLocaleString()}
          </p>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Lifetime spending
          </p>
        </motion.div>
      </div>

      {/* Unified Add Funds & Link Account Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-3xl p-6 md:p-8 ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl`}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30">
            💳
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Wallet Setup & Recharge</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Link your account and add funds</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Side - Link Account */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/30">
                🔐
              </div>
              <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Link Account</h4>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl transition-all ${
                  isDark 
                    ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500 focus:border-indigo-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                } border-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/10`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Security PIN
              </label>
              <input
                type="password"
                placeholder="4-digit PIN"
                value={pin}
                maxLength={4}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className={`w-full px-4 py-3 rounded-xl transition-all ${
                  isDark 
                    ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500 focus:border-indigo-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                } border-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/10`}
              />
            </div>
          </div>

          {/* Right Side - Add Funds */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
                💰
              </div>
              <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Funds</h4>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Quick Amount
              </label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amt) => (
                  <motion.button
                    key={amt}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAmount(String(amt))}
                    className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      amount === String(amt)
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : isDark 
                          ? 'bg-dark-600 text-gray-300 hover:bg-dark-500' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ₹{amt}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Custom Amount
              </label>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>₹</span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isDark 
                      ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500 focus:border-indigo-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                  } border-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/10`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Unified Action Button - Link Account & Pay with Razorpay */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            // First, link account if email and PIN are provided
            if (email && pin) {
              try {
                await registerUser();
              } catch (err) {
                console.error("Error linking account:", err);
              }
            }
            
            // Then, proceed with payment if amount is provided
            if (amount && Number(amount) > 0) {
              handleRazorpay();
            } else if (!email || !pin) {
              alert("Please fill in email and PIN to link your account");
            } else if (!amount) {
              alert("Please enter an amount to add funds");
            }
          }}
          disabled={isLoading || (!email || !pin || !amount || Number(amount) <= 0)}
          className={`w-full mt-6 py-5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
            isLoading || (!email || !pin || !amount || Number(amount) <= 0)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
          
              <span>Top Up and Activate</span>
            </>
          )}
        </motion.button>

        {/* Helper Text */}
        <p className={`mt-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Fill in your email, PIN, and amount to link your account and add funds in one step
        </p>
      </motion.div>

      {/* Rewards Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`mt-6 rounded-3xl p-6 md:p-8 ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
              🎁
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Rewards Program</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {rewardProgress >= 100 ? 'Reward unlocked!' : `Spend ₹${(5000 - totalSpent).toLocaleString()} more to unlock`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md">
            <div className="flex justify-between text-sm mb-2">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Progress</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ₹{totalSpent.toLocaleString()} / ₹5,000
              </span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rewardProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              />
            </div>
          </div>

          {/* Claim Reward Button - Only shows when progress reaches 100% */}
          {rewardProgress >= 100 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/reward')}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30"
            >
              ✨ Claim Reward
            </motion.button>
          )}
        </div>
      </motion.div>

      
    </div>
  );
}
