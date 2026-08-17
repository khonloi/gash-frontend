import React, { useState, useCallback, useRef } from "react";
import { ToastContext } from "../../context/ToastContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    id: null,
    message: "",
    type: "",
    visible: false,
  });

  const closeTimerRef = useRef(null);

  const showToast = useCallback((message, type = "info", timeout = 3500) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    const id = Date.now();
    setToast({
      id,
      message,
      type,
      visible: true,
    });

    closeTimerRef.current = setTimeout(() => {
      setToast((prev) => (prev.id === id ? { ...prev, visible: false } : prev));
      closeTimerRef.current = null;
    }, timeout);
  }, []);

  const closeToast = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const toastVariants = {
    success: {
      card: "border-green-500/30 bg-white/95 text-gray-900 shadow-green-500/10",
      accent: "bg-green-500",
      icon: <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" aria-hidden="true" />,
    },
    error: {
      card: "border-red-500/30 bg-white/95 text-gray-900 shadow-red-500/10",
      accent: "bg-red-500",
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" aria-hidden="true" />,
    },
    info: {
      card: "border-amber-500/30 bg-white/95 text-gray-900 shadow-amber-500/10",
      accent: "bg-brand-primary-500",
      icon: <Info className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />,
    },
  };

  const currentVariant = toastVariants[toast.type] || toastVariants.info;

  return (
    <ToastContext.Provider value={{ showToast, closeToast }}>
      {children}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center max-w-sm w-[calc(100%-2rem)]">
        <AnimatePresence>
          {toast.visible && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={`
                pointer-events-auto w-full
                rounded-2xl p-4 border
                shadow-2xl backdrop-blur-md
                relative overflow-hidden
                ${currentVariant.card}
              `}
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              <div className="flex items-center gap-3">
                {currentVariant.icon}
                <p className="text-sm font-medium flex-1 text-gray-800">{toast.message}</p>
                <button
                  type="button"
                  onClick={closeToast}
                  className="shrink-0 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};