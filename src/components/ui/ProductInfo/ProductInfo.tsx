'use client'

import React, { useState } from 'react'
import { Ruler, MapPin, ShoppingBag, Zap } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useToastStore } from '@/store/useToastStore'
import { Button, QuantitySelector, Divider } from '@/components/ui'
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
}: ProductInfoProps) {
  const [selectedColor, setSelectedColor] = useState(colors[0]?.id)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)
  const { addToast } = useToastStore()

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      addToast("Please select a size first.", "error")
      return
    }
    const colorObj = colors.find((c) => c.id === selectedColor)
    addItem({
      productId: sku,
      title,
      brand,
      price: price,
      imageUrl: colorObj?.imageUrl || colors[0]?.imageUrl || '',
      quantity,
      size: selectedSize,
      color: colorObj?.name,
    })
    addToast(`Added ${quantity} item(s) to cart successfully!`, "success")
  }

  const handleBuyNow = () => {
    if (!selectedSize) {
      addToast("Please select a size first.", "error")
      return
    }
    const colorObj = colors.find((c) => c.id === selectedColor)
    addItem({
      productId: sku,
      title,
      brand,
      price: price,
      imageUrl: colorObj?.imageUrl || colors[0]?.imageUrl || '',
      quantity,
      size: selectedSize,
      color: colorObj?.name,
    })
    addToast(`Proceeding to checkout with ${quantity} item(s)...`, "info")
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

      <Divider />

      <div className={styles.section}>
        <p className={styles.sectionTitle}>
          Color: <span>{colors.find(c => c.id === selectedColor)?.name}</span>
        </p>
        <div className={styles.colorGrid}>
          {colors.map((color) => (
            <button
              key={color.id}
              type="button"
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
              type="button"
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
        <button type="button" className={styles.helperBtn}>
          <Ruler size={16} />
          <span>Size Guide</span>
        </button>
        <button type="button" className={styles.helperBtn}>
          <MapPin size={16} />
          <span>Check In-Store Availability</span>
        </button>
      </div>

      <div className={styles.fitScale}>
        <div className={styles.fitBar}>
          <div className={styles.fitIndicator} />
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
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          min={1}
          size="md"
        />
      </div>

      <div className={styles.actionButtons}>
        <Button
          variant="outline"
          size="lg"
          onClick={handleAddToCart}
          icon={<ShoppingBag size={20} />}
          fullWidth
        >
          ADD TO CART
        </Button>

        <Button
          variant="success"
          size="lg"
          onClick={handleBuyNow}
          icon={<Zap size={20} />}
          fullWidth
        >
          BUY NOW
        </Button>
      </div>
    </div>
  )
}
