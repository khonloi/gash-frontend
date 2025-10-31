import React, { useState, useCallback, useRef } from "react";
import { ToastContext } from "../context/ToastContext";

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    message: "",
    type: "",
    visible: false,
    isClosing: false,
  });

  // keep the current timer so we can cancel it
  const closeTimerRef = useRef(null);

  const showToast = useCallback((message, type = "info", timeout = 3000) => {
    // 1. Cancel any running auto-close timer
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    // 2. Force a clean slate (removes old message & animation)
    setToast({
      message: "",
      type: "",
      visible: false,
      isClosing: false,
    });

    // 3. Show the new toast on the next paint
    requestAnimationFrame(() => {
      setToast({
        message,
        type,
        visible: true,
        isClosing: false,
      });

      // 4. Start a fresh auto-close timer
      closeTimerRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, isClosing: true }));
        setTimeout(() => {
          setToast({ message: "", type: "", visible: false, isClosing: false });
          closeTimerRef.current = null;
        }, 300); // fade-out duration
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
      setToast({ message: "", type: "", visible: false, isClosing: false });
    }, 300);
  }, []);

  const toastStyles = {
    success: "border-green-500 bg-green-50 text-green-800",
    error: "border-red-500 bg-red-50 text-red-800",
    info: "border-blue-500 bg-blue-50 text-blue-800",
  };

  const icons = {
    success: (
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        />
      </svg>
    ),
  };

  return (
    <ToastContext.Provider value={{ showToast, closeToast }}>
      {children}

      {toast.visible && (
        <div
          className={`
            fixed top-6 right-6 z-[9999]
            max-w-sm
            rounded-xl p-4 border-l-4
            shadow-xl bg-white backdrop-blur-sm
            transition-opacity duration-300
            ${toastStyles[toast.type] || toastStyles.info}
            ${toast.isClosing ? "opacity-0" : "opacity-100"}
            ${toast.isClosing ? "-translate-y-4 scale-95" : "translate-y-0 scale-100"}
          `}
          style={{
            transform: toast.isClosing
              ? "translateY(-16px) scale(0.95)"
              : "translateY(0) scale(1)",
            transition:
              "opacity 300ms ease-out, transform 300ms cubic-bezier(0.2, 0.8, 0.4, 1)",
          }}
          role="alert"
          tabIndex={0}
        >
          <div className="flex items-center gap-3">
            {icons[toast.type] || icons.info}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={closeToast}
              className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};