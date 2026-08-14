import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../../../common/SummaryAPI";
import { getSocket, registerUserSocket } from "../../../common/socketManager";
import {
  sendOrderNotificationEmail,
  extractOrderIdFromMessage,
} from "../../../utils/orderEmailNotification";

const MAX_ORDER_CACHE = 20;
const emailedNotificationsSet = new Set();

/**
 * Custom hook to manage notifications lifecycle, realtime socket updates,
 * email triggers, caching, and read/delete actions.
 */
export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const orderCacheRef = useRef(new Map());

  const hasDetailedOrderInfo = useCallback((order) => {
    return Boolean(
      order?.orderDetails?.some(
        (detail) => detail?.variantId?.productId?.productName
      )
    );
  }, []);

  const pruneCacheIfNeeded = useCallback(() => {
    const cache = orderCacheRef.current;
    if (cache.size <= MAX_ORDER_CACHE) return;
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }, []);

  const mergeOrderIntoCache = useCallback(
    (suffixKey, orderData) => {
      if (!suffixKey || !orderData) return;
      const normalizedKey = suffixKey.toLowerCase();
      orderCacheRef.current.set(normalizedKey, orderData);
      pruneCacheIfNeeded();
    },
    [pruneCacheIfNeeded]
  );

  const fetchOrderDataBySuffix = useCallback(
    async (orderIdSuffix) => {
      if (!orderIdSuffix || !user?._id) return null;
      const normalizedSuffix = orderIdSuffix.toString().toLowerCase();
      const cache = orderCacheRef.current;
      const cachedOrder = cache.get(normalizedSuffix);
      if (cachedOrder && hasDetailedOrderInfo(cachedOrder)) {
        return cachedOrder;
      }

      try {
        let orderIdToFetch = cachedOrder?._id;

        if (!orderIdToFetch) {
          const response = await Api.order.getOrders(user._id);
          const ordersList = response.data?.data || [];
          const matchedOrder = ordersList.find(
            (orderItem) =>
              orderItem?._id?.slice(-8).toLowerCase() === normalizedSuffix
          );
          if (!matchedOrder) {
            return cachedOrder || null;
          }
          orderIdToFetch = matchedOrder._id;
          mergeOrderIntoCache(normalizedSuffix, matchedOrder);
          if (hasDetailedOrderInfo(matchedOrder)) {
            return matchedOrder;
          }
        }

        if (!orderIdToFetch) {
          return cachedOrder || null;
        }

        const detailedResponse = await Api.order.getOrder(orderIdToFetch);
        const detailedOrder = detailedResponse.data?.data;
        if (detailedOrder) {
          mergeOrderIntoCache(normalizedSuffix, detailedOrder);
          return detailedOrder;
        }
      } catch (err) {
        console.error("Failed to fetch order data for email:", err);
      }

      return cachedOrder || null;
    },
    [user, hasDetailedOrderInfo, mergeOrderIntoCache]
  );

  // Fetch list of notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const res = await Api.notifications.getUserNotifications(user._id);
      const data = res.data || res;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // Initial fetch and 30s polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Real-time socket events
  useEffect(() => {
    if (!user?._id) return;

    registerUserSocket(user._id);
    const socket = getSocket();

    const handleNewNotification = (data) => {
      setNotifications((prev) => {
        const exists = prev.some(
          (n) => n._id === data._id || n._id?.toString() === data._id?.toString()
        );
        if (exists) return prev;
        return [data, ...prev];
      });

      const notificationId = data._id?.toString() || data._id;
      const hasSentEmail = emailedNotificationsSet.has(notificationId);

      if (data.type === "order" && user?.email && !hasSentEmail) {
        emailedNotificationsSet.add(notificationId);
        const orderIdSuffix = extractOrderIdFromMessage(data.message);
        (async () => {
          try {
            const orderInfo = orderIdSuffix
              ? await fetchOrderDataBySuffix(orderIdSuffix)
              : null;
            await sendOrderNotificationEmail({
              userEmail: user.email,
              userName: user.name || user.username,
              title: data.title,
              message: data.message,
              orderId: orderInfo?._id || orderIdSuffix,
              orderInfo,
            });
          } catch (err) {
            emailedNotificationsSet.delete(notificationId);
            console.error("Failed to send order notification email:", err);
          }
        })();
      }
    };

    const handleBadgeUpdate = () => {
      fetchNotifications();
    };

    const handleNotificationDeleted = (data) => {
      const { notificationId, userId } = data;
      if (!notificationId) return;
      if (userId && user?._id && userId.toString() !== user._id.toString()) return;

      setNotifications((prev) => {
        const filtered = prev.filter((n) => {
          const nId = n._id?.toString() || n._id;
          const deletedId = notificationId?.toString() || notificationId;
          return nId !== deletedId;
        });

        if (filtered.length === prev.length) {
          setTimeout(fetchNotifications, 500);
        }
        return filtered;
      });
    };

    const handleOrderUpdated = (payload) => {
      const updatedOrder = payload?.order || payload;
      const orderId = updatedOrder?._id;
      if (!orderId) return;
      const suffixKey = orderId.slice(-8).toLowerCase();
      mergeOrderIntoCache(suffixKey, updatedOrder);
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("notificationBadgeUpdate", handleBadgeUpdate);
    socket.on("notificationDeleted", handleNotificationDeleted);
    socket.on("orderUpdated", handleOrderUpdated);

    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("notificationBadgeUpdate", handleBadgeUpdate);
      socket.off("notificationDeleted", handleNotificationDeleted);
      socket.off("orderUpdated", handleOrderUpdated);
    };
  }, [user, fetchOrderDataBySuffix, mergeOrderIntoCache, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id) => {
    try {
      await Api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await Api.notifications.deleteUserNotification(user._id, id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const clearAll = async () => {
    try {
      await Api.notifications.clearAll(user._id);
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear all notifications:", err);
    }
  };

  const handleNotificationClick = async (item, close) => {
    if (!item.isRead) {
      await markAsRead(item._id);
    }

    if (item.link) {
      if (item.link.startsWith("http://") || item.link.startsWith("https://")) {
        window.location.href = item.link;
      } else {
        navigate(item.link);
      }
    } else {
      navigate("/notifications");
    }

    if (close) close();
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    clearAll,
    handleNotificationClick,
  };
}

export default useNotifications;
