import { describe, it, expect, beforeEach } from 'vitest';
import { handleMockRequest, resetDemoState } from './mockApiHandler';
import { ApiError } from '@/lib/errors';
import { BackendProduct, ProductCategoryStats } from '@/types/product';
import { UserProfile, AuthResponseData } from '@/types/user';
import { ServerCart } from '@/types/cart';
import { Order } from '@/types/order';

describe('mockApiHandler', () => {
  beforeEach(() => {
    resetDemoState();
  });

  describe('Products', () => {
    it('returns all products with pagination on GET /products', async () => {
      const res = await handleMockRequest<{
        status: string;
        results: number;
        data: { products: BackendProduct[] };
      }>('GET', '/products');

      expect(res.status).toBe('success');
      expect(res.data.products.length).toBeGreaterThan(0);
      expect(res.results).toBe(res.data.products.length);
    });

    it('filters products by search keyword', async () => {
      const res = await handleMockRequest<{
        data: { products: BackendProduct[] };
      }>('GET', '/products', undefined, { q: 'Mach' });

      expect(res.data.products.length).toBeGreaterThan(0);
      expect(res.data.products[0].name).toContain('Mach');
    });

    it('filters products by category and brand', async () => {
      const res = await handleMockRequest<{
        data: { products: BackendProduct[] };
      }>('GET', '/products', undefined, { category: 'running', brand: 'hoka' });

      expect(res.data.products.length).toBeGreaterThan(0);
      expect(res.data.products.every((p) => p.brand?.toLowerCase() === 'hoka')).toBe(true);
    });

    it('returns featured products on GET /products/featured', async () => {
      const res = await handleMockRequest<{
        data: { products: BackendProduct[] };
      }>('GET', '/products/featured', undefined, { limit: 2 });

      expect(res.data.products.length).toBeLessThanOrEqual(2);
      expect(res.data.products[0].isFeatured).toBe(true);
    });

    it('returns category stats on GET /products/stats', async () => {
      const res = await handleMockRequest<{
        data: { stats: ProductCategoryStats[] };
      }>('GET', '/products/stats');

      expect(res.data.stats.length).toBeGreaterThan(0);
      expect(res.data.stats[0].category).toBeDefined();
    });

    it('fetches a product by slug on GET /products/slug/:slug', async () => {
      const res = await handleMockRequest<{
        data: { product: BackendProduct };
      }>('GET', '/products/slug/giay-chay-bo-nu-hoka-mach-7-1171938-fvyg-fvyg');

      expect(res.data.product.name).toContain('Mach 7');
      expect(res.data.product.price).toBe(152);
    });

    it('throws ApiError 404 for nonexistent slug', async () => {
      await expect(
        handleMockRequest('GET', '/products/slug/nonexistent-item-handle')
      ).rejects.toThrow(ApiError);
    });
  });

  describe('Authentication', () => {
    it('authenticates user on POST /auth/login', async () => {
      const res = await handleMockRequest<{ data: AuthResponseData }>('POST', '/auth/login', {
        email: 'test@jocksport.demo',
        password: 'password123',
      });

      expect(res.data.user.email).toBe('test@jocksport.demo');
      expect(res.data.tokens.accessToken).toBeDefined();
    });

    it('registers a new user on POST /auth/register', async () => {
      const res = await handleMockRequest<{ data: AuthResponseData }>('POST', '/auth/register', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@demo.com',
        password: 'password123',
      });

      expect(res.data.user.firstName).toBe('John');
      expect(res.data.user.email).toBe('john.doe@demo.com');
      expect(res.data.tokens.accessToken).toBeDefined();
    });

    it('refreshes token on POST /auth/refresh-token', async () => {
      const res = await handleMockRequest<{
        data: { tokens: { accessToken: string } };
      }>('POST', '/auth/refresh-token', { refreshToken: 'mock' });

      expect(res.data.tokens.accessToken).toBeDefined();
    });
  });

  describe('User Profile & Addresses', () => {
    it('returns current user profile on GET /users/me', async () => {
      const res = await handleMockRequest<{
        data: { user: UserProfile };
      }>('GET', '/users/me');

      expect(res.data.user.email).toBeDefined();
    });

    it('updates user profile on PATCH /users/me', async () => {
      const res = await handleMockRequest<{
        data: { user: UserProfile };
      }>('PATCH', '/users/me', { firstName: 'UpdatedName' });

      expect(res.data.user.firstName).toBe('UpdatedName');
    });

    it('adds and deletes user delivery addresses', async () => {
      // Add address
      const addRes = await handleMockRequest<{
        data: { addresses: Array<{ _id: string; addressLine1: string }> };
      }>('POST', '/users/me/addresses', {
        fullName: 'Alex Test',
        addressLine1: '456 Stadium Blvd',
        city: 'Eugene',
        state: 'Oregon',
        postalCode: '97401',
        country: 'United States',
      });

      const newAddress = addRes.data.addresses.find((a) => a.addressLine1 === '456 Stadium Blvd');
      expect(newAddress).toBeDefined();

      // Delete address
      const delRes = await handleMockRequest<{
        data: { addresses: Array<{ _id: string }> };
      }>('DELETE', `/users/me/addresses/${newAddress?._id}`);

      expect(delRes.data.addresses.some((a) => a._id === newAddress?._id)).toBe(false);
    });
  });

  describe('Cart Operations', () => {
    it('retrieves cart on GET /cart', async () => {
      const res = await handleMockRequest<{
        data: { cart: ServerCart };
      }>('GET', '/cart');

      expect(res.data.cart.items).toBeDefined();
    });

    it('adds, updates and removes cart items', async () => {
      // Add item
      const addRes = await handleMockRequest<{
        data: { cart: ServerCart };
      }>('POST', '/cart/items', {
        productId: 'prod_ss_15402340712816',
        quantity: 2,
        size: 'US 7',
        color: 'Navy Blue',
      });

      const added = addRes.data.cart.items.find(
        (i) => i.product.name.includes('Mach') && i.size === 'US 7'
      );
      expect(added).toBeDefined();
      expect(added?.quantity).toBe(2);

      // Update quantity
      const patchRes = await handleMockRequest<{
        data: { cart: ServerCart };
      }>('PATCH', `/cart/items/${added?._id}`, {
        quantity: 4,
      });

      const updated = patchRes.data.cart.items.find((i) => i._id === added?._id);
      expect(updated?.quantity).toBe(4);

      // Remove item
      const delRes = await handleMockRequest<{
        data: { cart: ServerCart };
      }>('DELETE', `/cart/items/${added?._id}`);

      expect(delRes.data.cart.items.some((i) => i._id === added?._id)).toBe(false);
    });

    it('clears all items on DELETE /cart', async () => {
      const res = await handleMockRequest<{
        status: string;
      }>('DELETE', '/cart');

      expect(res.status).toBe('success');

      const cartRes = await handleMockRequest<{
        data: { cart: ServerCart };
      }>('GET', '/cart');

      expect(cartRes.data.cart.items.length).toBe(0);
    });
  });

  describe('Orders Operations', () => {
    it('creates and lists orders', async () => {
      const orderRes = await handleMockRequest<{
        data: { order: Order };
      }>('POST', '/orders', {
        shippingAddress: {
          fullName: 'Alex Morgan',
          phone: '+1 555-0199',
          addressLine1: '123 Track Lane',
          city: 'Portland',
          country: 'United States',
        },
        shippingMethod: 'express',
        paymentMethod: 'credit_card',
      });

      expect(orderRes.data.order.orderNumber).toBeDefined();
      expect(orderRes.data.order.status).toBe('confirmed');

      // Fetch order by ID
      const singleOrderRes = await handleMockRequest<{
        data: { order: Order };
      }>('GET', `/orders/${orderRes.data.order._id}`);

      expect(singleOrderRes.data.order._id).toBe(orderRes.data.order._id);

      // Cancel order
      const cancelRes = await handleMockRequest<{
        data: { order: Order };
      }>('PATCH', `/orders/${orderRes.data.order._id}/cancel`, {
        reason: 'Customer requested cancellation',
      });

      expect(cancelRes.data.order.status).toBe('cancelled');
    });
  });
});
