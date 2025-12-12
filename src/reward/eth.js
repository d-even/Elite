import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";

const CONTRACT_ADDRESS = "0xb615B2a9af47b438D0A3F1fc51Cabf861F97D32C";

const ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "receiver", "type": "address" },
      { "internalType": "uint256", "name": "amountWei", "type": "uint256" }
    ],
    "name": "payFromContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }],
    "name": "sendEth",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "stateMutability": "payable", "type": "receive" },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const BACKEND = "http://localhost:3000";

function Eth() {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [priceUSD, setPriceUSD] = useState(null);
  const [priceINR, setPriceINR] = useState(null);
  const [status, setStatus] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUid, setLastUid] = useState("");
  
  const { isDark } = useTheme();

  const [priceChange, setPriceChange] = useState({ usd: 0, inr: 0 }); // Track price changes
  const lastPriceRef = useRef({ usd: null, inr: null });

  // Auto-load ETH price on mount and refresh every 30 seconds
  useEffect(() => {
    const loadPrice = async () => {
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,inr"
        );
        const newUSD = response.data.ethereum.usd;
        const newINR = response.data.ethereum.inr;

        // Calculate price change
        if (lastPriceRef.current.usd) {
          setPriceChange({
            usd: newUSD - lastPriceRef.current.usd,
            inr: newINR - lastPriceRef.current.inr
          });
          
          // Reset price change after 5 seconds
          setTimeout(() => {
            setPriceChange({ usd: 0, inr: 0 });
          }, 5000);
        }

        setPriceUSD(newUSD);
        setPriceINR(newINR);
        lastPriceRef.current = { usd: newUSD, inr: newINR };
      } catch (err) {
        console.error("Error fetching ETH price:", err);
      }
    };

    // Load immediately
    loadPrice();
    
    // Refresh every 30 seconds
    const priceInterval = setInterval(loadPrice, 30000);
    
    return () => clearInterval(priceInterval);
  }, []);

  // Load user's card UID
  useEffect(() => {
    const loadCardUID = async () => {
      try {
        const res = await fetch(`${BACKEND}/scans`);
        const data = await res.json();
        const db = data.scans ? data : data;
        const scansArr = db.scans || [];
        if (scansArr.length > 0) {
          const last = scansArr[scansArr.length - 1];
          setLastUid(last.uid);
        }
      } catch (err) {
        console.error("Error loading card:", err);
      }
    };
    loadCardUID();
    const iv = setInterval(loadCardUID, 3000);
    return () => clearInterval(iv);
  }, []);

  // Price fetching is now automatic via useEffect

  // Auto-calculate discount when amount changes
  useEffect(() => {
    if (!amount || !receiver) {
      setDiscount(0);
      setFinalAmount(0);
      return;
    }

    const ethAmount = parseFloat(amount);
    
    if (!ethAmount || ethAmount < 0.0001 || ethAmount > 0.0003) {
      setDiscount(0);
      setFinalAmount(0);
      return;
    }

    if (!priceUSD) {
      setDiscount(0);
      setFinalAmount(0);
      return;
    }

    const ethValueUSD = ethAmount * priceUSD;
    const discountUSD = ethValueUSD * 0.008;
    const discountETH = discountUSD / priceUSD;
    // Round to 8 decimal places to avoid floating point precision issues
    const totalETH = parseFloat((ethAmount + discountETH).toFixed(8));

    setDiscount(parseFloat(discountETH.toFixed(8)));
    setFinalAmount(totalETH);
  }, [amount, priceUSD, receiver]);

  async function sendFromContract() {
    try {
      if (!window.ethereum) {
        setStatus("❌ Please install MetaMask to receive ETH");
        return;
      }
      if (!receiver || !amount) {
        setStatus("⚠️ Please enter your wallet address and amount");
        return;
      }

      const ethAmount = parseFloat(amount);
      if (ethAmount < 0.0001 || ethAmount > 0.0003) {
        setStatus("❌ Amount must be between 0.0001 and 0.0003 ETH");
        return;
      }

      if (!priceUSD || !discount || !finalAmount) {
        setStatus("⚠️ Please wait for discount calculation");
        return;
      }

      // Validate wallet address
      if (!receiver.startsWith('0x') || receiver.length !== 42) {
        setStatus("❌ Invalid wallet address format");
        return;
      }

      setIsLoading(true);
      setStatus("🔄 Processing your ETH reward... Please confirm in MetaMask");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      // Round to 8 decimal places and format as string to avoid floating point precision issues
      // Use toFixed() directly on the string to ensure proper formatting for parseEther
      const amountString = finalAmount.toFixed(8);
      const amountWei = ethers.parseEther(amountString);
      
      const tx = await contract.payFromContract(receiver, amountWei);
      setStatus("⏳ Transaction submitted! Waiting for confirmation...");
      
      await tx.wait();

      setStatus(`🎉 Successfully received ${finalAmount.toFixed(6)} ETH (${amount} ETH + ${discount.toFixed(6)} ETH bonus)!`);
      setIsLoading(false);
      
      // Clear form after success
      setTimeout(() => {
        setAmount("");
        setReceiver("");
        setDiscount(0);
        setFinalAmount(0);
        setStatus("");
      }, 5000);
    } catch (err) {
      console.error(err);
      
      // Handle user rejection gracefully - don't show error message
      if (err.code === 'ACTION_REJECTED' || err.code === 4001 || err.reason === 'rejected' || err.message?.includes('denied') || err.message?.includes('rejected')) {
        // User rejected transaction - silently handle it, just clear loading state
        setStatus("");
        setIsLoading(false);
        return;
      }
      
      // Only show errors for actual failures, not user rejections
      setStatus("❌ Error: " + (err.message || "Transaction failed. Please try again."));
      setIsLoading(false);
    }
  }



  return (
    <div className="pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
          <span className="text-indigo-400">💎</span>
          <span className="text-sm text-indigo-400 font-medium">ETH Rewards</span>
        </div>
        
        <h1 className={`text-3xl md:text-5xl font-extrabold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          ETH Payment Dashboard
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Secure payments with 0.8% admin discount bonus
        </p>
      </motion.div>

      {/* Live ETH Price Display - Unique Animated Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 relative overflow-hidden rounded-3xl"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        
        {/* Content */}
        <div className="relative z-10 p-8">
          {/* Header with Live Indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl"
              >
                💎
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Live ETH Price</h2>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-emerald-400"
                  />
                  <span className="text-white/80 text-sm">Live • Updates every 30s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Display */}
          {priceUSD && priceINR ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* USD Price */}
              <motion.div
                key={priceUSD}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70 text-sm font-medium">USD</span>
                    {priceChange.usd !== 0 && (
                      <motion.span
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          priceChange.usd > 0 
                            ? 'bg-emerald-500/30 text-emerald-200' 
                            : 'bg-red-500/30 text-red-200'
                        }`}
                      >
                        {priceChange.usd > 0 ? '↑' : '↓'} {Math.abs(priceChange.usd).toFixed(2)}
                      </motion.span>
                    )}
                  </div>
                  <motion.p
                    key={priceUSD}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-4xl md:text-5xl font-extrabold text-white"
                  >
                    ${priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </motion.p>
                  <p className="text-white/60 text-xs mt-2">Per Ethereum</p>
                </div>
              </motion.div>

              {/* INR Price */}
              <motion.div
                key={priceINR}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70 text-sm font-medium">INR</span>
                    {priceChange.inr !== 0 && (
                      <motion.span
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          priceChange.inr > 0 
                            ? 'bg-emerald-500/30 text-emerald-200' 
                            : 'bg-red-500/30 text-red-200'
                        }`}
                      >
                        {priceChange.inr > 0 ? '↑' : '↓'} ₹{Math.abs(priceChange.inr).toFixed(2)}
                      </motion.span>
                    )}
                  </div>
                  <motion.p
                    key={priceINR}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-4xl md:text-5xl font-extrabold text-white"
                  >
                    ₹{priceINR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </motion.p>
                  <p className="text-white/60 text-xs mt-2">Per Ethereum</p>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/30 border-t-white"
                />
                <p className="text-white/80">Loading live price...</p>
              </div>
            </div>
          )}

          {/* Exchange Rate Info */}
          {priceUSD && priceINR && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 pt-6 border-t border-white/20"
            >
              <div className="flex items-center justify-center gap-4 text-white/70 text-sm">
                <span>💱 Exchange Rate:</span>
                <span className="font-semibold text-white">1 ETH = ₹{priceINR.toLocaleString()}</span>
                <span className="text-white/50">•</span>
                <span className="font-semibold text-white">${priceUSD.toLocaleString()}</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Get ETH Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-3xl p-6 md:p-8 ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl`}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30">
            🎁
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Get ETH Rewards</h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Claim your ETH with 0.8% bonus discount</p>
          </div>
        </div>

        {/* Receiver Wallet Input */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            💼 Your Receiving Wallet Address
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className={`w-full px-4 py-4 rounded-xl font-mono transition-all ${
              isDark 
                ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500 focus:border-emerald-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500'
            } border-2 focus:outline-none focus:ring-4 focus:ring-emerald-500/10`}
          />
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Enter your wallet address where you want to receive ETH
          </p>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            💰 ETH Amount (0.0001 - 0.0003 ETH)
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g., 0.0002"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-4 rounded-xl transition-all ${
                isDark 
                  ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500 focus:border-emerald-500' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500'
              } border-2 focus:outline-none focus:ring-4 focus:ring-emerald-500/10`}
            />
            <span className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
              ETH
            </span>
          </div>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Enter the amount you want to claim (between 0.0001 and 0.0003 ETH)
          </p>
        </div>

        {/* Discount Breakdown - Auto-shown when amount is valid */}
        <AnimatePresence>
          {discount > 0 && amount && receiver && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-2 border-emerald-500/30 p-6 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-2xl"
                >
                  ✨
                </motion.div>
                <h4 className={`text-lg font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  Discount Breakdown
                </h4>
              </div>
              <div className="space-y-3">
                <div className={`flex justify-between items-center p-4 rounded-xl ${isDark ? 'bg-dark-600/50' : 'bg-white/80'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📥</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Base Amount:</span>
                  </div>
                  <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{parseFloat(amount).toFixed(6)} ETH</span>
                </div>
                <div className={`flex justify-between items-center p-4 rounded-xl ${isDark ? 'bg-dark-600/50' : 'bg-white/80'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Bonus (0.8%):</span>
                  </div>
                  <span className={`font-bold text-lg text-emerald-500`}>+{discount.toFixed(6)} ETH</span>
                </div>
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="flex justify-between items-center p-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <span className="font-semibold text-lg">Total You'll Receive:</span>
                  </div>
                  <span className="font-bold text-2xl">{finalAmount.toFixed(6)} ETH</span>
                </motion.div>
                {priceUSD && priceINR && (
                  <div className={`mt-3 pt-3 border-t ${isDark ? 'border-emerald-500/20' : 'border-emerald-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isDark ? 'text-emerald-300/80' : 'text-emerald-700/80'}`}>
                        💵 USD Value:
                      </span>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        ${(finalAmount * priceUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-sm font-medium ${isDark ? 'text-emerald-300/80' : 'text-emerald-700/80'}`}>
                        🇮🇳 INR Value:
                      </span>
                      <span className={`text-lg font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        ₹{(finalAmount * priceINR).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Messages */}
        {amount && (!receiver || !receiver.startsWith('0x') || receiver.length !== 42) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}
          >
            <p className={`flex items-center gap-2 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              <span>⚠️</span>
              <span>Please enter a valid Ethereum wallet address (0x...)</span>
            </p>
          </motion.div>
        )}

        {amount && (parseFloat(amount) < 0.0001 || parseFloat(amount) > 0.0003) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}
          >
            <p className={`flex items-center gap-2 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
              <span>❌</span>
              <span>Amount must be between 0.0001 and 0.0003 ETH</span>
            </p>
          </motion.div>
        )}

        {/* Status - Only show success and processing messages, not errors */}
        <AnimatePresence>
          {status && !status.includes('❌') && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl ${
                status.includes('🎉') || status.includes('✅')
                  ? isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                  : isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'
              }`}
            >
              <p className="font-medium">{status}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Get ETH Button */}
        <motion.button
          whileHover={{ scale: discount > 0 && receiver && !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: discount > 0 && receiver && !isLoading ? 0.98 : 1 }}
          onClick={sendFromContract}
          disabled={!discount || !receiver || isLoading || parseFloat(amount) < 0.0001 || parseFloat(amount) > 0.0003}
          className={`w-full py-5 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-3 ${
            !discount || !receiver || isLoading || parseFloat(amount) < 0.0001 || parseFloat(amount) > 0.0003
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/30 hover:shadow-2xl'
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
          ) : discount > 0 && receiver ? (
            <>
              <span>🎁</span>
              <span>Get Discounted ETH</span>
            </>
          ) : (
            <>
              <span>⏳</span>
              <span>Enter wallet address and amount</span>
            </>
          )}
        </motion.button>
      </motion.div>


      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          🔒 Secure • Transparent • Instant
        </p>
        
      </motion.div>
    </div>
  );
}

export default Eth;
