import { useState, useEffect, useCallback } from "react";

/**
 * Hook for detecting network connection status and offline events.
 *
 * @param {Object} [options={}] - Configuration options
 * @param {Function} [options.onOnline] - Callback when network connection is restored
 * @param {Function} [options.onOffline] - Callback when network connection is lost
 * @returns {{
 *   isOnline: boolean,
 *   wasOffline: boolean,
 *   offlineSince: Date|null
 * }}
 */
export function useNetworkStatus(options = {}) {
  const { onOnline, onOffline } = options;

  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true;
  });
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineSince, setOfflineSince] = useState(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setOfflineSince(null);
    onOnline?.();
  }, [onOnline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    setOfflineSince(new Date());
    onOffline?.();
  }, [onOffline]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
    offlineSince,
  };
}

export default useNetworkStatus;
