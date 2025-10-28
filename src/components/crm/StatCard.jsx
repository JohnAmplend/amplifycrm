import React from "react";
import NeuroCard from "./NeuroCard";

export default function StatCard({ icon: Icon, title, value, subtitle, color = "#333" }) {
  return (
    <NeuroCard>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium mb-2" style={{ color: "#666" }}>
            {title}
          </p>
          <p className="text-3xl font-bold mb-1" style={{ color }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs" style={{ color: "#888" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="ampvibe-inset p-3 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </NeuroCard>
  );
}