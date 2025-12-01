import React from "react";
import { X, Keyboard } from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function KeyboardShortcutsHelp({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl/Cmd + A', action: 'Select all visible items' },
    { key: 'Delete/Backspace', action: 'Delete selected items' },
    { key: 'Escape', action: 'Clear selection' },
    { key: 'Ctrl/Cmd + Z', action: 'Undo last operation' },
    { key: 'Shift + Click', action: 'Select range of items' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="ampvibe-card max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="ampvibe-inset p-2 rounded-lg">
                <Keyboard className="w-5 h-5" style={{ color: "#00A86B" }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                Keyboard Shortcuts
              </h2>
            </div>
            <button onClick={onClose} className="ampvibe-button p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div 
                key={index}
                className="flex items-center justify-between ampvibe-inset p-3 rounded-lg"
              >
                <span style={{ color: "#888" }}>{shortcut.action}</span>
                <kbd 
                  className="ampvibe-button px-3 py-1 text-sm font-mono"
                  style={{ 
                    background: 'rgba(0, 168, 107, 0.1)',
                    color: '#00A86B'
                  }}
                >
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <NeuroButton variant="primary" onClick={onClose}>
            Got it
          </NeuroButton>
        </div>
      </div>
    </div>
  );
}