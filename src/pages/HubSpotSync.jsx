import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { RefreshCw, CheckCircle, AlertCircle, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function HubSpotSync() {
  const navigate = useNavigate();
  const [syncResult, setSyncResult] = useState(null);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncHubSpotContacts', {});
      return response.data;
    },
    onSuccess: (data) => {
      setSyncResult(data);
    },
    onError: (error) => {
      setSyncResult({
        success: false,
        error: error.message || 'Failed to sync contacts'
      });
    }
  });

  const handleSync = () => {
    if (window.confirm('This will sync contacts from HubSpot to AmplifyCRM. Existing contacts will be updated. Continue?')) {
      setSyncResult(null);
      syncMutation.mutate();
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeuroButton onClick={() => navigate(createPageUrl("AppSync"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                HubSpot Contact Sync
              </h1>
              <p style={{ color: "#888" }}>
                Sync contacts from HubSpot to AmplifyCRM
              </p>
            </div>
          </div>
        </div>

        {/* Sync Info */}
        <NeuroCard className="mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            How it Works
          </h2>
          <div className="space-y-3" style={{ color: "#888" }}>
            <p>✅ Fetches up to 100 contacts from HubSpot</p>
            <p>✅ Syncs 37+ fields including marketing, sales, and engagement data</p>
            <p>✅ Creates new contacts or updates existing ones</p>
            <p>✅ Matches contacts by email or HubSpot ID</p>
            <p>✅ Preserves HubSpot IDs for future syncs</p>
          </div>
        </NeuroCard>

        {/* Field Categories */}
        <NeuroCard className="mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            Synced Fields (37 Total)
          </h2>
          
          <div className="space-y-4">
            {/* Basic Info */}
            <div>
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>📇 Basic Information (7)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['First Name', 'Last Name', 'Email', 'Phone', 'Mobile', 'Job Title', 'Department'].map(f => (
                  <div key={f} className="ampvibe-inset px-3 py-2 rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span style={{ color: "#666" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>📍 Address (5)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Address', 'City', 'State', 'Zip', 'Country'].map(f => (
                  <div key={f} className="ampvibe-inset px-3 py-2 rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span style={{ color: "#666" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>🌐 Social & Web (4)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['LinkedIn URL', 'Twitter Handle', 'Facebook URL', 'Company Website'].map(f => (
                  <div key={f} className="ampvibe-inset px-3 py-2 rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span style={{ color: "#666" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Marketing & Source */}
            <div>
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>📊 Marketing & Source (5)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Lead Source', 'Original Source', 'Latest Source', 'First Conversion Date', 'Recent Conversion Date'].map(f => (
                  <div key={f} className="ampvibe-inset px-3 py-2 rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span style={{ color: "#666" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement */}
            <div>
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>📧 Engagement (4)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Emails Opened', 'Emails Clicked', 'Last Contacted', 'Next Activity Date'].map(f => (
                  <div key={f} className="ampvibe-inset px-3 py-2 rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span style={{ color: "#666" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Company Info */}
            <div>
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>🏢 Company Info (5)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Industry', 'Number of Employees', 'Annual Revenue', 'Company Domain', 'Time Zone'].map(f => (
                  <div key={f} className="ampvibe-inset px-3 py-2 rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span style={{ color: "#666" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales */}
            <div>
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>💰 Sales (3)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Close Date', 'Deal Amount', 'Deal Stage'].map(f => (
                  <div key={f} className="ampvibe-inset px-3 py-2 rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span style={{ color: "#666" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>🎯 Status (2)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Lifecycle Stage', 'Lead Status'].map(f => (
                  <div key={f} className="ampvibe-inset px-3 py-2 rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span style={{ color: "#666" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </NeuroCard>

        {/* Sync Button */}
        <NeuroCard className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold mb-1" style={{ color: "#666" }}>
                Ready to Sync?
              </h3>
              <p className="text-sm" style={{ color: "#888" }}>
                This will sync up to 100 contacts with 37 fields from HubSpot
              </p>
            </div>
            <NeuroButton 
              variant="primary" 
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </NeuroButton>
          </div>
        </NeuroCard>

        {/* Sync Results */}
        {syncResult && (
          <NeuroCard>
            <div className="flex items-start gap-3">
              {syncResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-3" style={{ color: syncResult.success ? "#00A86B" : "#f5222d" }}>
                  {syncResult.success ? 'Sync Completed!' : 'Sync Failed'}
                </h3>
                
                {syncResult.success && syncResult.summary && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="ampvibe-inset p-4 rounded-lg">
                      <p className="text-sm" style={{ color: "#888" }}>Total HubSpot Contacts</p>
                      <p className="text-2xl font-bold" style={{ color: "#666" }}>
                        {syncResult.summary.total_hubspot_contacts}
                      </p>
                    </div>
                    <div className="ampvibe-inset p-4 rounded-lg">
                      <p className="text-sm" style={{ color: "#888" }}>Fields Synced</p>
                      <p className="text-2xl font-bold text-green-600">
                        {syncResult.summary.fields_synced || 37}
                      </p>
                    </div>
                    <div className="ampvibe-inset p-4 rounded-lg">
                      <p className="text-sm" style={{ color: "#888" }}>Created</p>
                      <p className="text-2xl font-bold text-green-600">
                        {syncResult.summary.created}
                      </p>
                    </div>
                    <div className="ampvibe-inset p-4 rounded-lg">
                      <p className="text-sm" style={{ color: "#888" }}>Updated</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {syncResult.summary.updated}
                      </p>
                    </div>
                    {syncResult.summary.errors > 0 && (
                      <div className="ampvibe-inset p-4 rounded-lg col-span-2">
                        <p className="text-sm" style={{ color: "#888" }}>Errors</p>
                        <p className="text-2xl font-bold text-red-600">
                          {syncResult.summary.errors}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {syncResult.errors && syncResult.errors.length > 0 && (
                  <div className="ampvibe-inset p-4 rounded-lg">
                    <p className="font-bold mb-2" style={{ color: "#666" }}>Errors:</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {syncResult.errors.map((err, idx) => (
                        <div key={idx} className="text-sm" style={{ color: "#888" }}>
                          <strong>{err.contact}:</strong> {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {syncResult.error && (
                  <p style={{ color: "#f5222d" }}>{syncResult.error}</p>
                )}
              </div>
            </div>
          </NeuroCard>
        )}
      </div>
    </div>
  );
}