import React from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useNetworkStatus from "../../hooks/useNetworkStatus";

export default function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-amber-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-md relative z-[100]"
          role="alert"
          aria-live="assertive"
        >
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>You are currently offline. Some features may not work until connection is restored.</span>
        </motion.div>
      )}
      {isOnline && wasOffline && (
        <motion.div
          key="online-restored"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-emerald-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-md relative z-[100]"
          role="status"
          aria-live="polite"
        >
          <Wifi className="w-4 h-4 shrink-0" />
          <span>Connection restored! You are back online.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
