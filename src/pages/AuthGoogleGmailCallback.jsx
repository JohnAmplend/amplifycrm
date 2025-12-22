import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function AuthGoogleGmailCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          setError(`OAuth error: ${error}`);
          return;
        }

        if (!code || !state) {
          setStatus('error');
          setError('Missing authorization code or state');
          return;
        }

        // Exchange code for tokens
        const response = await base44.functions.invoke('gmail/handleGmailCallback', {
          code: code,
          state: state
        });

        if (response.data?.success) {
          setStatus('success');
          setTimeout(() => {
            navigate(createPageUrl('Email'));
          }, 2000);
        } else {
          setStatus('error');
          setError(response.data?.error || 'Failed to connect Gmail');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message || 'An error occurred during authentication');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="ampvibe-card max-w-md w-full p-8 text-center">
        {status === 'processing' && (
          <>
            <RefreshCw className="w-16 h-16 animate-spin mx-auto mb-4" style={{ color: "#00A86B" }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#666" }}>
              Connecting Gmail...
            </h2>
            <p style={{ color: "#888" }}>
              Please wait while we complete the authentication
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="ampvibe-button-primary w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#666" }}>
              Gmail Connected!
            </h2>
            <p style={{ color: "#888" }}>
              Redirecting to Email page...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="ampvibe-inset w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" style={{ color: "#ff4d4f" }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#666" }}>
              Connection Failed
            </h2>
            <p className="mb-4" style={{ color: "#ff4d4f" }}>
              {error}
            </p>
            <button
              onClick={() => navigate(createPageUrl('Email'))}
              className="ampvibe-button-primary px-6 py-3"
            >
              Back to Email
            </button>
          </>
        )}
      </div>
    </div>
  );
}