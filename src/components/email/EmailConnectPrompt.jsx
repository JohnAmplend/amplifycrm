import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailConnectPrompt() {
  const [connecting, setConnecting] = useState(false);

  const connectGmail = async () => {
    setConnecting(true);
    try {
      const response = await base44.functions.invoke('gmail/getGmailAuthUrl');
      if (response.data?.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      setConnecting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="ampvibe-card p-12 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)'
        }}>
          <Mail className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: "#1E3A8A" }}>Connect Your Gmail</h2>
        <p className="text-sm mb-8" style={{ color: "#888" }}>
          Connect your Gmail account to view and manage your emails directly in AmplifyCRM.
        </p>
        <Button
          onClick={connectGmail}
          disabled={connecting}
          className="w-full py-3 text-base"
          style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)', color: 'white', border: 'none' }}
        >
          {connecting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>
          ) : (
            <><Mail className="w-4 h-4 mr-2" />Connect Gmail</>
          )}
        </Button>
      </div>
    </div>
  );
}