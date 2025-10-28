import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Key, Copy, CheckCircle, Eye, EyeOff } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";

export default function APISettings() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // Load existing API key (this would be stored securely)
    const stored = localStorage.getItem('crm_api_key');
    if (stored) {
      setApiKey(stored);
    }
  }, []);

  const generateApiKey = () => {
    setGenerating(true);
    // Generate a random API key
    const newKey = 'sk_' + Array.from({length: 32}, () => 
      Math.random().toString(36)[2] || '0'
    ).join('');
    
    setTimeout(() => {
      setApiKey(newKey);
      localStorage.setItem('crm_api_key', newKey);
      setGenerating(false);
    }, 500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
            API Settings
          </h1>
          <p style={{ color: "#888" }}>Manage API keys and endpoint access</p>
        </div>

        {/* API Key Management */}
        <NeuroCard className="mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            API Key
          </h2>
          <p className="mb-4" style={{ color: "#888" }}>
            Use this API key to authenticate requests to your CRM's API endpoints
          </p>

          {apiKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="neuro-inset flex-1 p-4 rounded-lg flex items-center gap-3">
                  <Key className="w-5 h-5" style={{ color: "#666" }} />
                  <code className="flex-1 font-mono text-sm" style={{ color: "#666" }}>
                    {showKey ? apiKey : '•'.repeat(40)}
                  </code>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="neuro-button p-2"
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4" style={{ color: "#888" }} />
                    ) : (
                      <Eye className="w-4 h-4" style={{ color: "#888" }} />
                    )}
                  </button>
                </div>
                <NeuroButton onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </NeuroButton>
              </div>

              <div className="neuro-inset p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2" style={{ color: "#666" }}>
                  ⚠️ Security Notice:
                </p>
                <ul className="text-sm space-y-1" style={{ color: "#888" }}>
                  <li>• Keep this API key secret and secure</li>
                  <li>• Do not share it publicly or commit it to version control</li>
                  <li>• Regenerate immediately if compromised</li>
                </ul>
              </div>

              <NeuroButton variant="danger" onClick={generateApiKey} disabled={generating}>
                {generating ? 'Generating...' : 'Regenerate API Key'}
              </NeuroButton>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="mb-4" style={{ color: "#aaa" }}>
                No API key generated yet
              </p>
              <NeuroButton variant="primary" onClick={generateApiKey} disabled={generating}>
                <Key className="w-4 h-4 mr-2" />
                {generating ? 'Generating...' : 'Generate API Key'}
              </NeuroButton>
            </div>
          )}
        </NeuroCard>

        {/* API Endpoints */}
        <NeuroCard>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            Available Endpoints
          </h2>
          <p className="mb-6" style={{ color: "#888" }}>
            Use these endpoints with your API key in the Authorization header
          </p>

          <div className="space-y-4">
            {[
              { method: 'GET', path: '/api/contacts', desc: 'List all contacts' },
              { method: 'POST', path: '/api/contacts', desc: 'Create or update contact' },
              { method: 'GET', path: '/api/companies', desc: 'List all companies' },
              { method: 'POST', path: '/api/companies', desc: 'Create or update company' },
              { method: 'GET', path: '/api/deals', desc: 'List all deals' },
              { method: 'POST', path: '/api/deals', desc: 'Create or update deal' },
              { method: 'GET', path: '/api/leads', desc: 'List all leads' },
              { method: 'POST', path: '/api/leads', desc: 'Create or update lead' }
            ].map((endpoint, index) => (
              <div key={index} className="neuro-inset p-4 rounded-lg">
                <div className="flex items-start gap-4">
                  <span className={`neuro-button px-3 py-1 text-xs font-mono ${
                    endpoint.method === 'GET' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {endpoint.method}
                  </span>
                  <div className="flex-1">
                    <code className="text-sm font-mono" style={{ color: "#666" }}>
                      {endpoint.path}
                    </code>
                    <p className="text-sm mt-1" style={{ color: "#888" }}>
                      {endpoint.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="neuro-inset p-4 rounded-lg mt-6">
            <p className="text-sm font-semibold mb-2" style={{ color: "#666" }}>
              Example Request:
            </p>
            <pre className="text-xs font-mono p-3 rounded" style={{ 
              color: "#666",
              background: "#d8d8d8"
            }}>
{`curl -X GET https://your-app.base44.com/api/contacts \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>
        </NeuroCard>
      </div>
    </div>
  );
}