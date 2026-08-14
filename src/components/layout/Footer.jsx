import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#131921] text-white" role="contentinfo">
      {/* Back to top */}
      <div className="bg-[#232f3e] py-4 text-center">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="text-sm font-medium hover:underline text-gray-200 hover:text-white transition-colors"
          aria-label="Back to top"
        >
          Back to top
        </a>
      </div>

      {/* Links and Contact Information */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 py-12 text-xs sm:text-sm">
        {/* Contact Information */}
        <div>
          <h4 className="text-lg sm:text-xl font-bold mb-4 text-white">Contact Information</h4>
          <p className="font-medium text-gray-300 mb-1">Call Us 24/7 Free</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-500 my-2">
            +1 (305) 555-4274
          </p>
          <p className="text-gray-300 mb-3">support@gash.com</p>
          <p className="text-gray-400 leading-relaxed">
            GASH Corporate Office <br />
            1200 Commerce Avenue<br />
            Downtown Vice City, FL 33130<br />
            United States
          </p>
        </div>

        {/* Company Links */}
        <div>
          <h4 className="text-lg sm:text-xl font-bold mb-4 text-white">Company</h4>
          <ul className="space-y-2.5 text-gray-300">
            <li>
              <Link to="/products" className="hover:text-amber-400 transition-colors">
                Shop Products
              </Link>
            </li>
            <li>
              <Link to="/news" className="hover:text-amber-400 transition-colors">
                News & Blog
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-amber-400 transition-colors">
                About & Contact
              </Link>
            </li>
            <li>
              <Link to="/vouchers" className="hover:text-amber-400 transition-colors">
                Vouchers & Rewards
              </Link>
            </li>
            <li>
              <Link to="/live" className="hover:text-amber-400 transition-colors">
                Live Shopping
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care Links */}
        <div>
          <h4 className="text-lg sm:text-xl font-bold mb-4 text-white">Customer Care</h4>
          <ul className="space-y-2.5 text-gray-300">
            <li>
              <Link to="/orders" className="hover:text-amber-400 transition-colors">
                Track My Orders
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-amber-400 transition-colors">
                My Shopping Cart
              </Link>
            </li>
            <li>
              <Link to="/favorites" className="hover:text-amber-400 transition-colors">
                Wishlist & Favorites
              </Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-amber-400 transition-colors">
                Account Settings
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-amber-400 transition-colors">
                Support & FAQs
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="bg-[#0f1111] text-center py-4 text-xs text-gray-400 border-t border-gray-800">
        <p>© 2026 GASH Inc. All rights reserved. Global Fits, Zero Limits.</p>
      </div>
    </footer>
  );
};

export default Footer;
