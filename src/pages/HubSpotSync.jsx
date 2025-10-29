import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle, AlertCircle, ArrowLeft, Check, Users, Building2, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import StatCard from "../components/crm/StatCard";

export default function HubSpotSync() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [contactsSyncResult, setContactsSyncResult] = useState(null);
  const [companiesSyncResult, setCompaniesSyncResult] = useState(null);
  const [dealsSyncResult, setDealsSyncResult] = useState(null);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list()
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ['sync_logs'],
    queryFn: () => base44.entities.Sync_Log.list('-created_date', 10)
  });

  const hubspotContacts = contacts.filter(c => c.custom_data?.hubspot_id);
  const hubspotCompanies = companies.filter(c => c.custom_data?.hubspot_id);
  const hubspotDeals = deals.filter(d => d.custom_data?.hubspot_id);

  const contactsSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncHubSpotContacts', {});
      return response.data;
    },
    onSuccess: (data) => {
      setContactsSyncResult(data);
      queryClient.invalidateQueries(['contacts']);
      queryClient.invalidateQueries(['sync_logs']);
    },
    onError: (error) => {
      setContactsSyncResult({
        success: false,
        error: error.message || 'Failed to sync contacts'
      });
    }
  });

  const companiesSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncHubSpotCompanies', {});
      return response.data;
    },
    onSuccess: (data) => {
      setCompaniesSyncResult(data);
      queryClient.invalidateQueries(['companies']);
      queryClient.invalidateQueries(['sync_logs']);
    },
    onError: (error) => {
      setCompaniesSyncResult({
        success: false,
        error: error.message || 'Failed to sync companies'
      });
    }
  });

  const dealsSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncHubSpotDeals', {});
      return response.data;
    },
    onSuccess: (data) => {
      setDealsSyncResult(data);
      queryClient.invalidateQueries(['deals']);
      queryClient.invalidateQueries(['sync_logs']);
    },
    onError: (error) => {
      setDealsSyncResult({
        success: false,
        error: error.message || 'Failed to sync deals'
      });
    }
  });

  const handleSyncAll = () => {
    if (window.confirm('This will sync ALL contacts, companies, and deals from HubSpot. This may take a few minutes. Continue?')) {
      setContactsSyncResult(null);
      setCompaniesSyncResult(null);
      setDealsSyncResult(null);
      
      contactsSyncMutation.mutate();
      companiesSyncMutation.mutate();
      dealsSyncMutation.mutate();
    }
  };

  const renderSyncResult = (result, title) => {
    if (!result) return null;

    return (
      <NeuroCard className="mb-6">
        <div className="flex items-start gap-3">
          {result.success ? (
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          )}
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-3" style={{ color: result.success ? "#00A86B" : "#f5222d" }}>
              {title} - {result.success ? 'Completed!' : 'Failed'}
            </h3>
            
            {result.success && result.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="ampvibe-inset p-3 rounded-lg">
                  <p className="text-xs" style={{ color: "#888" }}>Total</p>
                  <p className="text-xl font-bold" style={{ color: "#666" }}>
                    {result.summary.total_hubspot_contacts || result.summary.total_hubspot_companies || result.summary.total_hubspot_deals || 0}
                  </p>
                </div>
                <div className="ampvibe-inset p-3 rounded-lg">
                  <p className="text-xs" style={{ color: "#888" }}>Created</p>
                  <p className="text-xl font-bold text-green-600">
                    {result.summary.created}
                  </p>
                </div>
                <div className="ampvibe-inset p-3 rounded-lg">
                  <p className="text-xs" style={{ color: "#888" }}>Updated</p>
                  <p className="text-xl font-bold text-blue-600">
                    {result.summary.updated}
                  </p>
                </div>
                <div className="ampvibe-inset p-3 rounded-lg">
                  <p className="text-xs" style={{ color: "#888" }}>Errors</p>
                  <p className="text-xl font-bold text-red-600">
                    {result.summary.errors}
                  </p>
                </div>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="ampvibe-inset p-3 rounded-lg mt-3">
                <p className="font-bold mb-2 text-sm" style={{ color: "#666" }}>Errors:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.slice(0, 5).map((err, idx) => (
                    <div key={idx} className="text-xs" style={{ color: "#888" }}>
                      <strong>{err.contact || err.company || err.deal}:</strong> {err.error}
                    </div>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-xs" style={{ color: "#888" }}>+ {result.errors.length - 5} more errors</p>
                  )}
                </div>
              </div>
            )}

            {result.error && (
              <p className="text-sm" style={{ color: "#f5222d" }}>{result.error}</p>
            )}
          </div>
        </div>
      </NeuroCard>
    );
  };

  const isAnySyncing = contactsSyncMutation.isPending || companiesSyncMutation.isPending || dealsSyncMutation.isPending;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeuroButton onClick={() => navigate(createPageUrl("SyncStatus"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                HubSpot Full Sync
              </h1>
              <p style={{ color: "#888" }}>
                Sync all contacts, companies, and deals from HubSpot
              </p>
            </div>
          </div>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            icon={Users}
            title="Contacts"
            value={contacts.length}
            subtitle={`${hubspotContacts.length} from HubSpot`}
            color="#4a90e2"
          />
          <StatCard
            icon={Building2}
            title="Companies"
            value={companies.length}
            subtitle={`${hubspotCompanies.length} from HubSpot`}
            color="#52c41a"
          />
          <StatCard
            icon={DollarSign}
            title="Deals"
            value={deals.length}
            subtitle={`${hubspotDeals.length} from HubSpot`}
            color="#fa8c16"
          />
        </div>

        {/* Sync All Button */}
        <NeuroCard className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold mb-1" style={{ color: "#666" }}>
                Ready to Sync Everything?
              </h3>
              <p className="text-sm" style={{ color: "#888" }}>
                This will sync all your contacts (37 fields), companies (13 fields), and deals (10 fields) from HubSpot with full pagination
              </p>
            </div>
            <NeuroButton 
              variant="primary" 
              onClick={handleSyncAll}
              disabled={isAnySyncing}
            >
              {isAnySyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync All
                </>
              )}
            </NeuroButton>
          </div>
        </NeuroCard>

        {/* Individual Sync Options */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <NeuroCard>
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-3" style={{ color: "#4a90e2" }} />
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>Contacts</h3>
              <p className="text-sm mb-4" style={{ color: "#888" }}>37 fields with pagination</p>
              <NeuroButton 
                onClick={() => {
                  setContactsSyncResult(null);
                  contactsSyncMutation.mutate();
                }}
                disabled={contactsSyncMutation.isPending}
                className="w-full"
              >
                {contactsSyncMutation.isPending ? 'Syncing...' : 'Sync Contacts'}
              </NeuroButton>
            </div>
          </NeuroCard>

          <NeuroCard>
            <div className="text-center">
              <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: "#52c41a" }} />
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>Companies</h3>
              <p className="text-sm mb-4" style={{ color: "#888" }}>13 fields with pagination</p>
              <NeuroButton 
                onClick={() => {
                  setCompaniesSyncResult(null);
                  companiesSyncMutation.mutate();
                }}
                disabled={companiesSyncMutation.isPending}
                className="w-full"
              >
                {companiesSyncMutation.isPending ? 'Syncing...' : 'Sync Companies'}
              </NeuroButton>
            </div>
          </NeuroCard>

          <NeuroCard>
            <div className="text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-3" style={{ color: "#fa8c16" }} />
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>Deals</h3>
              <p className="text-sm mb-4" style={{ color: "#888" }}>10 fields with pagination</p>
              <NeuroButton 
                onClick={() => {
                  setDealsSyncResult(null);
                  dealsSyncMutation.mutate();
                }}
                disabled={dealsSyncMutation.isPending}
                className="w-full"
              >
                {dealsSyncMutation.isPending ? 'Syncing...' : 'Sync Deals'}
              </NeuroButton>
            </div>
          </NeuroCard>
        </div>

        {/* Sync Results */}
        {renderSyncResult(contactsSyncResult, 'Contacts Sync')}
        {renderSyncResult(companiesSyncResult, 'Companies Sync')}
        {renderSyncResult(dealsSyncResult, 'Deals Sync')}

        {/* Field Details */}
        <NeuroCard>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            What Gets Synced
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: "#4a90e2" }}>
                <Users className="w-5 h-5" />
                Contacts (37 Fields)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {['Basic Info (7)', 'Address (5)', 'Social Media (4)', 'Marketing Source (5)', 'Engagement (4)', 'Company Info (5)', 'Sales Data (3)', 'Status (2)', '+ HubSpot metadata'].map(f => (
                  <div key={f} className="ampvibe-inset px-3 py-2 rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span style={{ color: "#666" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: "#52c41a" }}>
                <Building2 className="w-5 h-5" />
                Companies (13 Fields)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {['Name', 'Domain', 'Industry', 'Phone', 'Address', 'City', 'State', 'Zip', 'Country', 'Employees', 'Revenue', 'Lifecycle Stage', '+ HubSpot metadata'].map(f => (
                  <div key={f} className="ampvibe-inset px-3 py-2 rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span style={{ color: "#666" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: "#fa8c16" }}>
                <DollarSign className="w-5 h-5" />
                Deals (10 Fields)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {['Deal Name', 'Amount', 'Close Date', 'Stage', 'Pipeline', 'Type', 'Priority', 'Probability', 'Description', '+ HubSpot metadata'].map(f => (
                  <div key={f} className="ampvibe-inset px-3 py-2 rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span style={{ color: "#666" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </NeuroCard>
      </div>
    </div>
  );
}