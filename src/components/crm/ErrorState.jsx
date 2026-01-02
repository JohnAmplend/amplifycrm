import React from "react";
import { AlertCircle } from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function ErrorState({ 
  message = "Something went wrong",
  onRetry
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="ampvibe-inset w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "#666" }}>
        Error
      </h3>
      <p className="text-sm mb-6" style={{ color: "#888" }}>
        {message}
      </p>
      {onRetry && (
        <NeuroButton onClick={onRetry}>
          Try Again
        </NeuroButton>
      )}
    </div>
  );
}