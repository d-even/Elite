import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useTheme } from '../ThemeContext';

const Layout = ({ children }) => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Background Effects */}
      {isDark && (
        <>
          <div className="fixed inset-0 mesh-gradient pointer-events-none" />
          <div className="fixed inset-0 grid-pattern pointer-events-none" />
        </>
      )}
      
      <div className="relative z-10">
        <Navbar />
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;

