import React from "react";
import { Mail } from "lucide-react";

export default function Email() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="ampvibe-card p-12 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)'
          }}>
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: "#1E3A8A" }}>Email Inbox</h1>
          <p className="text-lg font-medium mb-2" style={{ color: "#00A86B" }}>Coming Soon</p>
          <p className="text-sm" style={{ color: "#888" }}>
            The email integration feature is currently being set up. Check back soon!
          </p>
        </div>
      </div>
    </div>
  );
}