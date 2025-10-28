import React from "react";

export default function NeuroButton({ 
  children, 
  onClick, 
  variant = "default",
  size = "md",
  className = "",
  disabled = false,
  ...props 
}) {
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3",
    lg: "px-6 py-4 text-lg"
  };

  const variantStyles = {
    default: { color: "#666" },
    primary: { color: "#4a90e2" },
    success: { color: "#52c41a" },
    danger: { color: "#f5222d" }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`neuro-button ${sizeClasses[size]} font-medium ${className}`}
      style={{
        ...variantStyles[variant],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer"
      }}
      {...props}
    >
      {children}
    </button>
  );
}