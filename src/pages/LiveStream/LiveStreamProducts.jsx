import React, { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../../common/axiosClient';
import Api from '../../common/SummaryAPI';

const LiveStreamProducts = ({ liveId }) => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const socketRef = useRef(null);

    // Helper: Get product name
    const getProductName = (product) => {
        if (!product) return 'Unnamed';
        const productName = product.productName || product.name || product.title;
        if (typeof productName === 'string') {
            return productName.trim() || 'Unnamed';
        }
        return 'Unnamed';
    };

    // Helper: Get main product image URL
    const getMainImageUrl = (product) => {
        if (!product) return null;

        // Handle WebSocket format: product.image (direct URL string)
        if (product.image && typeof product.image === 'string') {
            return product.image;
        }

        // Handle API format: productImageIds array
        const images = product.productImageIds || product.images || [];
        if (images.length === 0) return null;
        const mainImage = images.find(img => img.isMain === true);
        return mainImage?.imageUrl || images[0]?.imageUrl || null;
    };

    // Helper: Get minimum price from product variants
    const getMinPrice = (product) => {
        if (!product) return 0;
        const variants = product.productVariantIds || product.variants || [];
        if (variants.length === 0) return 0;
        const prices = variants
            .filter(v => v && v.variantStatus !== 'discontinued' && v.variantPrice > 0)
            .map(v => v.variantPrice);
        return prices.length > 0 ? Math.min(...prices) : 0;
    };

    // Helper: Format price to VND currency
    const formatPrice = (price) => {
        if (!price || price === 0) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Helper: Sort products - pinned first, then by added date (newest first)
    const sortProducts = (products) => {
        return [...products].sort((a, b) => {
            const aPinned = Boolean(a.isPinned);
            const bPinned = Boolean(b.isPinned);
            // If pinned status differs, pinned items come first
            if (aPinned !== bPinned) {
                return Number(bPinned) - Number(aPinned); // true (1) - false (0) = 1 → b before a
            }
            // If both have same pinned status, sort by added date (newest first)
            // So newly added products appear at the top
            return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
        });
    };

    // Load live products
    const loadProducts = useCallback(async () => {
        if (!liveId) return;
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await Api.livestream.getLiveProducts(liveId, token);

            // Frontend API doesn't use .then(), so response is axios response
            if (response.data?.success) {
                const productsData = response.data.data || [];
                // Sort products: pinned first, then by added date
                setProducts(sortProducts(productsData));
            }
        } catch (error) {
            console.error('Error loading live products:', error);
        } finally {
            setIsLoading(false);
        }
    }, [liveId]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Setup WebSocket for real-time products updates
    useEffect(() => {
        if (!liveId) return;

        const socket = io(SOCKET_URL, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('joinLiveProductRoom', liveId);
        });

        // Handle product added
        socket.on('product:added', (data) => {
            if (data?.liveId === liveId && data?.liveProduct) {
                setProducts(prev => {
                    // Check if product already exists
                    const exists = prev.some(p => p._id === data.liveProduct._id);
                    if (exists) return prev;
                    // Add new product and sort (pinned first, then by added date)
                    return sortProducts([...prev, data.liveProduct]);
                });
            }
        });

        // Handle product removed
        socket.on('product:removed', (data) => {
            if (data?.liveId === liveId && data?.productId) {
                setProducts(prev => prev.filter(p => {
                    // Handle both WebSocket format (productId as string) and API format (productId as object)
                    const pId = typeof p.productId === 'string' ? p.productId : p.productId?._id;
                    return pId !== data.productId;
                }));
            }
        });

        // Handle product pinned
        socket.on('product:pinned', (data) => {
            if (data?.liveId === liveId && data?.liveProduct) {
                // Backend emits full liveProduct object, not just ID
                const productIdToPin = data.liveProduct._id || data.liveProductId;
                setProducts(prev => {
                    const updated = prev.map(p =>
                        p._id === productIdToPin
                            ? { ...p, isPinned: true }
                            : { ...p, isPinned: false }
                    );
                    // Re-sort after pinning
                    return sortProducts(updated);
                });
            }
        });

        // Handle product unpinned
        socket.on('product:unpinned', (data) => {
            if (data?.liveId === liveId && data?.liveProductId) {
                setProducts(prev => {
                    const updated = prev.map(p =>
                        p._id === data.liveProductId ? { ...p, isPinned: false } : p
                    );
                    // Re-sort after unpinning
                    return sortProducts(updated);
                });
            }
        });

        return () => {
            socket.off('connect');
            socket.off('product:added');
            socket.off('product:removed');
            socket.off('product:pinned');
            socket.off('product:unpinned');
            socket.close();
        };
    }, [liveId]);

    // Navigate to product detail in new tab
    const handleProductClick = (productId) => {
        if (productId) {
            window.open(`/product/${productId}`, '_blank');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 bg-gradient-to-r from-gray-800/40 via-gray-700/40 to-gray-800/40 rounded-lg animate-pulse border border-gray-700/30" />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-gray-700/30">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <p className="text-gray-400 text-xs font-medium">No products available</p>
                <p className="text-gray-500 text-[10px] mt-0.5">Products will appear here when added</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {products.map((lp, index) => {
                // Handle both API format (lp.productId as object) and WebSocket format (lp.product as object)
                const product = lp.product || lp.productId || {};
                const productName = getProductName(product);
                // productId can be string ID (WebSocket) or object with _id (API)
                const productId = typeof lp.productId === 'string' ? lp.productId : (product._id || lp.productId?._id || lp.productId || '');
                const productImageUrl = getMainImageUrl(product);
                const minPrice = getMinPrice(product);
                const orderNumber = index + 1;

                return (
                    <div
                        key={lp._id || productId}
                        onClick={() => handleProductClick(productId)}
                        className={`group cursor-pointer p-2.5 rounded-lg border transition-all duration-300 flex items-center gap-2 backdrop-blur-sm ${lp.isPinned
                            ? 'bg-gradient-to-r from-yellow-900/40 via-yellow-800/30 to-yellow-900/40 border-yellow-500/60 hover:border-yellow-400/80 shadow-lg shadow-yellow-500/20'
                            : 'bg-gradient-to-r from-gray-800/40 via-gray-700/40 to-gray-800/40 border-gray-700/50 hover:border-gray-600/60 hover:bg-gray-800/60'
                            }`}
                    >
                        {/* Order Number Badge */}
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border backdrop-blur-sm shadow-md transition-all duration-300 ${lp.isPinned
                            ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-yellow-400/80 shadow-yellow-500/50'
                            : 'bg-gradient-to-br from-red-500 to-pink-600 text-white border-red-400/80 shadow-red-500/50'
                            }`}>
                            {orderNumber}
                        </div>

                        {/* Product Image */}
                        <div className="relative flex-shrink-0">
                            {productImageUrl ? (
                                <img
                                    src={productImageUrl}
                                    alt={productName}
                                    className="w-12 h-12 object-cover rounded-lg border border-gray-700/50 shadow-md group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23999" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/%3E%3C/svg%3E';
                                    }}
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg border border-gray-700/50 items-center justify-center flex shadow-md">
                                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                            {lp.isPinned && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border border-gray-900 flex items-center justify-center shadow-lg">
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-semibold text-white truncate group-hover:text-yellow-400 transition-colors leading-tight">{productName}</h4>
                            {minPrice > 0 && (
                                <p className="text-xs font-bold text-red-400 mt-0.5">{formatPrice(minPrice)}</p>
                            )}
                            {lp.isPinned && (
                                <p className="text-[9px] text-yellow-400 font-bold mt-0.5">PINNED</p>
                            )}
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-6 h-6 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-full flex items-center justify-center border border-red-500/30">
                                <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default LiveStreamProducts;

