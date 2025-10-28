import React from "react";

export default function NeuroInput({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder,
  required = false,
  className = "",
  ...props 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium" style={{ color: "#333" }}>
          {label} {required && <span style={{ color: "#f5222d" }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="ampvibe-input w-full"
        {...props}
      />
    </div>
  );
}