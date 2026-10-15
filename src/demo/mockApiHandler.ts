import {
  mockProducts,
  mockStats,
  mockUser,
  mockTokens,
  initialMockCart,
  mockOrders,
} from './mockData';
import { UserProfile, UserAddress } from '@/types/user';
import { ServerCart, ServerCartItem, CartItemPayload } from '@/types/cart';
import { Order, CreateOrderPayload, OrderStatus } from '@/types/order';
import { QueryParams } from '@/lib/apiClient';

import { ApiError } from '@/lib/errors';

// Stateful in-memory stores for interactive demo sessions
let currentUser: UserProfile = JSON.parse(JSON.stringify(mockUser));
let currentCart: ServerCart = JSON.parse(JSON.stringify(initialMockCart));
let currentOrders: Order[] = JSON.parse(JSON.stringify(mockOrders));

/**
 * Reset demo state back to pristine initial fixture data
 */
export function resetDemoState(): void {
  currentUser = JSON.parse(JSON.stringify(mockUser));
  currentCart = JSON.parse(JSON.stringify(initialMockCart));
  currentOrders = JSON.parse(JSON.stringify(mockOrders));
}

/**
 * Artificial network latency simulation (in ms)
 */
const DEMO_LATENCY_MS = 150;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handle and route intercepted API requests for offline demo mode
 */
export async function handleMockRequest<T>(
  method: string,
  endpoint: string,
  bodyRaw?: unknown,
  params?: QueryParams
): Promise<T> {
  await delay(DEMO_LATENCY_MS);

  // Normalize endpoint path (strip query params and leading /api/v1 if present)
  let cleanPath = endpoint.split('?')[0].replace(/^\/api\/v1/, '');
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  // Parse body safely if stringified JSON
  let body: Record<string, unknown> = {};
  if (typeof bodyRaw === 'string') {
    try {
      body = JSON.parse(bodyRaw);
    } catch {
      body = {};
    }
  } else if (typeof bodyRaw === 'object' && bodyRaw !== null) {
    body = bodyRaw as Record<string, unknown>;
  }

  // ==========================================
  // 1. PRODUCTS ENDPOINTS
  // ==========================================

  // GET /products/featured
  if (method === 'GET' && cleanPath === '/products/featured') {
    const limit = Number(params?.limit || 10);
    const featured = mockProducts.filter((p) => p.isFeatured).slice(0, limit);
    return {
      status: 'success',
      data: { products: featured.length > 0 ? featured : mockProducts.slice(0, limit) },
    } as T;
  }

  // GET /products/stats
  if (method === 'GET' && cleanPath === '/products/stats') {
    return {
      status: 'success',
      data: { stats: mockStats },
    } as T;
  }

  // GET /products/slug/:slug
  const slugMatch = cleanPath.match(/^\/products\/slug\/([^/]+)$/);
  if (method === 'GET' && slugMatch) {
    const slug = decodeURIComponent(slugMatch[1]).toLowerCase();
    const product = mockProducts.find(
      (p) =>
        p.slug?.toLowerCase() === slug ||
        p._id?.toLowerCase() === slug ||
        p.handle?.toLowerCase() === slug
    );

    if (!product) {
      throw new ApiError(`Product with slug "${slug}" not found in demo catalog`, 404);
    }

    return {
      status: 'success',
      data: { product },
    } as T;
  }

  // GET /products/:id (single product by ID)
  const productByIdMatch = cleanPath.match(/^\/products\/([^/]+)$/);
  if (
    method === 'GET' &&
    productByIdMatch &&
    productByIdMatch[1] !== 'featured' &&
    productByIdMatch[1] !== 'stats'
  ) {
    const id = decodeURIComponent(productByIdMatch[1]).toLowerCase();
    const product = mockProducts.find(
      (p) =>
        p._id?.toLowerCase() === id || p.id?.toLowerCase() === id || p.slug?.toLowerCase() === id
    );

    if (!product) {
      throw new ApiError(`Product with ID "${id}" not found in demo catalog`, 404);
    }

    return {
      status: 'success',
      data: { product },
    } as T;
  }

  // GET /products (list with filtering, searching, sorting, pagination)
  if (method === 'GET' && cleanPath === '/products') {
    let filtered = [...mockProducts];

    // Filter by search query
    const searchQuery = String(params?.q || params?.search || '')
      .toLowerCase()
      .trim();
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery) ||
          p.description.toLowerCase().includes(searchQuery) ||
          p.brand?.toLowerCase().includes(searchQuery) ||
          p.category.toLowerCase().includes(searchQuery) ||
          p.tags?.some((t) => t.toLowerCase().includes(searchQuery))
      );
    }

    // Filter by Category
    const category = String(params?.category || '')
      .toLowerCase()
      .trim();
    if (category && category !== 'all') {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category);
    }

    // Filter by Brand
    const brand = String(params?.brand || '')
      .toLowerCase()
      .trim();
    if (brand && brand !== 'all') {
      filtered = filtered.filter((p) => p.brand?.toLowerCase() === brand);
    }

    // Filter by Price range
    const minPrice = params?.minPrice ? Number(params.minPrice) : 0;
    const maxPrice = params?.maxPrice ? Number(params.maxPrice) : Infinity;
    if (minPrice > 0 || maxPrice < Infinity) {
      filtered = filtered.filter((p) => p.price >= minPrice && p.price <= maxPrice);
    }

    // Sort order
    const sort = String(params?.sort || '');
    if (sort === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      filtered.sort((a, b) => (b.ratingsAverage || 0) - (a.ratingsAverage || 0));
    } else if (sort === 'newest') {
      filtered.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }

    const page = Number(params?.page || 1);
    const limit = Number(params?.limit || 50);
    const totalResults = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / limit));
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      status: 'success',
      results: paginated.length,
      pagination: {
        page,
        limit,
        totalPages,
        totalResults,
      },
      data: {
        products: paginated,
      },
    } as T;
  }

  // ==========================================
  // 2. AUTHENTICATION ENDPOINTS
  // ==========================================

  // POST /auth/login
  if (method === 'POST' && cleanPath === '/auth/login') {
    const email = String(body.email || currentUser.email);
    currentUser.email = email;
    return {
      status: 'success',
      message: 'Demo login successful',
      data: {
        user: currentUser,
        tokens: mockTokens,
      },
    } as T;
  }

  // POST /auth/register
  if (method === 'POST' && cleanPath === '/auth/register') {
    currentUser = {
      ...currentUser,
      firstName: String(body.firstName || 'Demo'),
      lastName: String(body.lastName || 'User'),
      email: String(body.email || 'demo@jocksport.demo'),
    };
    return {
      status: 'success',
      message: 'Demo registration successful',
      data: {
        user: currentUser,
        tokens: mockTokens,
      },
    } as T;
  }

  // POST /auth/refresh-token
  if (method === 'POST' && cleanPath === '/auth/refresh-token') {
    return {
      status: 'success',
      data: {
        tokens: mockTokens,
      },
    } as T;
  }

  // POST /auth/logout
  if (method === 'POST' && cleanPath === '/auth/logout') {
    return {
      status: 'success',
      message: 'Logged out successfully from demo session',
      data: null,
    } as T;
  }

  // POST /auth/forgot-password
  if (method === 'POST' && cleanPath === '/auth/forgot-password') {
    return {
      status: 'success',
      message: 'Password reset link sent to demo email address',
      data: null,
    } as T;
  }

  // PATCH /auth/reset-password/:token
  if (method === 'PATCH' && cleanPath.startsWith('/auth/reset-password/')) {
    return {
      status: 'success',
      message: 'Demo password reset successful',
      data: {
        user: currentUser,
        tokens: mockTokens,
      },
    } as T;
  }

  // GET /auth/verify-email/:token
  if (method === 'GET' && cleanPath.startsWith('/auth/verify-email/')) {
    currentUser.isEmailVerified = true;
    return {
      status: 'success',
      message: 'Demo email verified successfully',
      data: null,
    } as T;
  }

  // ==========================================
  // 3. USER PROFILE & ADDRESSES
  // ==========================================

  // GET /users/me
  if (method === 'GET' && cleanPath === '/users/me') {
    return {
      status: 'success',
      data: { user: currentUser },
    } as T;
  }

  // PATCH /users/me
  if (method === 'PATCH' && cleanPath === '/users/me') {
    currentUser = {
      ...currentUser,
      ...(body as Partial<UserProfile>),
      updatedAt: new Date().toISOString(),
    };
    return {
      status: 'success',
      data: { user: currentUser },
    } as T;
  }

  // PATCH /users/me/password
  if (method === 'PATCH' && cleanPath === '/users/me/password') {
    return {
      status: 'success',
      message: 'Demo password changed successfully',
      data: null,
    } as T;
  }

  // GET /users/me/addresses
  if (method === 'GET' && cleanPath === '/users/me/addresses') {
    return {
      status: 'success',
      data: { addresses: currentUser.addresses || [] },
    } as T;
  }

  // POST /users/me/addresses
  if (method === 'POST' && cleanPath === '/users/me/addresses') {
    const newAddress: UserAddress = {
      _id: `addr_demo_${Date.now()}`,
      label: String(body.label || 'Home'),
      fullName: String(body.fullName || `${currentUser.firstName} ${currentUser.lastName}`),
      addressLine1: String(body.addressLine1 || ''),
      addressLine2: body.addressLine2 ? String(body.addressLine2) : undefined,
      city: String(body.city || ''),
      state: String(body.state || ''),
      postalCode: String(body.postalCode || ''),
      country: String(body.country || 'United States'),
      phone: body.phone ? String(body.phone) : currentUser.phone,
      isDefault: Boolean(body.isDefault),
    };

    if (newAddress.isDefault && currentUser.addresses) {
      currentUser.addresses.forEach((addr) => (addr.isDefault = false));
    }

    currentUser.addresses = [...(currentUser.addresses || []), newAddress];

    return {
      status: 'success',
      data: { addresses: currentUser.addresses },
    } as T;
  }

  // PATCH /users/me/addresses/:id
  const editAddrMatch = cleanPath.match(/^\/users\/me\/addresses\/([^/]+)$/);
  if (method === 'PATCH' && editAddrMatch) {
    const addrId = decodeURIComponent(editAddrMatch[1]);
    if (currentUser.addresses) {
      currentUser.addresses = currentUser.addresses.map((addr) => {
        if (addr._id === addrId) {
          return { ...addr, ...body };
        }
        if (body.isDefault) {
          return { ...addr, isDefault: false };
        }
        return addr;
      });
    }

    return {
      status: 'success',
      data: { addresses: currentUser.addresses || [] },
    } as T;
  }

  // DELETE /users/me/addresses/:id
  const delAddrMatch = cleanPath.match(/^\/users\/me\/addresses\/([^/]+)$/);
  if (method === 'DELETE' && delAddrMatch) {
    const addrId = decodeURIComponent(delAddrMatch[1]);
    if (currentUser.addresses) {
      currentUser.addresses = currentUser.addresses.filter((addr) => addr._id !== addrId);
    }
    return {
      status: 'success',
      data: { addresses: currentUser.addresses || [] },
    } as T;
  }

  // ==========================================
  // 4. CART OPERATIONS
  // ==========================================

  // GET /cart
  if (method === 'GET' && cleanPath === '/cart') {
    return {
      status: 'success',
      data: { cart: currentCart },
    } as T;
  }

  // DELETE /cart (clear cart)
  if (method === 'DELETE' && cleanPath === '/cart') {
    currentCart.items = [];
    currentCart.updatedAt = new Date().toISOString();
    return {
      status: 'success',
      data: null,
    } as T;
  }

  // POST /cart/items (add item)
  if (method === 'POST' && cleanPath === '/cart/items') {
    const payload = body as unknown as CartItemPayload;
    const targetProduct =
      mockProducts.find((p) => p._id === payload.productId || p.id === payload.productId) ||
      mockProducts[0];

    const existingIndex = currentCart.items.findIndex(
      (item) =>
        item.product._id === targetProduct._id &&
        item.size === payload.size &&
        item.color === payload.color
    );

    if (existingIndex > -1) {
      currentCart.items[existingIndex].quantity += payload.quantity || 1;
    } else {
      const primaryImage =
        Array.isArray(targetProduct.images) && targetProduct.images.length > 0
          ? typeof targetProduct.images[0] === 'string'
            ? targetProduct.images[0]
            : targetProduct.images[0].url
          : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';

      const newItem: ServerCartItem = {
        _id: `cart_item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        product: {
          _id: targetProduct._id,
          name: targetProduct.name,
          slug: targetProduct.slug,
          price: targetProduct.price,
          images: [{ url: primaryImage, isPrimary: true }],
          quantity: targetProduct.quantity || 50,
          brand: targetProduct.brand,
        },
        quantity: payload.quantity || 1,
        size: payload.size,
        color: payload.color,
        priceAtAdd: targetProduct.price,
      };

      currentCart.items.push(newItem);
    }

    currentCart.updatedAt = new Date().toISOString();
    return {
      status: 'success',
      data: { cart: currentCart },
    } as T;
  }

  // PATCH /cart/items/:id (update quantity)
  const cartItemPatchMatch = cleanPath.match(/^\/cart\/items\/([^/]+)$/);
  if (method === 'PATCH' && cartItemPatchMatch) {
    const itemId = decodeURIComponent(cartItemPatchMatch[1]);
    const quantity = Number(body.quantity || 1);

    const item = currentCart.items.find((i) => i._id === itemId);
    if (item) {
      if (quantity <= 0) {
        currentCart.items = currentCart.items.filter((i) => i._id !== itemId);
      } else {
        item.quantity = quantity;
      }
    }

    currentCart.updatedAt = new Date().toISOString();
    return {
      status: 'success',
      data: { cart: currentCart },
    } as T;
  }

  // DELETE /cart/items/:id (remove item)
  const cartItemDeleteMatch = cleanPath.match(/^\/cart\/items\/([^/]+)$/);
  if (method === 'DELETE' && cartItemDeleteMatch) {
    const itemId = decodeURIComponent(cartItemDeleteMatch[1]);
    currentCart.items = currentCart.items.filter((i) => i._id !== itemId);
    currentCart.updatedAt = new Date().toISOString();

    return {
      status: 'success',
      data: { cart: currentCart },
    } as T;
  }

  // POST /cart/merge
  if (method === 'POST' && cleanPath === '/cart/merge') {
    const incomingItems = (body.items || []) as CartItemPayload[];

    incomingItems.forEach((payload) => {
      const targetProduct =
        mockProducts.find((p) => p._id === payload.productId || p.id === payload.productId) ||
        mockProducts[0];

      const existingIndex = currentCart.items.findIndex(
        (item) =>
          item.product._id === targetProduct._id &&
          item.size === payload.size &&
          item.color === payload.color
      );

      if (existingIndex > -1) {
        currentCart.items[existingIndex].quantity += payload.quantity || 1;
      } else {
        const primaryImage =
          Array.isArray(targetProduct.images) && targetProduct.images.length > 0
            ? typeof targetProduct.images[0] === 'string'
              ? targetProduct.images[0]
              : targetProduct.images[0].url
            : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';

        currentCart.items.push({
          _id: `cart_item_merged_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          product: {
            _id: targetProduct._id,
            name: targetProduct.name,
            slug: targetProduct.slug,
            price: targetProduct.price,
            images: [{ url: primaryImage, isPrimary: true }],
            quantity: targetProduct.quantity || 50,
            brand: targetProduct.brand,
          },
          quantity: payload.quantity || 1,
          size: payload.size,
          color: payload.color,
          priceAtAdd: targetProduct.price,
        });
      }
    });

    currentCart.updatedAt = new Date().toISOString();
    return {
      status: 'success',
      data: { cart: currentCart },
    } as T;
  }

  // ==========================================
  // 5. ORDER OPERATIONS
  // ==========================================

  // POST /orders (create order)
  if (method === 'POST' && cleanPath === '/orders') {
    const orderPayload = body as unknown as CreateOrderPayload;
    const subtotal = currentCart.items.reduce(
      (sum, item) => sum + item.priceAtAdd * item.quantity,
      0
    );
    const shippingFee = orderPayload.shippingMethod === 'express' ? 12 : 0;
    const total = subtotal + shippingFee;

    const orderItems = currentCart.items.map((cartItem) => ({
      _id: `ord_item_${Date.now()}_${cartItem._id}`,
      product: {
        _id: cartItem.product._id,
        name: cartItem.product.name,
        slug: cartItem.product.slug,
        brand: cartItem.product.brand,
        images: cartItem.product.images,
      },
      name: cartItem.product.name,
      sku: `DEMO-${cartItem.product._id}`,
      price: cartItem.priceAtAdd,
      quantity: cartItem.quantity,
      size: cartItem.size,
      color: cartItem.color,
      imageUrl: cartItem.product.images[0]?.url,
    }));

    const newOrder: Order = {
      _id: `ord_demo_${Date.now()}`,
      orderNumber: `JCK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      user: {
        _id: currentUser._id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone,
      },
      items: orderItems.length > 0 ? orderItems : mockOrders[0].items,
      shippingAddress: orderPayload.shippingAddress,
      shippingMethod: orderPayload.shippingMethod || 'standard',
      shippingFee,
      subtotal: subtotal || 130,
      total: total || 130,
      paymentMethod: orderPayload.paymentMethod || 'credit_card',
      paymentStatus: 'paid',
      status: 'confirmed',
      contactEmail: orderPayload.contactEmail || currentUser.email,
      contactPhone: orderPayload.contactPhone || currentUser.phone,
      notes: orderPayload.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    currentOrders.unshift(newOrder);

    // Clear server cart after successful placement
    currentCart.items = [];
    currentCart.updatedAt = new Date().toISOString();

    return {
      status: 'success',
      data: { order: newOrder },
    } as T;
  }

  // GET /orders/my or GET /orders
  if (method === 'GET' && (cleanPath === '/orders/my' || cleanPath === '/orders')) {
    const page = Number(params?.page || 1);
    const limit = Number(params?.limit || 10);
    const paginated = currentOrders.slice((page - 1) * limit, page * limit);

    return {
      status: 'success',
      results: paginated.length,
      pagination: {
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(currentOrders.length / limit)),
        totalResults: currentOrders.length,
      },
      data: { orders: paginated },
    } as T;
  }

  // GET /orders/:id
  const orderByIdMatch = cleanPath.match(/^\/orders\/([^/]+)$/);
  if (method === 'GET' && orderByIdMatch) {
    const orderIdOrNum = decodeURIComponent(orderByIdMatch[1]);
    const found = currentOrders.find(
      (o) => o._id === orderIdOrNum || o.orderNumber === orderIdOrNum
    );

    if (!found) {
      throw new ApiError(`Order "${orderIdOrNum}" not found in demo records`, 404);
    }

    return {
      status: 'success',
      data: { order: found },
    } as T;
  }

  // PATCH /orders/:id/cancel
  const orderCancelMatch = cleanPath.match(/^\/orders\/([^/]+)\/cancel$/);
  if (method === 'PATCH' && orderCancelMatch) {
    const orderId = decodeURIComponent(orderCancelMatch[1]);
    const found = currentOrders.find((o) => o._id === orderId || o.orderNumber === orderId);

    if (!found) {
      throw new ApiError(`Order "${orderId}" not found`, 404);
    }

    found.status = 'cancelled';
    found.cancelReason = String(body.reason || 'Cancelled by customer via demo interface');
    found.cancelledAt = new Date().toISOString();
    found.updatedAt = new Date().toISOString();

    return {
      status: 'success',
      data: { order: found },
    } as T;
  }

  // PATCH /orders/:id/status
  const orderStatusMatch = cleanPath.match(/^\/orders\/([^/]+)\/status$/);
  if (method === 'PATCH' && orderStatusMatch) {
    const orderId = decodeURIComponent(orderStatusMatch[1]);
    const found = currentOrders.find((o) => o._id === orderId || o.orderNumber === orderId);

    if (!found) {
      throw new ApiError(`Order "${orderId}" not found`, 404);
    }

    found.status = (body.status as OrderStatus) || found.status;
    found.updatedAt = new Date().toISOString();

    return {
      status: 'success',
      data: { order: found },
    } as T;
  }

  // Fallback for unhandled demo routes: return generic success envelope
  return {
    status: 'success',
    data: {},
    message: `[Demo Mode] Endpoint ${method} ${cleanPath} simulated successfully.`,
  } as T;
}
