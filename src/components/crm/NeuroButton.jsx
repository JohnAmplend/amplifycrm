import React from "react";

export default function NeuroButton({ 
  children, 
  onClick, 
  variant = "default",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  ...props 
}) {
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3",
    lg: "px-6 py-4 text-lg"
  };

  const getClassName = () => {
    if (variant === "primary") {
      return `ampvibe-button-primary ${sizeClasses[size]} font-medium ${className}`;
    }
    return `ampvibe-button ${sizeClasses[size]} font-medium ${className}`;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={getClassName()}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer"
      }}
      {...props}
    >
      {children}
    </button>
  );
}