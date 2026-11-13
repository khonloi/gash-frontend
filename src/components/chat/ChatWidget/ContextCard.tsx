'use client';

import React from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui';
import { ChatContextCard } from '@/types/chat';
import { formatPrice } from '@/lib/format';
import styles from './ChatWidget.module.css';

interface ContextCardProps {
  card: ChatContextCard;
}

export function ContextCard({ card }: ContextCardProps) {
  if (card.cardType === 'product' && card.product) {
    const product = card.product;
    const imageUrl = product.images?.[0]?.url;

    return (
      <div className={styles.contextCard}>
        <div className={styles.contextCardMedia}>
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={imageUrl} alt={product.name} className={styles.contextCardImg} />
          ) : (
            <div className={styles.contextCardPlaceholder}>
              <Package size={20} />
            </div>
          )}
        </div>
        <div className={styles.contextCardContent}>
          <div className={styles.contextCardHeader}>
            <Badge variant="primary" size="sm">
              Product
            </Badge>
            {product.brand && <span className={styles.contextCardBrand}>{product.brand}</span>}
          </div>
          <h4 className={styles.contextCardTitle}>{product.name}</h4>
          <div className={styles.contextCardPricing}>
            <span className={styles.contextCardPrice}>{formatPrice(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className={styles.contextCardComparePrice}>
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <Link href={`/products/${product.slug}`} className={styles.contextCardLink}>
            <span>View Details</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    );
  }

  if (card.cardType === 'order' && card.order) {
    const order = card.order;

    return (
      <div className={styles.contextCard}>
        <div className={styles.contextCardMedia}>
          <div className={styles.contextCardPlaceholder}>
            <ShoppingBag size={20} />
          </div>
        </div>
        <div className={styles.contextCardContent}>
          <div className={styles.contextCardHeader}>
            <Badge variant="secondary" size="sm">
              Order
            </Badge>
            <Badge variant="success" size="sm">
              {order.status}
            </Badge>
          </div>
          <h4 className={styles.contextCardTitle}>{order.orderNumber}</h4>
          <div className={styles.contextCardPricing}>
            <span className={styles.contextCardPrice}>Total: {formatPrice(order.total)}</span>
          </div>
          <Link href={`/orders/${order.orderNumber}`} className={styles.contextCardLink}>
            <span>Track Order</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
