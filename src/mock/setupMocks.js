import AxiosMockAdapter from 'axios-mock-adapter';
import axiosClient from '../common/axiosClient';
import { mockUser, mockProducts, mockVariants, mockCategories, mockColors, mockSizes } from './mockData';

// Helper to normalize MongoDB $oid to string (duplicate from mockData for use here)
const getID = (obj) => {
  if (!obj) return null;
  return obj.$oid || obj;
};

export const setupMocks = () => {
  console.log("%c [GASH Demo] Initializing API Mocks... ", "background: #333; color: #ffcc00; font-weight: bold;");
  
  // Force baseURL to something predictable for mocking
  axiosClient.defaults.baseURL = 'http://gash-demo-mock';
  
  const mock = new AxiosMockAdapter(axiosClient, { delayResponse: 500 });
  
  const restrictedMessage = "This page is running in demo mode. To fully explore the project, please clone it and run it locally.";
  
  // -- Auth --
  mock.onGet(/.*\/auth\/check-status/).reply(200, { message: 'Active' });
  
  mock.onPost(/.*\/auth\/login/).reply(200, {
      token: "demo-token-12345",
      account: mockUser
  });

  mock.onPost(/.*\/auth\/logout/).reply(200);
  
  // Match Api.accounts.updateProfile: /accounts/change-profile/${userId}
  mock.onPut(/.*\/accounts\/change-profile\/.*/).reply(400, { message: restrictedMessage });
  mock.onPut(/.*\/accounts\/change-password\/.*/).reply(400, { message: restrictedMessage });
  mock.onPost(/.*\/auth\/forgot-password.*/).reply(400, { message: restrictedMessage });

  // -- Categories --
  mock.onGet(/.*\/categories\/get-all-categories/).reply(200, mockCategories);
  
  // -- Colors & Sizes (Helpful for filters) --
  mock.onGet(/.*\/product-colors/).reply(200, mockColors);
  mock.onGet(/.*\/product-sizes/).reply(200, mockSizes);

  // -- Products (Both old and new endpoints with filtering) --
  mock.onGet(/.*\/(new-products|products)(\?.*)?$/).reply(config => {
      const urlParts = config.url.split('?');
      let filtered = [...mockProducts];
      
      if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1]);
          const catId = params.get('categoryId');
          const search = params.get('search') || params.get('q');
          
          if (catId) {
              filtered = filtered.filter(p => getID(p.categoryId) === catId);
          }
          if (search) {
              const query = search.toLowerCase();
              filtered = filtered.filter(p => 
                  p.productName.toLowerCase().includes(query) || 
                  (p.description && p.description.toLowerCase().includes(query))
              );
          }
      }
      return [200, filtered];
  });

  // Specific search endpoints
  mock.onGet(/.*\/(new-products|products)\/search(\?.*)?$/).reply(config => {
      const urlParts = config.url.split('?');
      let filtered = [...mockProducts];
      
      if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1]);
          const query = (params.get('q') || params.get('search') || '').toLowerCase();
          
          if (query) {
              filtered = filtered.filter(p => 
                  p.productName.toLowerCase().includes(query) || 
                  (p.description && p.description.toLowerCase().includes(query))
              );
          }
      }
      return [200, { data: filtered }]; // Some search endpoints expect wrapped data
  });

  // Single Product Detail
  mock.onGet(/.*\/(new-products|products)\/[a-zA-Z0-9_-]+/).reply(config => {
      const parts = config.url.split('/');
      const id = parts[parts.length - 1].split('?')[0];
      const product = mockProducts.find(p => p._id === id);
      return product ? [200, product] : [404, { message: "Product not found" }];
  });

  // -- Variants --
  mock.onGet(/.*\/new-variants\/get-all-variants/).reply(200, mockVariants);
  
  // Filtering variants (e.g., getting variants for a specific product)
  mock.onGet(/.*\/(new-variants|variants)(\?.*)?$/).reply(config => {
      const urlParts = config.url.split('?');
      if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1]);
          const productId = params.get('productId');
          if (productId) {
              const filtered = mockVariants.filter(v => v.productId === productId);
              return [200, filtered];
          }
      }
      return [200, mockVariants];
  });

  // -- Customer Profile --
  mock.onGet(/.*\/accounts\/[a-zA-Z0-9_-]+/).reply(200, mockUser);

  // ==== PERSISTENT MOCK STORAGE HELPERS ====
  const getStored = (key, fallback = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  const setStored = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  const MOCK_KEYS = {
      CART: 'GASH_MOCK_CART',
      FAVORITES: 'GASH_MOCK_FAVORITES',
      ORDERS: 'GASH_MOCK_ORDERS'
  };

  // -- Initialize Demo Data --
  const currentCart = getStored(MOCK_KEYS.CART);
  const initialVariants = ["69183e9eef9cc2d8dc359b3d", "69185569a17ac3f26c226e30"];
  let cartChanged = false;
  initialVariants.forEach((vId, idx) => {
      if (!currentCart.find(item => getID(item.variantId) === vId)) {
          currentCart.push({ _id: `initial_cart_${idx + 1}`, variantId: vId, quantity: idx + 1 });
          cartChanged = true;
      }
  });
  if (cartChanged) setStored(MOCK_KEYS.CART, currentCart);

  const currentFavs = getStored(MOCK_KEYS.FAVORITES);
  const initialProducts = ["6916c4f34945cd9a5d8631fb", "691836f7bc4af928d6320cb3"];
  let favsChanged = false;
  initialProducts.forEach((pId, idx) => {
      if (!currentFavs.find(item => getID(item.productId) === pId)) {
          currentFavs.push({ _id: `initial_fav_${idx + 1}`, productId: pId });
          favsChanged = true;
      }
  });
  if (favsChanged) setStored(MOCK_KEYS.FAVORITES, currentFavs);

  const currentOrders = getStored(MOCK_KEYS.ORDERS);
  const initialOrderIds = ["demo_order_1", "demo_order_2"];
  let ordersChanged = false;
  
  if (!currentOrders.find(o => o._id === "demo_order_1")) {
      currentOrders.push({
          _id: "demo_order_1",
          orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          orderStatus: "delivered",
          payStatus: "paid",
          totalPrice: 125,
          finalPrice: 125,
          paymentMethod: "PayPal",
          addressReceive: mockUser.address,
          phone: mockUser.phone,
          customer: { name: mockUser.name, email: mockUser.email, username: mockUser.username },
          orderDetails: [
              { variantId: "6916c92382ece642cea141c1", quantity: 1, productPrice: 45 },
              { variantId: "69183e9eef9cc2d8dc359b3d", quantity: 1, productPrice: 80 }
          ]
      });
      ordersChanged = true;
  }
  
  if (!currentOrders.find(o => o._id === "demo_order_2")) {
      currentOrders.push({
          _id: "demo_order_2",
          orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          orderStatus: "shipping",
          payStatus: "paid",
          totalPrice: 110,
          finalPrice: 110,
          paymentMethod: "Credit Card",
          addressReceive: mockUser.address,
          phone: mockUser.phone,
          customer: { name: mockUser.name, email: mockUser.email, username: mockUser.username },
          orderDetails: [
              { variantId: "69185569a17ac3f26c226e30", quantity: 2, productPrice: 55 }
          ]
      });
      ordersChanged = true;
  }
  
  if (ordersChanged) setStored(MOCK_KEYS.ORDERS, currentOrders);

  // Helper to enrich cart/favorite items with product/variant data
  const enrichItem = (item) => {
      // Handle item.variantId being either a string ID or an object with an _id
      const vId = getID(item.variantId?._id || item.variantId || item.variant?._id);
      const variant = mockVariants.find(v => getID(v._id) === vId);
      
      // Get values from item, handling various field name variations from frontend
      const qty = parseInt(item.Quantity || item.quantity || item.productQuantity || item.pro_quantity || 1, 10);
      const price = item.unitPrice || item.productPrice || item.pro_price || variant?.variantPrice || 0;

      if (!variant) {
          console.warn("Mock: Variant not found for enrichment", vId);
          // Return item with basic fields so it doesn't crash, even if ID is unknown
          return {
              ...item,
              _id: item._id || `item_${Date.now()}_${Math.random()}`,
              productName: item.pro_name || "Product (Variant not available)",
              productPrice: price,
              quantity: qty,
              productQuantity: qty.toString(),
              variantId: { _id: vId, productId: { productName: item.pro_name || "Unknown" } }
          };
      }
      
      const pId = getID(variant.productId?._id || variant.productId);
      const product = mockProducts.find(p => getID(p._id) === pId);
      
      const enrichedVariant = {
          ...variant,
          _id: getID(variant._id),
          productId: product || { _id: vId, productName: "Product" },
          product: product || { _id: vId, productName: "Product" },
          image: variant.variantImage || variant.image || "/placeholder.png"
      };

      return {
          ...item,
          _id: item._id || `item_${Date.now()}_${Math.random()}`,
          variantId: enrichedVariant,
          variant: enrichedVariant,
          productName: product?.productName || variant.variantName || "Product",
          productPrice: price || variant.variantPrice || 0,
          quantity: qty,
          productQuantity: qty.toString()
      };
  };

  // -- Cart Mocks --
  const handleGetCart = () => {
      const cart = getStored(MOCK_KEYS.CART);
      return [200, { data: cart.map(enrichItem) }];
  };
  
  mock.onGet(/.*\/carts(\?.*)?$/).reply(handleGetCart);
  mock.onGet(/.*\/new-carts\/account\/.*/).reply(handleGetCart);

  mock.onPost(/.*\/(carts|new-carts)/).reply(config => {
      const data = JSON.parse(config.data);
      const cart = getStored(MOCK_KEYS.CART);
      const variantId = getID(data.variantId);
      
      const existingIndex = cart.findIndex(item => getID(item.variantId) === variantId);
      const qty = parseInt(data.quantity || data.productQuantity || 1, 10);

      if (existingIndex > -1) {
          const currentQty = parseInt(cart[existingIndex].quantity || cart[existingIndex].productQuantity || 1, 10);
          cart[existingIndex].productQuantity = (currentQty + qty).toString();
          cart[existingIndex].quantity = currentQty + qty;
      } else {
          cart.push({ 
              ...data, 
              _id: `cart_${Date.now()}`,
              productQuantity: qty.toString(),
              quantity: qty
          });
      }
      setStored(MOCK_KEYS.CART, cart);
      return [200, { data: cart.map(enrichItem) }];
  });

  mock.onPut(/.*\/(carts|new-carts)\/[a-zA-Z0-9_-]+/).reply(config => {
      const parts = config.url.split('/');
      const id = parts[parts.length - 1];
      const data = JSON.parse(config.data);
      let cart = getStored(MOCK_KEYS.CART);
      
      cart = cart.map(item => {
          if (item._id === id) {
              const updated = { ...item, ...data };
              if (data.productQuantity) updated.quantity = parseInt(data.productQuantity, 10);
              return updated;
          }
          return item;
      });
      
      setStored(MOCK_KEYS.CART, cart);
      return [200, { message: "Updated" }];
  });

  mock.onDelete(/.*\/(carts|new-carts)\/[a-zA-Z0-9_-]+/).reply(config => {
      const parts = config.url.split('/');
      const id = parts[parts.length - 1];
      let cart = getStored(MOCK_KEYS.CART);
      cart = cart.filter(item => item._id !== id);
      setStored(MOCK_KEYS.CART, cart);
      return [200, { message: "Removed" }];
  });

  mock.onDelete(/.*\/carts\/batch/).reply(config => {
      const { ids } = JSON.parse(config.data);
      let cart = getStored(MOCK_KEYS.CART);
      cart = cart.filter(item => !ids.includes(item._id));
      setStored(MOCK_KEYS.CART, cart);
      return [200, { message: "Batch removed" }];
  });

  // -- Favorites Mocks --
  const handleGetFavorites = () => {
      const favorites = getStored(MOCK_KEYS.FAVORITES);
      return [200, { data: favorites.map(item => {
          const product = mockProducts.find(p => getID(p._id) === getID(item.productId));
          return { ...item, productId: product || item.productId };
      }) }];
  };

  mock.onGet(/.*\/favorites/).reply(handleGetFavorites);
  
  mock.onPost(/.*\/favorites/).reply(config => {
      const data = JSON.parse(config.data);
      const favorites = getStored(MOCK_KEYS.FAVORITES);
      const pId = getID(data.productId);

      if (!favorites.find(f => getID(f.productId) === pId)) {
          favorites.push({ ...data, _id: `fav_${Date.now()}`, productId: pId });
          setStored(MOCK_KEYS.FAVORITES, favorites);
      }
      return [200, { data: favorites }];
  });

  mock.onDelete(/.*\/favorites\/[a-zA-Z0-9_-]+/).reply(config => {
      const parts = config.url.split('/');
      const id = parts[parts.length - 1];
      let favorites = getStored(MOCK_KEYS.FAVORITES);
      favorites = favorites.filter(f => f._id !== id);
      setStored(MOCK_KEYS.FAVORITES, favorites);
      return [200, { message: "Removed from favorites" }];
  });

  // -- Ordering & Checkout --
  mock.onPost(/.*\/orders\/checkout/).reply(config => {
      const data = JSON.parse(config.data);
      const orders = getStored(MOCK_KEYS.ORDERS);
      
      // Use items from request body if present (for Buy Now and proper sync)
      // Fallback to cart if items missing (legacy/other flows)
      const itemsToEnrich = data.items || getStored(MOCK_KEYS.CART);
      const enrichedItems = itemsToEnrich.map(enrichItem);
      const totalPrice = data.totalPrice || enrichedItems.reduce((acc, item) => acc + (item.productPrice || 0) * (item.quantity || 1), 0);

      const newOrder = {
          ...data,
          _id: `order_${Date.now()}`,
          orderDetails: enrichedItems,
          orderStatus: "pending",
          payStatus: "unpaid",
          orderDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          totalPrice: totalPrice,
          finalPrice: totalPrice, // Simplified for mock
          customer: { 
            name: mockUser.name || mockUser.fullName, 
            email: mockUser.email, 
            username: mockUser.username 
          },
          addressReceive: data.addressReceive || "Default Demo Address",
          phone: data.phone || "0123456789",
          paymentMethod: data.paymentMethod || "COD"
      };
      orders.push(newOrder);
      setStored(MOCK_KEYS.ORDERS, orders);
      
      // Clear cart only if it was a cart checkout
      if (!data.buyNow) {
          setStored(MOCK_KEYS.CART, []);
      }
      
      return [200, { data: newOrder }];
  });

  mock.onGet(/.*\/orders\/user\/.*/).reply(config => {
    const userId = config.url.split('/').pop();
    const allOrders = getStored(MOCK_KEYS.ORDERS);
    
    // In demo mode, we might want to see all orders or just the current user's
    // Letting it see all orders for now but adding resilience
    const normalizedOrders = allOrders.map(order => ({
        ...order,
        orderDate: order.orderDate || order.createdAt || new Date().toISOString(),
        finalPrice: order.finalPrice || order.totalPrice || 0,
        orderDetails: (order.orderDetails || order.items || []).map(enrichItem)
    }));

    normalizedOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    return [200, { data: normalizedOrders }];
  });

  mock.onGet(/.*\/orders\/get-order-by-id\/.*/).reply(config => {
      const id = config.url.split('/').pop();
      const order = getStored(MOCK_KEYS.ORDERS).find(o => o._id === id);
      if (!order) return [404, { message: "Order not found" }];
      
      const normalized = {
          ...order,
          orderDate: order.orderDate || order.createdAt || new Date().toISOString(),
          finalPrice: order.finalPrice || order.totalPrice || 0,
          orderDetails: (order.orderDetails || order.items || []).map(enrichItem)
      };
      return [200, { data: normalized }];
  });

  mock.onGet(/.*\/orders\/search(\?.*)?$/).reply(config => {
    const urlParts = config.url.split('?');
    let filtered = getStored(MOCK_KEYS.ORDERS);

    if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1]);
        const q = (params.get('q') || '').toLowerCase();
        
        if (q) {
            filtered = filtered.filter(order => 
                order._id.toLowerCase().includes(q) ||
                (order.name && order.name.toLowerCase().includes(q)) ||
                (order.phone && order.phone.toLowerCase().includes(q))
            );
        }
    }

    const normalized = filtered.map(order => ({
        ...order,
        orderDate: order.orderDate || order.createdAt || new Date().toISOString(),
        finalPrice: order.finalPrice || order.totalPrice || 0,
        orderDetails: (order.orderDetails || order.items || []).map(enrichItem)
    }));

    return [200, { data: normalized }];
  });

  mock.onGet(/.*\/order-details\/search(\?.*)?$/).reply(config => {
    const urlParts = config.url.split('?');
    const allOrders = getStored(MOCK_KEYS.ORDERS);
    let allItems = [];
    allOrders.forEach(order => {
        const enrichedItems = (order.orderDetails || order.items || []).map(item => ({
            ...enrichItem(item),
            orderId: order._id,
            orderDate: order.orderDate || order.createdAt
        }));
        allItems = allItems.concat(enrichedItems);
    });

    if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1]);
        const q = (params.get('q') || '').toLowerCase();
        
        if (q) {
            allItems = allItems.filter(item => 
                (item.productName && item.productName.toLowerCase().includes(q)) ||
                (item.orderId && item.orderId.toLowerCase().includes(q)) ||
                (item.variantId && item.variantId.productColorId && item.variantId.productColorId.productColorName && item.variantId.productColorId.productColorName.toLowerCase().includes(q))
            );
        }
    }

    return [200, { data: allItems }];
  });

  // Catch-all 
  mock.onAny().reply(config => {
    console.warn(`[GASH Demo] Unmatched Request: ${config.method.toUpperCase()} ${config.url}`, config);
    return [404, { message: "Mock not found for this endpoint" }];
  });

  // Diagnostic tool
  window.GASH_DEMO_TEST = async () => {
      console.log("[GASH Demo] Running internal API test...");
      try {
          const res = await axiosClient.get('/new-products');
          console.log("[GASH Demo] Test Success!", res.data);
          return res.data;
      } catch (e) {
          console.error("[GASH Demo] Test Failed!", e);
      }
  };

  window.__GASH_DEMO_ACTIVE__ = true;
};
