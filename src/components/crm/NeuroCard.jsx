import React from "react";

export default function NeuroCard({ children, className = "", inset = false, onClick }) {
  return (
    <div 
      className={`${inset ? 'ampvibe-inset' : 'ampvibe-card'} p-6 ${className} ${onClick ? 'cursor-pointer hover:scale-[1.01] transition-transform' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}