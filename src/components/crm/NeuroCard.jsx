import React from "react";

export default function NeuroCard({ children, className = "", inset = false }) {
  return (
    <div className={`${inset ? 'neuro-inset' : 'neuro-card'} p-6 ${className}`}>
      {children}
    </div>
  );
}