import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function GoogleOAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Connecting your Google account...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          setMessage('Google authorization was cancelled or failed');
          setError(error);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from Google');
          setError('Missing code parameter');
          return;
        }

        // Call backend to exchange code for tokens
        const response = await base44.functions.invoke('gcal/googleOAuthCallback', {
          code: code
        });

        if (response.data.error) {
          setStatus('error');
          setMessage('We couldn\'t connect your Google account. Please try again.');
          setError(response.data.error);
          return;
        }

        // Success
        setStatus('success');
        setMessage('Your Google Calendar is now connected!');

        // Redirect to CRM Calendar after 2 seconds
        setTimeout(() => {
          navigate(createPageUrl('CRMCalendar'));
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('We couldn\'t connect your Google account. Please try again.');
        setError(error.message || error.toString());
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ 
      background: 'linear-gradient(135deg, #F5F7FA 0%, #E6F0FA 100%)'
    }}>
      <NeuroCard className="max-w-md w-full p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" style={{ color: "#00A86B" }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#666" }}>
                Connecting...
              </h2>
              <p style={{ color: "#888" }}>{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#00A86B" }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#666" }}>
                Success!
              </h2>
              <p className="mb-4" style={{ color: "#888" }}>{message}</p>
              <p className="text-sm" style={{ color: "#aaa" }}>
                Redirecting you to the calendar...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#ef4444" }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#666" }}>
                Connection Failed
              </h2>
              <p className="mb-4" style={{ color: "#888" }}>{message}</p>
              
              {error && (
                <div className="ampvibe-inset p-3 rounded-lg mb-4 text-left">
                  <p className="text-sm font-medium mb-1" style={{ color: "#666" }}>
                    Error Details:
                  </p>
                  <p className="text-xs" style={{ color: "#aaa" }}>{error}</p>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <NeuroButton onClick={() => navigate(createPageUrl('CRMCalendar'))}>
                  Go to Calendar
                </NeuroButton>
                <NeuroButton onClick={() => navigate(createPageUrl('UserProfile'))}>
                  Go to Settings
                </NeuroButton>
              </div>
            </>
          )}
        </div>
      </NeuroCard>
    </div>
  );
}