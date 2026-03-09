import React from "react";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function parseEmailName(raw) {
  if (!raw) return { name: "", email: "" };
  const match = raw.match(/^(.*?)\s*<(.+?)>$/);
  if (match) return { name: match[1].replace(/"/g, "").trim(), email: match[2].trim() };
  return { name: raw.trim(), email: raw.trim() };
}

function getLabelStyle(label) {
  if (label === "INBOX") return "bg-blue-100 text-blue-700";
  if (label === "SENT") return "bg-green-100 text-green-700";
  if (label === "UNREAD") return "bg-yellow-100 text-yellow-700";
  if (label === "IMPORTANT") return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-600";
}

export default function EmailList({ messages, selectedId, onSelect, onSync, syncing, filter, onFilterChange }) {
  const filtered = messages.filter(msg => {
    if (filter === "inbox") return msg.label_ids?.includes("INBOX");
    if (filter === "sent") return msg.label_ids?.includes("SENT");
    if (filter === "unread") return msg.label_ids?.includes("UNREAD");
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(30,58,138,0.1)" }}>
        <div className="flex gap-1">
          {["all", "inbox", "sent", "unread"].map(f => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={onSync} disabled={syncing} className="gap-1 text-xs">
          {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Sync
        </Button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No messages found</div>
        ) : (
          filtered.map(msg => {
            const { name, email } = parseEmailName(msg.from_email);
            const isSelected = msg.id === selectedId;
            const isUnread = msg.label_ids?.includes("UNREAD");
            return (
              <div
                key={msg.id}
                onClick={() => onSelect(msg)}
                className={`px-4 py-3 cursor-pointer border-b transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'} ${isUnread ? 'font-semibold' : ''}`}
                style={{ borderBottomColor: "rgba(30,58,138,0.08)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: isUnread ? "#1E3A8A" : "#333" }}>
                      {name || email}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "#555" }}>
                      {msg.subject || "(no subject)"}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "#999" }}>
                      {msg.snippet}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs" style={{ color: "#aaa" }}>
                      {msg.internal_date ? formatDistanceToNow(new Date(msg.internal_date), { addSuffix: true }) : ""}
                    </span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {msg.label_ids?.filter(l => ["INBOX","SENT","UNREAD","IMPORTANT"].includes(l)).slice(0, 2).map(label => (
                        <span key={label} className={`text-xs px-1.5 py-0.5 rounded ${getLabelStyle(label)}`}>
                          {label.charAt(0) + label.slice(1).toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}