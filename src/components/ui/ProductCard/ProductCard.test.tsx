import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from './ProductCard'
import { useCartStore } from '@/store/useCartStore'
import { useToastStore } from '@/store/useToastStore'

describe('ProductCard', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  const mockProduct = {
    id: 'prod-123',
    handle: 'nike-air-zoom',
    brand: 'Nike',
    title: 'Air Zoom Pegasus 40',
    originalPrice: 130,
    salePrice: 104,
    discountPercent: 20,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    category: 'Running',
  }

  it('renders product information accurately', () => {
    render(<ProductCard {...mockProduct} />)

    expect(screen.getByText('Nike')).toBeDefined()
    expect(screen.getByText('Air Zoom Pegasus 40')).toBeDefined()
    expect(screen.getByText('-20%')).toBeDefined()
  })

  it('adds item to cart and triggers toast notification on button click', () => {
    render(<ProductCard {...mockProduct} />)

    const addButton = screen.getByRole('button', { name: /Add Air Zoom Pegasus 40 to Cart/i })
    expect(addButton).toBeDefined()

    fireEvent.click(addButton)

    // Check cart store state
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].productId).toBe('prod-123')
    expect(items[0].title).toBe('Air Zoom Pegasus 40')
    expect(items[0].price).toBe(104)

    // Check toast store state
    const toasts = useToastStore.getState().toasts
    expect(toasts.length).toBeGreaterThan(0)
    expect(toasts[toasts.length - 1].message).toContain('Air Zoom Pegasus 40')
    expect(toasts[toasts.length - 1].type).toBe('success')
  })
})
