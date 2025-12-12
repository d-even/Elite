import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";
import { ethers } from "ethers";

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

export default function Reward() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  // Fixed ETH reward amount
  const FIXED_ETH_AMOUNT = 0.3;
  
  // State for ETH claim
  const [walletAddress, setWalletAddress] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  const rewards = [
    {
      id: "eth",
      title: "Ethereum Reward",
      subtitle: `${FIXED_ETH_AMOUNT} ETH`,
      description: "Receive real Ethereum directly to your digital wallet. A valuable cryptocurrency reward for your loyalty!",
      icon: "🪙",
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      benefits: ["Instant transfer", "Trade anytime", "Secure wallet"],
      action: () => navigate("/eth")
    },
    {
      id: "nft",
      title: "NFT Voucher",
      subtitle: "Limited Edition",
      description: "Mint an exclusive NFT voucher with special benefits and trading potential on blockchain!",
      icon: "🎫",
      gradient: "from-pink-500 via-rose-500 to-orange-500",
      benefits: ["Exclusive discounts", "Tradeable asset", "Early access"],
      action: () => navigate("/nftVoucher")
    }
  ];

  const steps = [
    { icon: "1️⃣", title: "Select Reward", desc: "Choose ETH or NFT" },
    { icon: "2️⃣", title: "Connect Wallet", desc: "Link your MetaMask" },
    { icon: "3️⃣", title: "Claim Reward", desc: "Instant blockchain transfer" }
  ];

  // Function to claim ETH reward
  async function claimETHReward() {
    try {
      if (!window.ethereum) {
        setClaimStatus("❌ Please install MetaMask to claim ETH");
        return;
      }
      
      if (!walletAddress) {
        setClaimStatus("⚠️ Please enter your wallet address");
        return;
      }

      // Validate wallet address
      if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        setClaimStatus("❌ Invalid wallet address format");
        return;
      }

      setIsClaiming(true);
      setClaimStatus("🔄 Processing your ETH reward... Please confirm in MetaMask");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      // Convert fixed amount to Wei
      const amountString = FIXED_ETH_AMOUNT.toFixed(8);
      const amountWei = ethers.parseEther(amountString);
      
      const tx = await contract.payFromContract(walletAddress, amountWei);
      
      // Capture transaction hash immediately
      const txHash = tx.hash;
      setTransactionHash(txHash);
      setClaimStatus("⏳ Transaction submitted! Waiting for confirmation...");
      
      await tx.wait();

      setClaimStatus(`🎉 Successfully claimed ${FIXED_ETH_AMOUNT} ETH! Check your wallet.`);
      setIsClaiming(false);
      
      // Clear form after success (but keep transaction hash)
      setTimeout(() => {
        setWalletAddress("");
        setClaimStatus("");
        // Keep transaction hash visible for user to view on PolygonScan
      }, 5000);
    } catch (err) {
      console.error(err);
      
      // Handle user rejection gracefully
      if (err.code === 'ACTION_REJECTED' || err.code === 4001 || err.reason === 'rejected' || err.message?.includes('denied') || err.message?.includes('rejected')) {
        setClaimStatus("");
        setIsClaiming(false);
        return;
      }
      
      setClaimStatus("❌ Error: " + (err.message || "Transaction failed. Please try again."));
      setIsClaiming(false);
    }
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-emerald-400 font-medium">Reward Unlocked!</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-4xl md:text-6xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          🎉 Congratulations!
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}
        >
          You've unlocked exclusive blockchain rewards! Choose your prize and claim it today.
        </motion.p>
      </motion.div>

      {/* Rewards Grid */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
        {rewards.map((reward, index) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            whileHover={{ y: -8 }}
            className={`relative overflow-hidden rounded-3xl ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-2xl`}
          >
            {/* Gradient Header */}
            <div className={`relative h-48 bg-gradient-to-br ${reward.gradient} p-8 flex items-center justify-center`}>
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <pattern id={`pattern-${reward.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1.5" fill="white" />
                  </pattern>
                  <rect width="100" height="100" fill={`url(#pattern-${reward.id})`} />
                </svg>
              </div>
              
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 text-center"
              >
                <span className="text-7xl mb-4 block">{reward.icon}</span>
                <h3 className="text-2xl font-bold text-white">{reward.title}</h3>
                <p className="text-white/80">{reward.subtitle}</p>
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-8">
              <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {reward.description}
              </p>

              {/* Benefits */}
              <div className="mb-6">
                <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Benefits:</h4>
                <ul className="space-y-2">
                  {reward.benefits.map((benefit, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              {reward.id === 'eth' ? (
                <div className="space-y-4">
                  {/* Wallet Address Input */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      💼 Your Wallet Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl font-mono transition-all ${
                        isDark 
                          ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500 focus:border-indigo-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                      } border-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/10`}
                    />
                  </div>
                  
                  {/* Fixed Amount Display */}
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        Reward Amount:
                      </span>
                      <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-indigo-900'}`}>
                        {FIXED_ETH_AMOUNT} ETH
                      </span>
                    </div>
                  </div>
                  
                  {/* Status Message */}
                  <AnimatePresence>
                    {claimStatus && !claimStatus.includes('❌') && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-3 rounded-xl text-sm ${
                          claimStatus.includes('🎉')
                            ? isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                            : isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {claimStatus}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Claim Button */}
                  <motion.button
                    whileHover={{ scale: walletAddress && !isClaiming ? 1.02 : 1 }}
                    whileTap={{ scale: walletAddress && !isClaiming ? 0.98 : 1 }}
                    onClick={claimETHReward}
                    disabled={!walletAddress || isClaiming}
                    className={`w-full py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r ${reward.gradient} shadow-lg hover:shadow-xl transition-shadow ${
                      !walletAddress || isClaiming ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isClaiming ? (
                      <>
                        <svg className="animate-spin w-5 h-5 inline-block mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Claiming...
                      </>
                    ) : (
                      '✨ Claim ETH Reward'
                    )}
                  </motion.button>

                  {/* Transaction Hash with PolygonScan Link */}
                  {transactionHash && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-dark-600 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Transaction Hash:
                          </p>
                          <p className={`text-xs font-mono truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {transactionHash}
                          </p>
                        </div>
                        <motion.a
                          href={`https://mumbai.polygonscan.com/tx/${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                            isDark
                              ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                          } shadow-lg hover:shadow-xl`}
                        >
                          🔗 View on PolygonScan
                        </motion.a>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={reward.action}
                  className={`w-full py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r ${reward.gradient} shadow-lg hover:shadow-xl transition-shadow`}
                >
                  Mint NFT Voucher
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      
    </div>
  );
}
