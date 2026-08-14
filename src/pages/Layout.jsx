import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';

export default function Layout({ children }) {
  const location = useLocation();
  const authPaths = [
    '/login',
    '/signup',
    '/otp-verification',
    '/forgot-password',
    '/reset-password',
    '/register'
  ];

  const isAuthPage = authPaths.includes(location.pathname);

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        {/* Skip Navigation Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg shadow-lg z-50 transition-all"
        >
          Skip to main content
        </a>
        <main id="main-content" className="w-full flex items-center justify-center">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg shadow-lg z-50 transition-all"
      >
        Skip to main content
      </a>

      {/* Header */}
      <Header />

      {/* Dynamic Header Spacing */}
      <div className="h-16 sm:h-28 md:h-32" />

      {/* Main Content with Smooth Page Transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          id="main-content"
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex-1 min-h-[calc(100vh-200px)]"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  );
}