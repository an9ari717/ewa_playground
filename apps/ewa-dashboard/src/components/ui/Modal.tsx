// src/components/ui/Modal.tsx
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxWidth?: number;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  maxWidth = 460,
  children,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          background: "var(--card)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(15,23,42,0.6)",
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
