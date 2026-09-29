import React from 'react';
import { ShieldCheck, RotateCcw, CreditCard, Headphones } from 'lucide-react';
import styles from '@/app/page.module.css';

export function TrustSection() {
  return (
    <section className={styles.trustSection}>
      <div className={`container ${styles.trustGrid}`}>
        <div className={styles.trustItem}>
          <ShieldCheck size={32} className={styles.trustIcon} />
          <div>
            <h4>100% Authentic Guaranteed</h4>
            <p>Direct authorized partner of world leading sport brands</p>
          </div>
        </div>
        <div className={styles.trustItem}>
          <RotateCcw size={32} className={styles.trustIcon} />
          <div>
            <h4>30-Day Hassle-Free Returns</h4>
            <p>Easy size exchange and return policy on all unworn items</p>
          </div>
        </div>
        <div className={styles.trustItem}>
          <CreditCard size={32} className={styles.trustIcon} />
          <div>
            <h4>Secure & Flexible Payments</h4>
            <p>Encrypted checkout with cards, PayPal, and Apple Pay</p>
          </div>
        </div>
        <div className={styles.trustItem}>
          <Headphones size={32} className={styles.trustIcon} />
          <div>
            <h4>24/7 Athletic Support</h4>
            <p>Gear specialists ready to help you pick the right fit</p>
          </div>
        </div>
      </div>
    </section>
  );
}
