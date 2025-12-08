// src/components/TopBrand.tsx
import React from "react";

/**
 * Small centered EWA logo for the top header.
 * This is used by AppShell and should NOT take full page height.
 */
export default function TopBrand() {
  return (
    <div className="app-header__middle">
      <img
        src="/ewa-logo.png"
        alt="Electricity & Water Authority (EWA) Bahrain"
        className="app-header__logo"
        draggable={false}
      />
    </div>
  );
}
