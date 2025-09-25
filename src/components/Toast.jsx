import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ message: "", type: "", visible: false, isClosing: false });

  const showToast = useCallback((message, type = "error", timeout = 3000) => {
    setToast({ message, type, visible: true, isClosing: false });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isClosing: true }));
      setTimeout(() => {
        setToast({ message: "", type: "", visible: false, isClosing: false });
      }, 300); // Duration of fade-out animation
    }, timeout);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <div
          className={`login-toast login-toast-${toast.type} ${toast.isClosing ? 'login-toast-exit' : ''}`}
          role="alert"
          tabIndex={0}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};