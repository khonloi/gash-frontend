import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, LocationOn, ArrowUpward, ContactMail, Facebook, Instagram } from "@mui/icons-material";
import gashLogo from "../assets/image/gash-logo.svg";

const Footer = () => {
  return (
    <footer className="bg-[#131921] text-white" role="contentinfo">
      {/* Back to top */}
      <div className="bg-[#232f3e] py-2 sm:py-3 text-center border-b border-gray-800/50">
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-gray-400 hover:text-amber-500 transition-all duration-200 hover:gap-2 sm:hover:gap-3"
          aria-label="Back to top"
        >
          <ArrowUpward fontSize="small" />
          <span className="text-xs">Back to top</span>
        </button>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 lg:gap-16">
          {/* Logo - Left */}
          <div className="flex-shrink-0">
            <Link to="/" className="inline-block group">
              <img
                src={gashLogo}
                alt="GASH Logo"
                className="h-7 sm:h-9 lg:h-11 transition-transform duration-200 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Contact Information - Center */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <a
                href="tel:0815129329"
                className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-[#232f3e]/50 hover:bg-[#232f3e] transition-all duration-200 border border-transparent hover:border-amber-500/20"
              >
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Phone fontSize="small" className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                  <p className="text-xs sm:text-sm font-medium text-white group-hover:text-amber-500 transition-colors">
                    0815 129 329
                  </p>
                </div>
              </a>

              <a
                href="mailto:quocbaong239@gmail.com"
                className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-[#232f3e]/50 hover:bg-[#232f3e] transition-all duration-200 border border-transparent hover:border-amber-500/20"
              >
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Mail fontSize="small" className="text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <p className="text-xs sm:text-sm font-medium text-white group-hover:text-amber-500 transition-colors break-all">
                    quocbaong239@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="https://maps.app.goo.gl/c2wDRfMSB3cs4byM6"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-[#232f3e]/50 hover:bg-[#232f3e] transition-all duration-200 border border-transparent hover:border-amber-500/20"
              >
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5 group-hover:bg-amber-500/20 transition-colors">
                  <LocationOn fontSize="small" className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Address</p>
                  <p className="text-xs sm:text-sm font-medium text-white group-hover:text-amber-500 transition-colors leading-relaxed">
                    Nguyen Van Cu, Can Tho City, Vietnam
                  </p>
                </div>
              </a>

              <Link
                to="/contact"
                className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-[#232f3e]/50 hover:bg-[#232f3e] transition-all duration-200 border border-transparent hover:border-amber-500/20"
              >
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <ContactMail fontSize="small" className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Get in touch</p>
                  <p className="text-xs sm:text-sm font-medium text-white group-hover:text-amber-500 transition-colors">
                    Contact Us
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Social Media Links - Right */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <h4 className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4 text-white text-center lg:text-left">Follow Us</h4>
            <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <a
                href="https://zalo.me/0815129329"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#232f3e] to-[#1a2530] hover:from-[#0068FF] hover:to-[#0052CC] flex items-center justify-center border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 hover:scale-110"
                aria-label="Zalo"
              >
                <span className="text-lg sm:text-xl font-bold text-gray-300 group-hover:text-white transition-all duration-300">Z</span>
              </a>
              <a
                href="https://www.facebook.com/nqb.aries/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#232f3e] to-[#1a2530] hover:from-blue-600 hover:to-blue-700 flex items-center justify-center border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="text-gray-300 group-hover:text-white transition-all duration-300" fontSize="small" style={{ fontSize: '1.1rem' }} />
              </a>
              <a
                href="https://www.instagram.com/quocbaong99/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#232f3e] to-[#1a2530] hover:from-pink-600 hover:to-purple-600 flex items-center justify-center border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300 shadow-lg hover:shadow-pink-500/20 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="text-gray-300 group-hover:text-white transition-all duration-300" fontSize="small" style={{ fontSize: '1.1rem' }} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#0f1111] border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <p className="text-gray-500 text-xs text-center">
            © 2025 <span className="text-amber-500 font-semibold">GASH</span> - All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
