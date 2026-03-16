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

        // Route token exchange through secure backend function
        const result = await base44.functions.invoke('handleGmailCallback', { code, state: params.get("state") });
        if (!result.data?.success) throw new Error(result.data?.error || "Gmail callback failed");

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