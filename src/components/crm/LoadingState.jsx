import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: "#00A86B" }} />
      <p className="text-sm" style={{ color: "#888" }}>{message}</p>
    </div>
  );
}