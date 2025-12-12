import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const onboardingSteps = [
    {
      icon: "💳",
      title: "Tap & Pay",
      description: "Simply tap your RFID card at any merchant terminal. No app needed, no QR codes - just tap and go.",
      color: "from-indigo-500 to-purple-600",
      bg: "bg-indigo-500/10"
    },
    {
      icon: "💰",
      title: "Instant Recharge",
      description: "Add funds instantly via Razorpay. Your balance updates in real-time on your connected card.",
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-500/10"
    },
    {
      icon: "🎁",
      title: "Earn Crypto Rewards",
      description: "Spend ₹5,000 and unlock exclusive blockchain rewards - real ETH or tradeable NFT vouchers!",
      color: "from-pink-500 to-rose-600",
      bg: "bg-pink-500/10"
    },
    {
      icon: "🔒",
      title: "Secure & Transparent",
      description: "PIN protection for high-value transactions. All rewards verified on blockchain.",
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-500/10"
    }
  ];

  const features = [
    { icon: "⚡", title: "Instant Payments", desc: "Sub-second transaction speed" },
    { icon: "🔐", title: "PIN Protected", desc: "Secure high-value transactions" },
    { icon: "📱", title: "No App Required", desc: "Works with any RFID card" },
    { icon: "🌐", title: "Blockchain Verified", desc: "Immutable reward records" }
  ];

  const stats = [
    { value: "0.5s", label: "Avg Transaction Time" },
    { value: "100%", label: "Blockchain Verified" },
    { value: "₹5K", label: "Reward Threshold" },
    { value: "24/7", label: "Always Available" }
  ];

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowOnboarding(false);
      navigate('/user');
    }
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
    navigate('/user');
  };

  // Particles animation
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10
  }));

  return (
    <div className="min-h-screen bg-dark-900 overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 mesh-gradient" />
      <div className="fixed inset-0 grid-pattern" />
      
      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="fixed rounded-full bg-indigo-500/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col">
          {/* Navbar */}
          <motion.nav 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="px-6 py-6"
          >
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">
                  💳
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Elite.Pay</h1>
                  
                </div>
              </motion.div>
              
              <div className="hidden md:flex items-center gap-8">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate('/merchant')}
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Merchants
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate('/admin')}
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Admin
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/user')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-indigo-500/30 btn-glow"
                >
                  Launch App
                </motion.button>
              </div>
            </div>
          </motion.nav>

          {/* Hero Content */}
          <div className="flex-1 flex items-center justify-center px-6 pb-20">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-indigo-300 font-medium">Web3 Powered Payments</span>
                </motion.div>
                
                <motion.h1 
                  className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="text-white">Tap. Redeem. Activite.</span>
                  <br />
                </motion.h1>
                
                
                
                <motion.div 
                  className="flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(99, 102, 241, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowOnboarding(true)}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl font-bold text-lg text-white shadow-xl shadow-indigo-500/30 btn-glow"
                  >
                    Get Started
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowOnboarding(true)}
                    className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg text-white hover:bg-white/10 transition-colors"
                  >
                    How it Works
                  </motion.button>
                </motion.div>

                {/* Stats */}
                <motion.div 
                  className="grid grid-cols-4 gap-4 mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="text-center"
                    >
                      <div className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right Content - 3D Card */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative hidden lg:block"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-3xl" />
                
                {/* Credit Card */}
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    rotateY: [0, 5, 0],
                    rotateX: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="relative z-10"
                >
                  <div className="w-96 h-56 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 shadow-2xl shadow-indigo-500/40 relative overflow-hidden">
                    {/* Card Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] animate-shimmer" />
                    
                    {/* Card Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                          <circle cx="5" cy="5" r="1" fill="white" />
                        </pattern>
                        <rect width="100" height="100" fill="url(#grid)" />
                      </svg>
                    </div>
                    
                    {/* Card Content */}
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white/80 text-xs uppercase tracking-wider mb-1">Elite.Pay</div>
                          
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                          <span className="text-2xl">⚡</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex gap-3 mb-4">
                          <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg" />
                          <div className="w-8 h-10 rounded-lg bg-gradient-to-r from-amber-300/50 to-transparent flex items-center justify-center">
                            <div className="w-4 h-6 border-2 border-amber-300/50 rounded" />
                          </div>
                        </div>
                        <div className="font-mono text-white/90 text-lg tracking-widest">
                          •••• •••• •••• 4242
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-white/60 text-xs">Balance</div>
                          <div className="text-white font-bold text-xl">₹2,450</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-500/80" />
                          <div className="w-8 h-8 rounded-full bg-amber-500/80 -ml-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-8 -right-8 w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <span className="text-3xl">🎁</span>
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-4 -left-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
                >
                  <span className="text-2xl">🪙</span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent" />
          
          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Why Choose <span className="gradient-text">Elite Pay</span>?
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                The perfect blend of convenience and blockchain technology
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="p-6 rounded-3xl bg-dark-700/50 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 card-hover"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 text-3xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-50" />
              
              <div className="relative p-12 md:p-16 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                    Ready to Earn Crypto?
                  </h2>
                  <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                    Join thousands of users who are already earning blockchain rewards with every tap.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/user')}
                    className="px-10 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-shadow"
                  >
                    Get Started Now →
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">
                💳
              </div>
              <span className="text-white font-semibold">Elite.Pay</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 Elite Pay. Powered by Blockchain.
            </p>
          </div>
        </footer>
      </div>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={skipOnboarding}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg"
            >
              <div className="bg-dark-800 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Progress Bar */}
                <div className="h-1 bg-dark-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                {/* Content */}
                <div className="p-8 md:p-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      {/* Icon */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                        className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${onboardingSteps[currentStep].color} mx-auto mb-6 flex items-center justify-center shadow-xl`}
                      >
                        <span className="text-5xl">{onboardingSteps[currentStep].icon}</span>
                      </motion.div>
                      
                      {/* Title */}
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        {onboardingSteps[currentStep].title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-400 text-lg leading-relaxed mb-8">
                        {onboardingSteps[currentStep].description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={skipOnboarding}
                      className="text-gray-500 hover:text-white transition-colors font-medium"
                    >
                      Skip
                    </button>
                    
                    {/* Dots */}
                    <div className="flex gap-2">
                      {onboardingSteps.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentStep(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentStep 
                              ? 'w-8 bg-gradient-to-r from-indigo-500 to-purple-500' 
                              : 'bg-gray-600 hover:bg-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={nextStep}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg"
                    >
                      {currentStep === onboardingSteps.length - 1 ? "Get Started" : "Next"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;

