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
          className="text-sm font-medium hover:underline"
          aria-label="Back to top"
        >
          Back to top
        </a>
      </div>

      {/* Links and Contact Information */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 py-10 text-sm">
        {/* Contact Information */}
        <div>
          <h4 className="text-xl font-semibold mb-5">Contact Information</h4>
          <p className="font-medium mb-2">Call Us 24/7 Free</p>
          <p className="text-3xl font-semibold text-amber-500 mt-3 mb-3">
            1 001 234 5678
          </p>
          <p className="mb-2">Support@domain.com</p>
          <p>
            No. 45, National Road 1, Sangkat Bavet, Krong Bavet, Svay Rieng
            Province, Cambodia
          </p>
        </div>

        {/* Company Links */}
        <div>
          <h4 className="text-xl font-semibold mb-5">Company</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="hover:underline">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/products" className="hover:underline">
                Shop Products
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:underline">
                My Cart
              </Link>
            </li>
            <li>
              <Link to="/checkout" className="hover:underline">
                Checkout
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:underline">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:underline">
                Order Tracking
              </Link>
            </li>
          </ul>
        </div>

        {/* Explore Links */}
        <div>
          <h4 className="text-xl font-semibold mb-5">Explore</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/gift" className="hover:underline">
                Gift a Smile
              </Link>
            </li>
            <li>
              <Link to="/cares" className="hover:underline">
                Creybit Cares
              </Link>
            </li>
            <li>
              <Link to="/size-guide" className="hover:underline">
                Size Guide
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:underline">
                F.A.Q.’s
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/store-location" className="hover:underline">
                Store Location
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="bg-[#0f1111] text-center py-4 text-xs border-t border-gray-700">
        <p>© 2025 GASH - All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
