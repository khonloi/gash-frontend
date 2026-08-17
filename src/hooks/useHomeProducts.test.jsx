import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHomeProducts } from './useHomeProducts';
import { fetchWithRetry } from '../utils/fetchWithRetry';

// Mock the dependencies
vi.mock('../common/SummaryAPI', () => ({
  default: {
    products: {
      getAll: vi.fn(),
    },
  },
}));

vi.mock('../utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useHomeProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    fetchWithRetry.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useHomeProducts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.products).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should fetch products and update state on success', async () => {
    const mockProducts = [
      {
        _id: '1',
        productStatus: 'active',
        productVariantIds: ['v1'],
        categoryId: { categoryName: 'T-Shirts' },
      },
      {
        _id: '2',
        productStatus: 'active',
        productVariantIds: ['v2'],
        categoryId: { categoryName: 'Hoodies' },
      },
    ];

    fetchWithRetry.mockResolvedValueOnce({ data: mockProducts });

    const { result } = renderHook(() => useHomeProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toHaveLength(2);
    expect(result.current.categories).toContain('T-Shirts');
    expect(result.current.categories).toContain('Hoodies');
    expect(result.current.error).toBe(null);
  });

  it('should set error state on fetch failure', async () => {
    fetchWithRetry.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useHomeProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.products).toEqual([]);
  });
});
