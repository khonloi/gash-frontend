import React from 'react';
import { useLocation } from 'react-router-dom';
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
        <main className="w-full flex items-center justify-center">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] bg-gray-50 flex flex-col">
      {/* Navbar */}
      <Header />

      {/* Spacer để tránh nội dung bị che bởi fixed header */}
      <div className="h-16 md:h-32" />

      {/* Main content */}
      <main className="flex-1 min-h-screen">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}