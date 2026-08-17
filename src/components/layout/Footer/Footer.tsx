import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  PhoneCall,
  MapPin,
  Building2,
  FileText,
  CheckCircle2,
} from "lucide-react";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Main 5-Column Grid */}
      <div className="container">
        <div className={styles.footerGrid}>
          {/* Column 1: Company / Legal & Offices */}
          <div className={styles.column}>
            <div className={styles.brandGroup}>
              <div className={styles.logoBadge}>
                <span className={styles.logoText}>JOCK</span>
                <span className={styles.logoAccent}>SPORT</span>
              </div>
              <h3 className={styles.companyName}>
                KAISON SPORTS RETAIL GROUP LLC (KSRG)
              </h3>
            </div>

            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <Building2 size={16} className={styles.infoIcon} />
                <p>
                  <strong>Headquarters:</strong> 108 Ocean Drive, Starfish
                  Island, Vice City, VC 33139
                </p>
              </div>

              <div className={styles.infoItem}>
                <MapPin size={16} className={styles.infoIcon} />
                <p>
                  <strong>Logistics Hub:</strong> 42 Washington Beach Blvd, Vice
                  City Port, VC 33127
                </p>
              </div>

              <div className={styles.infoItem}>
                <PhoneCall size={16} className={styles.infoIcon} />
                <p>
                  <strong>Hotline:</strong> 1-800-555-JOCK (08:00 - 21:00 Daily)
                </p>
              </div>

              <div className={styles.infoItem}>
                <FileText size={16} className={styles.infoIcon} />
                <p>
                  <strong>Business ID:</strong> VC-6080083547, Licensed under
                  Vice City Dept. of Commerce
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: About Kaison / Jocksport */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>ABOUT JOCKSPORT</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="#" className={styles.link}>
                  Brand Heritage & Mission
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Club Jock VIP Loyalty
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Vice City Store Locator
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Contact & Inquiries
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Terms & Conditions of Sale
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Careers & Athletic Partnerships
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Sports Journal & News
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>CUSTOMER SUPPORT</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="#" className={styles.link}>
                  Shipping & Express Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  30-Day Returns & Warranty Policy
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  0% Interest Installment / BNPL
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Privacy & Data Security Policy
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Help Center & FAQs
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Online Ordering Guide
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Footwear & Apparel Size Chart
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Real-Time Order Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Group Business */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>GROUP BUSINESS</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="#" className={styles.link}>
                  KAISON Global Enterprise
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Vice City Sports Arena
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Whistleblower & Feedback Channel
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Corporate Bulk Purchasing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Payment Methods & Certifications */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>PAYMENT METHODS</h4>

            {/* Payment Badges Grid */}
            <div className={styles.paymentGrid}>
              <div className={styles.paymentCard}>
                <span className={styles.payVisa}>VISA</span>
              </div>
              <div className={styles.paymentCard}>
                <span className={styles.payMaster}>Mastercard</span>
              </div>
              <div className={styles.paymentCard}>
                <span className={styles.payAmex}>AMEX</span>
              </div>
              <div className={styles.paymentCard}>
                <span className={styles.payApple}>Apple Pay</span>
              </div>
              <div className={styles.paymentCard}>
                <span className={styles.payPaypal}>PayPal</span>
              </div>
              <div className={styles.paymentCard}>
                <span className={styles.payCod}>COD</span>
              </div>
            </div>

            {/* Security & Verification Badges */}
            <div className={styles.certificationsGroup}>
              {/* E-Commerce Registered Badge */}
              <div className={styles.govBadge}>
                <CheckCircle2 size={18} className={styles.govIcon} />
                <div>
                  <span className={styles.govTop}>VERIFIED E-COMMERCE</span>
                  <span className={styles.govSub}>VICE CITY COMMERCE</span>
                </div>
              </div>

              {/* DMCA / Security Badge */}
              <div className={styles.dmcaBadge}>
                <ShieldCheck size={18} className={styles.dmcaIcon} />
                <div>
                  <span className={styles.dmcaTop}>PROTECTED BY</span>
                  <span className={styles.dmcaSub}>DMCA COMPLIANT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer Bar */}
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomContainer}`}>
          <p className={styles.copyright}>
            © 2026 JOCKSPORT / KAISON SPORTS GROUP LLC. All rights reserved. 108
            Ocean Drive, Starfish Island, Vice City.
          </p>

          <div className={styles.socials}>
            <Link href="#" className={styles.socialLink} aria-label="Facebook">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </Link>
            <Link href="#" className={styles.socialLink} aria-label="Instagram">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </Link>
            <Link href="#" className={styles.socialLink} aria-label="YouTube">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </Link>
            <Link
              href="#"
              className={styles.socialLink}
              aria-label="X / Twitter"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
