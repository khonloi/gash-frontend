import React, { useState, useCallback, useRef } from "react";
import { ToastContext } from "../../context/ToastContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    message: "",
    type: "",
    visible: false,
    isClosing: false,
    isEntering: false,
  });

  const closeTimerRef = useRef(null);

  const showToast = useCallback((message, type = "info", timeout = 3000) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    setToast({
      message: "",
      type: "",
      visible: false,
      isClosing: false,
      isEntering: false,
    });

    requestAnimationFrame(() => {
      setToast({
        message,
        type,
        visible: true,
        isClosing: false,
        isEntering: true,
      });

      setTimeout(() => {
        setToast((prev) => ({ ...prev, isEntering: false }));
      }, 300);

      closeTimerRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, isClosing: true }));
        setTimeout(() => {
          setToast({ message: "", type: "", visible: false, isClosing: false, isEntering: false });
          closeTimerRef.current = null;
        }, 350);
      }, timeout);
    });
  }, []);

  const closeToast = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setToast((prev) => ({ ...prev, isClosing: true }));
    setTimeout(() => {
      setToast({ message: "", type: "", visible: false, isClosing: false, isEntering: false });
    }, 350);
  }, []);

  const toastStyles = {
    success: "border-green-500 bg-green-50 text-green-900",
    error: "border-red-500 bg-red-50 text-red-900",
    info: "border-blue-500 bg-blue-50 text-blue-900",
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" aria-hidden="true" />,
  };

  return (
    <ToastContext.Provider value={{ showToast, closeToast }}>
      {children}

      {toast.visible && (
        <div
          className={`
            fixed bottom-6 left-1/2 z-[9999]
            max-w-sm w-[calc(100%-3rem)]
            rounded-xl p-4 border-l-4
            shadow-xl bg-white
            ${toastStyles[toast.type] || toastStyles.info}
            ${toast.isClosing
              ? "opacity-0 translate-y-4"
              : toast.isEntering
                ? "opacity-0 translate-y-4"
                : "opacity-100 translate-y-0"}
          `}
          style={{
            transform: toast.isClosing
              ? "translateX(-50%) translateY(20px)"
              : toast.isEntering
                ? "translateX(-50%) translateY(20px)"
                : "translateX(-50%) translateY(0)",
            transition: toast.isClosing
              ? "opacity 350ms cubic-bezier(0.68, -0.275, 0.115, 0.825), transform 350ms cubic-bezier(0.68, -0.275, 0.115, 0.825)"
              : toast.isEntering
                ? "opacity 350ms cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 350ms cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                : "opacity 350ms cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 350ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          tabIndex={0}
        >
          <div className="flex items-center gap-3">
            {icons[toast.type] || icons.info}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={closeToast}
              className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200/60 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              aria-label="Close notification"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};