import React from "react";
import NeuroCard from "./NeuroCard";

export default function StatCard({ icon: Icon, title, value, subtitle, color = "#666" }) {
  return (
    <NeuroCard>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium mb-2" style={{ color: "#999" }}>
            {title}
          </p>
          <p className="text-3xl font-bold mb-1" style={{ color }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs" style={{ color: "#aaa" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="neuro-inset p-3 rounded-xl">
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </NeuroCard>
  );
}