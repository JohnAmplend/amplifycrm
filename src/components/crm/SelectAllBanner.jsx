import React from "react";
import { X } from "lucide-react";

export default function SelectAllBanner({ 
  visibleCount, 
  totalCount, 
  onSelectAll, 
  onDismiss 
}) {
  if (visibleCount >= totalCount) return null;

  return (
    <div 
      className="ampvibe-inset mb-4 p-3 flex items-center justify-between"
      style={{
        background: 'rgba(0, 168, 107, 0.1)',
        borderColor: 'rgba(0, 168, 107, 0.3)'
      }}
    >
      <div className="flex-1">
        <span style={{ color: "#666" }}>
          All <strong>{visibleCount}</strong> records on this page are selected.{' '}
          <button
            onClick={onSelectAll}
            className="underline font-medium hover:opacity-70 transition-opacity"
            style={{ color: "#00A86B" }}
          >
            Select all {totalCount} records
          </button>
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="ampvibe-button p-1 ml-3"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}