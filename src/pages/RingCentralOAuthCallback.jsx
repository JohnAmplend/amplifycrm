import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function RingCentralOAuthCallback() {
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Connecting your RingCentral account...");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(urlParams.get("error_description") || "Authorization was denied.");
      if (window.opener) window.opener.postMessage({ type: "RC_AUTH_ERROR", error: message }, "*");
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received.");
      return;
    }

    const redirectUri = window.location.origin + "/RingCentralOAuthCallback";

    base44.functions.invoke("ringcentral/oauthCallback", { code, redirect_uri: redirectUri })
      .then(res => {
        if (res.data?.success) {
          setStatus("success");
          setMessage(`Connected as ${res.data.display_name || "your account"}${res.data.extension_number ? ` (${res.data.extension_number})` : ""}`);
          if (window.opener) {
            window.opener.postMessage({ type: "RC_AUTH_SUCCESS" }, "*");
            setTimeout(() => window.close(), 1500);
          }
        } else {
          setStatus("error");
          setMessage(res.data?.error || "Connection failed");
          if (window.opener) window.opener.postMessage({ type: "RC_AUTH_ERROR" }, "*");
        }
      })
      .catch(err => {
        setStatus("error");
        setMessage(err.message);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F5F7FA 0%, #E6F0FA 100%)" }}>
      <div className="ampvibe-card p-10 text-center max-w-sm w-full">
        {status === "processing" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: "#4a90e2" }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: "#444" }}>Connecting...</h2>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "#52c41a" }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: "#166534" }}>Connected!</h2>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "#ef4444" }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: "#991b1b" }}>Connection Failed</h2>
          </>
        )}
        <p className="text-sm" style={{ color: "#666" }}>{message}</p>
        {status !== "processing" && !window.opener && (
          <button className="ampvibe-button-primary mt-4 px-6 py-2" onClick={() => window.location.href = "/RingCentral"}>
            Go to RingCentral
          </button>
        )}
      </div>
    </div>
  );
}