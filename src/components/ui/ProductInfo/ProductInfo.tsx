'use client'

import React, { useState } from 'react'
import { Ruler, MapPin, ShoppingBag, Plus, Minus, Zap } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import styles from './ProductInfo.module.css'

interface ProductInfoProps {
  brand: string
  title: string
  category: string
  sku: string
  price: number
  originalPrice?: number
  colors: { id: string; name: string; imageUrl: string }[]
  sizes: { id: string; label: string; inStock: boolean }[]
  fit: string
}

export function ProductInfo({
  brand,
  title,
  category,
  sku,
  price,
  originalPrice,
  colors,
  sizes,
  fit,
}: ProductInfoProps) {
  const [selectedColor, setSelectedColor] = useState(colors[0]?.id)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size first.")
      return
    }
    addItem(quantity)
    alert(`Added ${quantity} item(s) to cart successfully!`)
  }

  const handleBuyNow = () => {
    if (!selectedSize) {
      alert("Please select a size first.")
      return
    }
    addItem(quantity)
    alert(`Proceeding to checkout with ${quantity} item(s)...`)
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.brand}>{brand}</h2>
      <h1 className={styles.title}>{title}</h1>
      
      <div className={styles.metaInfo}>
        <span className={styles.category}>{category}</span>
        <span className={styles.sku}>SKU {sku}</span>
      </div>

      <div className={styles.pricing}>
        <span className={styles.price}>{formatPrice(price)}</span>
        {originalPrice && originalPrice > price && (
          <span className={styles.originalPrice}>{formatPrice(originalPrice)}</span>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <p className={styles.sectionTitle}>
          Color: <span>{colors.find(c => c.id === selectedColor)?.name}</span>
        </p>
        <div className={styles.colorGrid}>
          {colors.map((color) => (
            <button
              key={color.id}
              className={`${styles.colorBtn} ${selectedColor === color.id ? styles.activeColor : ''}`}
              onClick={() => setSelectedColor(color.id)}
              aria-label={`Select color ${color.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={color.imageUrl} alt={color.name} />
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Size</p>
        <div className={styles.sizeGrid}>
          {sizes.map((size) => (
            <button
              key={size.id}
              className={`${styles.sizeBtn} ${selectedSize === size.id ? styles.activeSize : ''} ${!size.inStock ? styles.outOfStock : ''}`}
              onClick={() => size.inStock && setSelectedSize(size.id)}
              disabled={!size.inStock}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.helpers}>
        <button className={styles.helperBtn}>
          <Ruler size={16} />
          <span>Size Guide</span>
        </button>
        <button className={styles.helperBtn}>
          <MapPin size={16} />
          <span>Check In-Store Availability</span>
        </button>
      </div>

      <div className={styles.fitScale}>
        <div className={styles.fitBar}>
          <div className={styles.fitIndicator} style={{ left: '80%' }}></div>
        </div>
        <div className={styles.fitLabels}>
          <span>Tight</span>
          <span>Slim</span>
          <span>Regular</span>
          <span className={styles.activeFitLabel}>Loose</span>
          <span>Oversized</span>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Quantity</p>
        <div className={styles.quantitySelector}>
          <button
            type="button"
            className={styles.quantityBtn}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          <span className={styles.quantityValue}>{quantity}</span>
          <button
            type="button"
            className={styles.quantityBtn}
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className={styles.actionButtons}>
        <button 
          className={styles.addToCartBtn} 
          onClick={handleAddToCart}
          type="button"
        >
          <ShoppingBag size={20} />
          <span>ADD TO CART</span>
        </button>

        <button 
          className={styles.buyNowBtn} 
          onClick={handleBuyNow}
          type="button"
        >
          <Zap size={20} />
          <span>BUY NOW</span>
        </button>
      </div>
    </div>
  )
}
