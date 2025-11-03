// src/components/Toast.tsx
import React, { createContext, useContext, useState, useCallback } from "react";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

type ToastContextType = {
  showToast: (message: string, type?: Toast["type"]) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000); // disappears after 3s
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              minWidth: 240,
              background:
                t.type === "success"
                  ? "#DCFCE7"
                  : t.type === "error"
                  ? "#FEE2E2"
                  : "#DBEAFE",
              color:
                t.type === "success"
                  ? "#166534"
                  : t.type === "error"
                  ? "#991B1B"
                  : "#1E3A8A",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
