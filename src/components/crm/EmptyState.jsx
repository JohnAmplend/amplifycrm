import React from "react";
import { Inbox } from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function EmptyState({ 
  icon: Icon = Inbox,
  title = "No items yet",
  message = "Get started by creating your first item",
  actionLabel,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="ampvibe-inset w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" style={{ color: "#00A86B" }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "#666" }}>
        {title}
      </h3>
      <p className="text-sm mb-6" style={{ color: "#888" }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <NeuroButton variant="primary" onClick={onAction}>
          {actionLabel}
        </NeuroButton>
      )}
    </div>
  );
}