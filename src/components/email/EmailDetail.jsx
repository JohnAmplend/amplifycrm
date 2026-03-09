import React from "react";
import { format } from "date-fns";
import { X, User } from "lucide-react";

function parseEmailName(raw) {
  if (!raw) return { name: "", email: "" };
  const match = raw.match(/^(.*?)\s*<(.+?)>$/);
  if (match) return { name: match[1].replace(/"/g, "").trim(), email: match[2].trim() };
  return { name: raw.trim(), email: raw.trim() };
}

export default function EmailDetail({ message, onClose }) {
  if (!message) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gray-100">
            <User className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm">Select an email to read</p>
        </div>
      </div>
    );
  }

  const { name: fromName, email: fromEmail } = parseEmailName(message.from_email);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-start justify-between gap-4" style={{ borderColor: "rgba(30,58,138,0.1)" }}>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate" style={{ color: "#1E3A8A" }}>
            {message.subject || "(no subject)"}
          </h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)'
            }}>
              {(fromName || fromEmail || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "#333" }}>{fromName || fromEmail}</p>
              {fromName && <p className="text-xs" style={{ color: "#888" }}>{fromEmail}</p>}
            </div>
          </div>
          {message.to_emails?.length > 0 && (
            <p className="text-xs mt-1" style={{ color: "#aaa" }}>
              To: {message.to_emails.join(", ")}
            </p>
          )}
          {message.internal_date && (
            <p className="text-xs mt-1" style={{ color: "#aaa" }}>
              {format(new Date(message.internal_date), "PPpp")}
            </p>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="ampvibe-inset p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#444", minHeight: "100px" }}>
          {message.snippet || "(no preview available)"}
          {message.snippet && (
            <p className="text-xs mt-4 italic" style={{ color: "#bbb" }}>
              — Showing preview only. Full email body sync coming soon.
            </p>
          )}
        </div>

        {/* Labels */}
        {message.label_ids?.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {message.label_ids.map(label => (
              <span key={label} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}