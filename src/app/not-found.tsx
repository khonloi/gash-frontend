import React from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, Home } from 'lucide-react';
import { Button } from '@/components/ui';

export default function RootNotFound() {
  return (
    <main
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1.5rem',
        backgroundColor: 'var(--color-bg-light)',
      }}
    >
      <div
        style={{
          maxWidth: '580px',
          width: '100%',
          backgroundColor: 'var(--color-white)',
          padding: '3rem 2.5rem',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          boxShadow: '0 12px 36px rgba(12, 28, 48, 0.08)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <span
          style={{
            fontSize: '5rem',
            fontWeight: 900,
            lineHeight: 1,
            color: 'var(--color-navy)',
            letterSpacing: '-0.04em',
          }}
        >
          404
        </span>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-navy)',
            margin: '0',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          Gear Not Found
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            margin: '0',
          }}
        >
          The page or product you are looking for might have been moved, sold out, or does not exist in our catalog.
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
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button variant="primary" icon={<Home size={16} />}>
              Return Home
            </Button>
          </Link>

          <Link href="/collections/all" style={{ textDecoration: 'none' }}>
            <Button variant="outline" icon={<Compass size={16} />}>
              Browse All Products
            </Button>
          </Link>
        </div>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border)',
            width: '100%',
          }}
        >
          <p
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Popular Destinations
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Running', href: '/collections/running' },
              { label: 'Training', href: '/collections/training' },
              { label: 'Swimming', href: '/collections/swimming' },
              { label: 'Outdoor', href: '/collections/outdoor' },
            ].map((col) => (
              <Link
                key={col.label}
                href={col.href}
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-navy)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  padding: '4px 12px',
                  backgroundColor: 'var(--color-bg-muted)',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{col.label}</span>
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
