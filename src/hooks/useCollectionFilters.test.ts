import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollectionFilters } from './useCollectionFilters';
import { FrontendProduct } from '@/types/product';

const mockProducts: FrontendProduct[] = [
  {
    id: 'prod-1',
    handle: 'pegasus-40',
    brand: 'Nike',
    title: 'Pegasus 40',
    price: 130,
    salePrice: 104,
    originalPrice: 130,
    discountPercent: 20,
    imageUrl: '/pegasus.jpg',
    category: 'Running',
    gender: 'Men',
    size: '10',
    sizes: ['9', '10', '11'],
    color: 'Black',
    colors: ['Black', 'White'],
    sku: 'NK-PEG40',
    description: 'High performance running shoe',
    specs: {},
    images: [],
  },
  {
    id: 'prod-2',
    handle: 'ultraboost-light',
    brand: 'Adidas',
    title: 'Ultraboost Light',
    price: 190,
    salePrice: 190,
    originalPrice: 190,
    discountPercent: null,
    imageUrl: '/ultraboost.jpg',
    category: 'Running',
    gender: 'Women',
    size: '8',
    sizes: ['7', '8', '9'],
    color: 'White',
    colors: ['White'],
    sku: 'AD-UB-LT',
    description: 'Lightweight responsive cushion',
    specs: {},
    images: [],
  },
  {
    id: 'prod-3',
    handle: 'court-vision',
    brand: 'Nike',
    title: 'Court Vision Low',
    price: 80,
    salePrice: 60,
    originalPrice: 80,
    discountPercent: 25,
    imageUrl: '/court.jpg',
    category: 'Basketball',
    gender: 'Men',
    size: '10',
    sizes: ['10', '11'],
    color: 'Red',
    colors: ['Red'],
    sku: 'NK-CV-LOW',
    description: 'Retro basketball sneaker',
    specs: {},
    images: [],
  },
];

describe('useCollectionFilters', () => {
  it('filters by collection slug', () => {
    const { result } = renderHook(() =>
      useCollectionFilters({
        products: mockProducts,
        slug: 'basketball',
      })
    );

    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].title).toBe('Court Vision Low');
  });

  it('filters by active checkbox filters', () => {
    const { result } = renderHook(() =>
      useCollectionFilters({
        products: mockProducts,
        slug: 'all',
      })
    );

    act(() => {
      result.current.handleFilterChange('brand', 'Adidas');
    });

    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].brand).toBe('Adidas');
  });

  it('sorts products by price ascending and descending', () => {
    const { result } = renderHook(() =>
      useCollectionFilters({
        products: mockProducts,
        slug: 'all',
      })
    );

    act(() => {
      result.current.handleSortChange('price_asc');
    });

    expect(result.current.sortedProducts[0].salePrice).toBe(60);
    expect(result.current.sortedProducts[2].salePrice).toBe(190);

    act(() => {
      result.current.handleSortChange('price_desc');
    });

    expect(result.current.sortedProducts[0].salePrice).toBe(190);
    expect(result.current.sortedProducts[2].salePrice).toBe(60);
  });

  it('filters by search query', () => {
    const { result } = renderHook(() =>
      useCollectionFilters({
        products: mockProducts,
        slug: 'all',
        initialQuery: 'cushion',
      })
    );

    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].title).toBe('Ultraboost Light');
  });

  it('clears all filters and resets search', () => {
    const { result } = renderHook(() =>
      useCollectionFilters({
        products: mockProducts,
        slug: 'all',
        initialQuery: 'court',
      })
    );

    act(() => {
      result.current.handleFilterChange('brand', 'Nike');
    });

    expect(result.current.activeFilters.brand).toContain('Nike');

    act(() => {
      result.current.handleClearFilters();
    });

    expect(result.current.activeFilters).toEqual({});
    expect(result.current.searchQuery).toBe('');
    expect(result.current.filteredProducts).toHaveLength(3);
  });
});
