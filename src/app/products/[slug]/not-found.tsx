import React from 'react';
import Link from 'next/link';
import { Breadcrumb, Button } from '@/components/ui';
import { ShoppingBag, Home } from 'lucide-react';
import pageStyles from './page.module.css';
import notFoundStyles from '@/app/not-found.module.css';

export default function ProductNotFound() {
  return (
    <main className={pageStyles.pageContainer}>
      <div className="container">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/collections/all' },
            { label: 'Not Found' },
          ]}
        />

        <div className={notFoundStyles.productCard}>
          <div className={notFoundStyles.iconCircle}>
            <ShoppingBag size={28} />
          </div>

          <h1 className={notFoundStyles.title}>Product Unavailable</h1>

          <p className={notFoundStyles.description}>
            The athletic product or edition you were looking for could not be found or has been
            discontinued.
          </p>

          <div className={notFoundStyles.actions}>
            <Link href="/collections/all" className={notFoundStyles.actionLink}>
              <Button variant="primary" icon={<ShoppingBag size={16} />}>
                Browse All Products
              </Button>
            </Link>

            <Link href="/" className={notFoundStyles.actionLink}>
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
