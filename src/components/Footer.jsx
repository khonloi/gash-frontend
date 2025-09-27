import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="bg-[#131921] text-white mt-12" role="contentinfo">
            {/* Back to top */}
            <div className="bg-[#232f3e] py-3 text-center">
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

            {/* Links */}
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 py-10 text-sm">
                <div>
                    <h4 className="font-semibold mb-3">Get to Know Us</h4>
                    <ul className="space-y-2">
                        <li><Link to="/about" className="hover:underline">About Us</Link></li>
                        <li><Link to="/careers" className="hover:underline">Careers</Link></li>
                        <li><Link to="/press" className="hover:underline">Press Releases</Link></li>
                        <li><Link to="/investor" className="hover:underline">Investor Relations</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Make Money with Us</h4>
                    <ul className="space-y-2">
                        <li><Link to="/sell" className="hover:underline">Sell products</Link></li>
                        <li><Link to="/business" className="hover:underline">Business</Link></li>
                        <li><Link to="/affiliate" className="hover:underline">Become an Affiliate</Link></li>
                        <li><Link to="/advertise" className="hover:underline">Advertise Your Products</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Payment Products</h4>
                    <ul className="space-y-2">
                        <li><Link to="/credit-card" className="hover:underline">Business Card</Link></li>
                        <li><Link to="/shop-points" className="hover:underline">Shop with Points</Link></li>
                        <li><Link to="/reload" className="hover:underline">Reload Your Balance</Link></li>
                        <li><Link to="/currency" className="hover:underline">Currency Converter</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Let Us Help You</h4>
                    <ul className="space-y-2">
                        <li><Link to="/profile" className="hover:underline">Your Account</Link></li>
                        <li><Link to="/orders" className="hover:underline">Your Orders</Link></li>
                        <li><Link to="/shipping" className="hover:underline">Shipping Rates & Policies</Link></li>
                        <li><Link to="/returns" className="hover:underline">Returns & Replacements</Link></li>
                        <li><Link to="/help" className="hover:underline">Help</Link></li>
                    </ul>
                </div>
            </div>

            {/* Bottom */}
            <div className="bg-[#0f1111] text-center py-4 text-xs border-t border-gray-700">
                <p>© 2025 Gash - All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
