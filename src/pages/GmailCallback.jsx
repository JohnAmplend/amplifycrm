import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function GmailCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");

      if (errorParam) {
        setError("Gmail authorization was denied.");
        setStatus("error");
        if (window.opener) {
          window.opener.postMessage({ type: "GMAIL_AUTH_ERROR", error: errorParam }, "*");
          setTimeout(() => window.close(), 2000);
        }
        return;
      }

      if (!code) {
        setError("No authorization code received.");
        setStatus("error");
        return;
      }

      try {
        console.log("[GmailCallback] Starting OAuth exchange...");
        const currentUser = await base44.auth.me();
        console.log("[GmailCallback] Current user:", currentUser?.id, currentUser?.email);

        const redirectUri = "https://crm.amplend.net/gmailcallback";
        const GOOGLE_CLIENT_ID = "1098736480238-46d7qllnh6ttgv4rdvrtelrt1qasdlde.apps.googleusercontent.com";
        const GOOGLE_CLIENT_SECRET = "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";

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });
        const tokens = await tokenRes.json();
        console.log("[GmailCallback] Token response:", tokens.error || "OK", "has_refresh:", !!tokens.refresh_token);
        if (tokens.error) throw new Error(`Token exchange failed: ${tokens.error} - ${tokens.error_description}`);

        const profileRes = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const profile = await profileRes.json();
        console.log("[GmailCallback] Profile email:", profile.email);
        if (!profile.email) throw new Error("Failed to get Gmail profile");

        const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        const connectionData = {
          user_id: currentUser.id,
          user_email: currentUser.email,
          gmail_address: profile.email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: expiry,
          is_active: true,
          sync_status: "active",
          total_messages_synced: 0,
        };

        const existing = await base44.entities.GmailAccount.filter({ user_id: currentUser.id });
        console.log("[GmailCallback] Existing connections:", existing.length);
        if (existing.length > 0) {
          const updated = { ...connectionData };
          if (!tokens.refresh_token) updated.refresh_token = existing[0].refresh_token;
          await base44.entities.GmailAccount.update(existing[0].id, updated);
          console.log("[GmailCallback] Updated existing connection");
        } else {
          await base44.entities.GmailAccount.create(connectionData);
          console.log("[GmailCallback] Created new connection");
        }

        setStatus("success");
        if (window.opener) {
          window.opener.postMessage({ type: "GMAIL_AUTH_SUCCESS" }, "*");
          setTimeout(() => window.close(), 1500);
        } else {
          setTimeout(() => navigate(createPageUrl("EmailInbox")), 2000);
        }
      } catch (err) {
        console.error("[GmailCallback] Error:", err.message, err);
        setError(err.message);
        setStatus("error");
        if (window.opener) {
          window.opener.postMessage({ type: "GMAIL_AUTH_ERROR", error: err.message }, "*");
          setTimeout(() => window.close(), 3000);
        }
      }
    };
    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        {status === "processing" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting your Gmail account...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-800 font-medium">Gmail connected successfully!</p>
            <p className="text-gray-500 text-sm mt-1">Closing window...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">Connection failed</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}