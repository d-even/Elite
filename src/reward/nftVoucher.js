import React, { useState } from "react";
import { ethers } from "ethers";
import abi from "./abi.json";
import { coupons } from "./coupons";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";

const CONTRACT_ADDRESS = "0x67dADB7dE7fAB7Dfd5b38139989d699384B33F71";

export default function NftVoucher() {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [mintingId, setMintingId] = useState(null);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  async function connectWallet() {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
      setStatus("Connecting wallet...");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      setStatus("✅ Wallet connected!");
    } catch (err) {
      setStatus("Failed to connect wallet.");
    }
  }

  async function mint(couponId) {
    if (!window.ethereum) return alert("Install MetaMask!");
    if (!account) return alert("Please connect your wallet first!");
    
    try {
      setLoading(true);
      setMintingId(couponId);
      setStatus("Preparing NFT mint...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      setStatus("🔄 Minting NFT... Confirm in MetaMask");
      const tx = await contract.mintCoupon(couponId);
      
      setStatus("⏳ Waiting for confirmation...");
      await tx.wait();

      setStatus(`✅ NFT Voucher #${couponId} minted successfully!`);
      setLoading(false);
      setMintingId(null);
      
      setTimeout(() => {
        navigate("/reward");
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("❌ Mint failed. Please try again.");
      setLoading(false);
      setMintingId(null);
    }
  }

  const benefits = [
    { icon: "💎", title: "Exclusive Benefits", desc: "Unlock special discounts and early access" },
    { icon: "🔄", title: "Tradeable", desc: "Buy, sell on blockchain marketplaces" },
    { icon: "✅", title: "Authentic", desc: "Verified on the blockchain" },
    { icon: "⭐", title: "Limited Edition", desc: "Rare collectibles" }
  ];

  return (
    <div className="pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-4">
          <span className="text-pink-400">🎫</span>
          <span className="text-sm text-pink-400 font-medium">NFT Collection</span>
        </div>
        
        <h1 className={`text-3xl md:text-5xl font-extrabold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          NFT Vouchers
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Mint exclusive limited edition coupons on blockchain
        </p>
      </motion.div>

      {/* Wallet Connection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-3xl p-6 mb-6 ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${account ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`}>
              <span className="text-2xl">{account ? '✅' : '🔗'}</span>
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Wallet Status</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}
              </p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={connectWallet}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              account 
                ? 'bg-emerald-500 text-white' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
            }`}
          >
            {account ? '✅ Connected' : '🔗 Connect Wallet'}
          </motion.button>
        </div>
      </motion.div>

      {/* Status Message */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
              status.includes('✅') 
                ? isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
                : status.includes('❌') 
                  ? isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
                  : isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <span className="text-xl">
              {status.includes('✅') ? '✅' : status.includes('❌') ? '❌' : '⏳'}
            </span>
            <span className={`font-medium ${
              status.includes('✅') 
                ? isDark ? 'text-emerald-300' : 'text-emerald-700'
                : status.includes('❌') 
                  ? isDark ? 'text-red-300' : 'text-red-700'
                  : isDark ? 'text-amber-300' : 'text-amber-700'
            }`}>
              {status}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {coupons.map((coupon, index) => (
          <motion.div
            key={coupon.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className={`relative overflow-hidden rounded-3xl ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl`}
          >
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
              <img 
                src={coupon.img} 
                alt={coupon.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="absolute top-4 left-4 z-20">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-bold">
                  #{coupon.id}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {coupon.name}
              </h3>
              <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {coupon.description}
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => mint(coupon.id)}
                disabled={loading || !account}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  loading && mintingId === coupon.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white animate-pulse'
                    : !account || loading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white shadow-lg shadow-pink-500/30'
                }`}
              >
                {loading && mintingId === coupon.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Minting...
                  </span>
                ) : !account ? (
                  'Connect Wallet'
                ) : (
                  `🎫 Mint NFT`
                )}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Benefits Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`rounded-3xl p-8 ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-200'}`}
      >
        <h3 className={`text-2xl font-bold text-center mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          ℹ️ About NFT Vouchers
        </h3>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl mb-3">{benefit.icon}</div>
              <h4 className={`font-bold mb-1 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>{benefit.title}</h4>
              <p className={`text-sm ${isDark ? 'text-indigo-200/70' : 'text-indigo-600'}`}>{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
