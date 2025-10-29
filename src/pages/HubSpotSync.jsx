import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
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
            <p>✅ Maps HubSpot fields to AmplifyCRM fields</p>
            <p>✅ Creates new contacts or updates existing ones</p>
            <p>✅ Matches contacts by email or HubSpot ID</p>
            <p>✅ Preserves HubSpot IDs for future syncs</p>
          </div>
        </NeuroCard>

        {/* Field Mapping */}
        <NeuroCard className="mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            Field Mapping
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                  <th className="text-left py-2 px-3 font-semibold" style={{ color: "#666" }}>HubSpot Field</th>
                  <th className="text-left py-2 px-3 font-semibold" style={{ color: "#666" }}>AmplifyCRM Field</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['firstname', 'first_name'],
                  ['lastname', 'last_name'],
                  ['email', 'email'],
                  ['phone', 'phone'],
                  ['mobilephone', 'mobile'],
                  ['jobtitle', 'job_title'],
                  ['company', 'custom_data.hubspot_company_name'],
                  ['lifecyclestage', 'lifecycle_stage'],
                  ['hs_lead_status', 'lead_status'],
                  ['address', 'address'],
                  ['city', 'city'],
                  ['state', 'state'],
                  ['zip', 'zip'],
                  ['country', 'country'],
                  ['linkedinbio', 'linkedin_url'],
                  ['twitterhandle', 'twitter_handle'],
                  ['hs_object_id', 'custom_data.hubspot_id']
                ].map(([hsField, b44Field]) => (
                  <tr key={hsField} className="border-b" style={{ borderColor: "#e0e0e0" }}>
                    <td className="py-2 px-3" style={{ color: "#888" }}>{hsField}</td>
                    <td className="py-2 px-3" style={{ color: "#666" }}>{b44Field}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                This will sync contacts from HubSpot to AmplifyCRM
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
                    <div className="ampvibe-inset p-4 rounded-lg">
                      <p className="text-sm" style={{ color: "#888" }}>Errors</p>
                      <p className="text-2xl font-bold text-red-600">
                        {syncResult.summary.errors}
                      </p>
                    </div>
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

        {/* Missing Fields Notice */}
        <NeuroCard className="mt-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            📋 Recommended Fields to Add
          </h2>
          <p className="mb-4" style={{ color: "#888" }}>
            HubSpot has many fields that aren't currently mapped. Consider adding these to your Contact entity:
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              'Industry',
              'Number of Employees',
              'Annual Revenue',
              'Time Zone',
              'Facebook URL',
              'Company Website',
              'Lead Source',
              'Original Source',
              'Latest Source',
              'First Conversion Date',
              'Recent Conversion Date',
              'Marketing Emails Opened',
              'Marketing Emails Clicked',
              'Last Contacted',
              'Last Activity Date',
              'Next Activity Date',
              'Number of Employees (Company)',
              'Company Domain',
              'Close Date',
              'Deal Amount',
              'Deal Stage'
            ].map((field) => (
              <div key={field} className="ampvibe-inset px-3 py-2 rounded" style={{ color: "#666" }}>
                • {field}
              </div>
            ))}
          </div>
        </NeuroCard>
      </div>
    </div>
  );
}