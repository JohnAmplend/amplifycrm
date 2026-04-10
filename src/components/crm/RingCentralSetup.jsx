import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, ExternalLink, RefreshCw, LogOut, Phone, Info } from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function RingCentralSetup({ user, onConnected }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const loadConfig = async () => {
    if (!user?.email) return;
    setLoading(true);
    const results = await base44.entities.RingCentral_Config.filter({ user_email: user.email }).catch(() => []);
    setConfig(results[0] || null);
    setLoading(false);
  };

  useEffect(() => { loadConfig(); }, [user?.email]);

  const handleConnect = async () => {
    setConnecting(true);

    let authUrl;
    try {
      const res = await base44.functions.invoke("ringcentral/getOAuthUrl", {});
      authUrl = res.data?.auth_url;
      if (!authUrl) throw new Error(res.data?.error || 'No auth URL returned');
    } catch (e) {
      alert('Failed to start OAuth: ' + e.message);
      setConnecting(false);
      return;
    }

    const popup = window.open(authUrl, "rc_oauth", "width=600,height=700,scrollbars=yes");

    const handler = (e) => {
      if (e.data?.type === "RC_AUTH_SUCCESS") {
        window.removeEventListener("message", handler);
        setConnecting(false);
        loadConfig();
        onConnected?.();
      } else if (e.data?.type === "RC_AUTH_ERROR") {
        window.removeEventListener("message", handler);
        setConnecting(false);
      }
    };
    window.addEventListener("message", handler);

    // Fallback: poll for popup close
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setConnecting(false);
        window.removeEventListener("message", handler);
        loadConfig();
      }
    }, 1000);
  };

  const handleDisconnect = async () => {
    if (!config?.id) return;
    await base44.entities.RingCentral_Config.update(config.id, { is_connected: false, access_token: "", refresh_token: "" });
    setConfig(c => ({ ...c, is_connected: false }));
  };

  if (loading) {
    return <div className="text-center py-6" style={{ color: "#aaa" }}>Loading...</div>;
  }

  if (config?.is_connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-green-800">Connected to RingCentral</p>
            {config.display_name && <p className="text-xs text-green-700">{config.display_name}</p>}
            {config.extension_number && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" /> {config.extension_number}
              </p>
            )}
            {config.last_synced_at && (
              <p className="text-xs text-green-600 mt-0.5">Last synced: {new Date(config.last_synced_at).toLocaleString()}</p>
            )}
          </div>
          <NeuroButton onClick={handleDisconnect}>
            <LogOut className="w-4 h-4 mr-1" /> Disconnect
          </NeuroButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
        <XCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
        <p className="text-sm font-medium text-yellow-800">Not connected — click below to connect your RingCentral account</p>
      </div>

      <div className="p-4 rounded-xl border-l-4 text-sm" style={{ background: "rgba(74,144,226,0.05)", borderColor: "#4a90e2" }}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
          <div style={{ color: "#555" }}>
            <p className="font-semibold mb-1">Setup steps:</p>
            <ol className="list-decimal ml-4 space-y-1 text-xs" style={{ color: "#666" }}>
              <li>In your <a href="https://developers.ringcentral.com" target="_blank" rel="noreferrer" className="underline text-blue-500">RingCentral Developer Console</a>, add this redirect URI to your app:</li>
              <li><code className="bg-gray-100 px-1 rounded text-xs">{window.location.origin}/RingCentralOAuthCallback</code></li>
              <li>Ensure your app has scopes: ReadAccounts, ReadCallLog, Calls, SMS, Messaging</li>
              <li>Click "Connect RingCentral" below</li>
            </ol>
          </div>
        </div>
      </div>

      <NeuroButton variant="primary" onClick={handleConnect} disabled={connecting}>
        {connecting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
        {connecting ? "Connecting..." : "Connect RingCentral"}
      </NeuroButton>
    </div>
  );
}