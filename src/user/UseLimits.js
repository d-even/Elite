import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";

const BACKEND = "http://localhost:3000";

export default function UseLimits() {
  const [limitType, setLimitType] = useState("daily"); // daily, weekly, monthly
  const [limitAmount, setLimitAmount] = useState("");
  const [currentSpending, setCurrentSpending] = useState(0);
  const [lastUid, setLastUid] = useState("");
  const [limitSet, setLimitSet] = useState(false);
  const [savedLimit, setSavedLimit] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { isDark } = useTheme();

  // Load current card and spending data
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`${BACKEND}/scans`);
        const data = await res.json();
        const db = data.scans ? data : data;
        const scansArr = db.scans || [];

        if (scansArr.length > 0) {
          const last = scansArr[scansArr.length - 1];
          const uid = last.uid;
          setLastUid(uid);

          // Load saved limit from backend
          try {
            const limitRes = await fetch(`${BACKEND}/limit/${uid}`);
            const limitData = await limitRes.json();
            
            if (limitData.limits && Object.keys(limitData.limits).length > 0) {
              // Get the first active limit (prioritize daily > weekly > monthly)
              const priority = ['daily', 'weekly', 'monthly'];
              const activeLimitType = priority.find(type => limitData.limits[type]) || Object.keys(limitData.limits)[0];
              const limit = limitData.limits[activeLimitType];
              
              const limitObj = {
                type: activeLimitType,
                amount: limit.amount,
                uid: uid,
                setAt: limit.setAt
              };
              
              setSavedLimit(limitObj);
              setLimitType(activeLimitType);
              setLimitAmount(String(limit.amount));
              setLimitSet(true);
              
              // Calculate current spending
              calculateCurrentSpending(uid, limitObj);
            } else {
              setLimitSet(false);
              calculateCurrentSpending(uid, null);
            }
          } catch (err) {
            console.error("Error loading limit:", err);
            // Fallback to localStorage if backend fails
            const saved = localStorage.getItem(`limit_${uid}`);
            if (saved) {
              const limitData = JSON.parse(saved);
              setSavedLimit(limitData);
              setLimitType(limitData.type);
              setLimitAmount(String(limitData.amount));
              setLimitSet(true);
              calculateCurrentSpending(uid, limitData);
            }
          }
        }
      } catch (err) {
        console.error("Load error:", err);
      }
    };

    loadData();
    const iv = setInterval(loadData, 3000);
    return () => clearInterval(iv);
  }, []);

  const calculateCurrentSpending = async (uid, limitData) => {
    if (!limitData) {
      setCurrentSpending(0);
      return;
    }

    try {
      // Get transactions from backend
      const res = await fetch(`${BACKEND}/transactions/${uid}`);
      let transactions = [];
      
      try {
        const data = await res.json();
        transactions = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setCurrentSpending(0);
        return;
      }

      const now = new Date();
      let periodStart;

      if (limitData.type === "daily") {
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (limitData.type === "weekly") {
        const dayOfWeek = now.getDay();
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek);
        periodStart.setHours(0, 0, 0, 0);
      } else if (limitData.type === "monthly") {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const periodTransactions = transactions.filter((t) => {
        const tDate = new Date(t.time || t.timestamp);
        return tDate >= periodStart;
      });

      const total = periodTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      setCurrentSpending(total);
    } catch (err) {
      console.error("Error calculating spending:", err);
      setCurrentSpending(0);
    }
  };

  const handleSetLimit = async () => {
    if (!lastUid) {
      alert("Please scan your card first");
      return;
    }

    if (!limitAmount || Number(limitAmount) <= 0) {
      alert("Please enter a valid limit amount");
      return;
    }

    const limitData = {
      type: limitType,
      amount: Number(limitAmount),
      uid: lastUid,
      setAt: new Date().toISOString()
    };

    try {
      // Save to backend
      const res = await fetch(`${BACKEND}/set-limit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: lastUid,
          type: limitType,
          amount: Number(limitAmount)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to set limit");
        return;
      }

      // Also save to localStorage as backup
      localStorage.setItem(`limit_${lastUid}`, JSON.stringify(limitData));

      setSavedLimit(limitData);
      setLimitSet(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Recalculate spending
      calculateCurrentSpending(lastUid, limitData);
    } catch (err) {
      console.error("Error setting limit:", err);
      alert("Failed to set limit. Please try again.");
    }
  };

  const handleRemoveLimit = async () => {
    if (!lastUid || !savedLimit) return;

    try {
      // Remove from backend
      const res = await fetch(`${BACKEND}/limit/${lastUid}/${savedLimit.type}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to remove limit");
        return;
      }

      // Also remove from localStorage
      localStorage.removeItem(`limit_${lastUid}`);
      
      setSavedLimit(null);
      setLimitSet(false);
      setLimitAmount("");
      setCurrentSpending(0);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error removing limit:", err);
      alert("Failed to remove limit. Please try again.");
    }
  };

  const spendingPercentage = savedLimit 
    ? Math.min((currentSpending / savedLimit.amount) * 100, 100)
    : 0;

  const isLimitExceeded = savedLimit && currentSpending >= savedLimit.amount;
  const remainingAmount = savedLimit ? Math.max(savedLimit.amount - currentSpending, 0) : 0;

  const limitOptions = [
    { value: "daily", label: "Daily", icon: "📅", desc: "Resets every day" },
    { value: "weekly", label: "Weekly", icon: "📆", desc: "Resets every week" },
    { value: "monthly", label: "Monthly", icon: "🗓️", desc: "Resets every month" }
  ];

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
            <span className="font-medium">Spending limit set successfully!</span>
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
          Spending Limits 🔒
        </h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Control your spending by setting daily, weekly, or monthly limits
        </p>
      </motion.div>

      {/* Current Status Card */}
      {savedLimit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 rounded-3xl p-6 md:p-8 ${
            isLimitExceeded
              ? 'bg-gradient-to-br from-red-500 to-rose-600'
              : spendingPercentage >= 80
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
          } shadow-xl`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">
                {savedLimit.type.charAt(0).toUpperCase() + savedLimit.type.slice(1)} Limit
              </p>
              <p className="text-3xl font-bold text-white">₹{savedLimit.amount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm font-medium mb-1">Current Spending</p>
              <p className="text-3xl font-bold text-white">₹{currentSpending.toLocaleString()}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-white/90 mb-2">
              <span>Progress</span>
              <span>{spendingPercentage.toFixed(0)}%</span>
            </div>
            <div className="h-4 rounded-full bg-white/20 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${spendingPercentage}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  isLimitExceeded
                    ? 'bg-red-300'
                    : spendingPercentage >= 80
                      ? 'bg-amber-300'
                      : 'bg-white'
                }`}
              />
            </div>
          </div>

          {/* Status Message */}
          <div className={`p-4 rounded-xl ${
            isLimitExceeded
              ? 'bg-red-600/30 border border-red-400/50'
              : spendingPercentage >= 80
                ? 'bg-amber-600/30 border border-amber-400/50'
                : 'bg-white/10 border border-white/20'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {isLimitExceeded ? '🚫' : spendingPercentage >= 80 ? '⚠️' : '✅'}
              </span>
              <div>
                <p className="text-white font-semibold">
                  {isLimitExceeded
                    ? 'Limit Reached - Payments Blocked'
                    : spendingPercentage >= 80
                      ? `Warning: Only ₹${remainingAmount.toLocaleString()} remaining`
                      : `₹${remainingAmount.toLocaleString()} remaining`}
                </p>
                <p className="text-white/80 text-sm">
                  {isLimitExceeded
                    ? 'Your card payments will be blocked until the limit resets'
                    : 'You can still make payments within your limit'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Limit Configuration Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-3xl p-6 md:p-8 ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl mb-6`}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30">
            🔒
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {savedLimit ? 'Update Limit' : 'Set Spending Limit'}
            </h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              Choose your limit period and amount
            </p>
          </div>
        </div>

        {/* Limit Type Selector */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Limit Period
          </label>
          <div className="grid grid-cols-3 gap-3">
            {limitOptions.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLimitType(option.value)}
                disabled={limitSet && savedLimit?.type === option.value}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  limitType === option.value
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : isDark
                      ? 'bg-dark-600 border-dark-500 text-gray-300 hover:border-indigo-500/50'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-indigo-300'
                } ${limitSet && savedLimit?.type === option.value ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="font-semibold text-sm">{option.label}</div>
                <div className="text-xs opacity-70 mt-1">{option.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Limit Amount (₹)
          </label>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>₹</span>
            <input
              type="number"
              placeholder="Enter limit amount"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              className={`w-full pl-10 pr-4 py-4 rounded-xl text-lg font-medium transition-all ${
                isDark
                  ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500 focus:border-indigo-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
              } border-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/10`}
            />
          </div>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            When this limit is reached, your card payments will be automatically blocked
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {savedLimit ? (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSetLimit}
                className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30"
              >
                Update Limit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRemoveLimit}
                className={`px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                  isDark
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                }`}
              >
                Remove
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSetLimit}
              disabled={!limitAmount || !lastUid}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                !limitAmount || !lastUid
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              }`}
            >
              {!lastUid ? 'Scan Card First' : 'Set Limit'}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-3xl p-6 ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <span className="text-2xl">ℹ️</span>
            </div>
            <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>How It Works</h4>
          </div>
          <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Set your spending limit for daily, weekly, or monthly periods</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Your spending is tracked automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>When limit is reached, payments are blocked</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Limits reset automatically at the start of each period</span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-3xl p-6 ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <span className="text-2xl">🔔</span>
            </div>
            <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h4>
          </div>
          <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>You'll be warned when 80% of your limit is reached</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Blocked payments won't be processed by merchants</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>You can update or remove your limit anytime</span>
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Card Status Warning */}
      {!lastUid && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${
            isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
          }`}
        >
          <span className="text-2xl">⚠️</span>
          <span className={`font-medium ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
            Please scan your RFID card first to set spending limits
          </span>
        </motion.div>
      )}
    </div>
  );
}

