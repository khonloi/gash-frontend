import React from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';


export default function Layout({ children }) {
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