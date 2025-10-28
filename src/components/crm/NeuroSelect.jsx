import React from "react";

export default function NeuroSelect({ 
  label, 
  value, 
  onChange, 
  options = [],
  placeholder = "Select...",
  required = false,
  className = "",
  ...props 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium" style={{ color: "#666" }}>
          {label} {required && <span style={{ color: "#f5222d" }}>*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="neuro-input w-full"
        style={{ cursor: "pointer" }}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}