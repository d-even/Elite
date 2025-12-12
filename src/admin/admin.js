import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";

export default function Admin() {
  const [fees, setFees] = useState([]);
  const [totalFees, setTotalFees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useTheme();

  const loadFees = async () => {
    try {
      const res = await fetch("http://localhost:3000/fees");
      const data = await res.json();
      setFees(data);
      const total = data.reduce((sum, f) => sum + Number(f.fee || 0), 0);
      setTotalFees(total);
    } catch (err) {
      console.error("Failed to load fees:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
    const iv = setInterval(loadFees, 5000);
    return () => clearInterval(iv);
  }, []);

  const stats = [
    { 
      label: "Total Revenue", 
      value: `₹${totalFees.toFixed(2)}`, 
      icon: "💰", 
      color: "from-emerald-500 to-teal-600",
      change: "+12.5%"
    },
    { 
      label: "Transactions", 
      value: fees.length, 
      icon: "📊", 
      color: "from-indigo-500 to-purple-600",
      change: "+8.2%"
    },
    { 
      label: "Avg Fee", 
      value: `₹${fees.length ? (totalFees / fees.length).toFixed(2) : '0'}`, 
      icon: "📈", 
      color: "from-amber-500 to-orange-600",
      change: "+3.1%"
    },
    { 
      label: "Active Users", 
      value: new Set(fees.map(f => f.uid)).size, 
      icon: "👥", 
      color: "from-pink-500 to-rose-600",
      change: "+15.3%"
    },
  ];

  return (
    <div className="pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Admin Dashboard ⚙️
        </h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Monitor platform fees and user activity
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${stat.color} shadow-xl`}
          >
            {/* Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <pattern id="circles" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="2" fill="white" />
                </pattern>
                <rect width="100" height="100" fill="url(#circles)" />
              </svg>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/80 text-sm font-medium">{stat.label}</span>
                <span className="text-3xl">{stat.icon}</span>
              </div>
              <motion.p
                key={stat.value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-white"
              >
                {stat.value}
              </motion.p>
              <div className="mt-2 flex items-center gap-1 text-white/80 text-sm">
                <span className="text-emerald-300">↑</span>
                <span>{stat.change}</span>
                <span>this week</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fees Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`rounded-3xl overflow-hidden ${isDark ? 'bg-dark-700 border border-white/5' : 'bg-white border border-gray-200'} shadow-xl`}
      >
        <div className="p-6 md:p-8 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30">
                📋
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Fee Collection History</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Track all platform fees collected</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadFees}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30"
            >
              🔄 Refresh
            </motion.button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl"
              >
                ⏳
              </motion.div>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading transactions...</p>
            </div>
          ) : fees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-500/10 flex items-center justify-center text-4xl">
                📭
              </div>
              <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No fees collected yet</p>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Fees will appear here after transactions</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'bg-dark-600' : 'bg-gray-50'}>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    User
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Card UID
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Fee Amount
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {fees.slice().reverse().map((f, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`border-t ${isDark ? 'border-white/5 hover:bg-dark-600/50' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                            <span className="text-lg">👤</span>
                          </div>
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {f.email || 'Anonymous'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {f.uid ? `${f.uid.slice(0, 8)}...` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold text-sm">
                          ₹{Number(f.fee).toFixed(2)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(f.time).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
