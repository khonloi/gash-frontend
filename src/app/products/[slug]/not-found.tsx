import React from 'react';
import Link from 'next/link';
import { Breadcrumb, Button } from '@/components/ui';
import { ShoppingBag, Home } from 'lucide-react';
import styles from './page.module.css';

export default function ProductNotFound() {
  return (
    <main className={styles.pageContainer}>
      <div className="container">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/collections/all' },
            { label: 'Not Found' },
          ]}
        />

        <div
          style={{
            maxWidth: '560px',
            margin: '4rem auto',
            textAlign: 'center',
            padding: '3rem 2rem',
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            boxShadow: '0 8px 30px rgba(12, 28, 48, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-bg-muted)',
              color: 'var(--color-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={28} />
          </div>

          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--color-navy)',
              margin: '0',
            }}
          >
            Product Unavailable
          </h1>

          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.5,
              margin: '0',
            }}
          >
            The athletic product or edition you were looking for could not be found or has been discontinued.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link href="/collections/all" style={{ textDecoration: 'none' }}>
              <Button variant="primary" icon={<ShoppingBag size={16} />}>
                Browse All Products
              </Button>
            </Link>

            <Link href="/" style={{ textDecoration: 'none' }}>
              <Button variant="outline" icon={<Home size={16} />}>
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
