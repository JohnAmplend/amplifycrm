import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle, AlertCircle, ArrowLeft, Users, Building2, DollarSign, Ticket, Mail, FileText, Activity, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import StatCard from "../components/crm/StatCard";

export default function HubSpotSync() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [syncResults, setSyncResults] = useState({});

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

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list()
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Email_Campaign.list()
  });

  const { data: forms = [] } = useQuery({
    queryKey: ['forms'],
    queryFn: () => base44.entities.Form.list()
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const hubspotContacts = contacts.filter(c => c.custom_data?.hubspot_id);
  const hubspotCompanies = companies.filter(c => c.custom_data?.hubspot_id);
  const hubspotDeals = deals.filter(d => d.custom_data?.hubspot_id);
  const hubspotTickets = tickets.filter(t => t.custom_data?.hubspot_id);
  const hubspotCampaigns = campaigns.filter(c => c.custom_data?.hubspot_id);
  const hubspotForms = forms.filter(f => f.custom_data?.hubspot_id);
  const hubspotActivities = activities.filter(a => a.custom_data?.hubspot_id);
  const hubspotTasks = tasks.filter(t => t.custom_data?.hubspot_id);

  const createSyncMutation = (functionName, key, queryKeys) => {
    return useMutation({
      mutationFn: async () => {
        const response = await base44.functions.invoke(functionName, {});
        return response.data;
      },
      onSuccess: (data) => {
        setSyncResults(prev => ({ ...prev, [key]: data }));
        queryKeys.forEach(qk => queryClient.invalidateQueries([qk]));
        queryClient.invalidateQueries(['sync_logs']);
      },
      onError: (error) => {
        setSyncResults(prev => ({ ...prev, [key]: {
          success: false,
          error: error.message || `Failed to sync ${key}`
        }}));
      }
    });
  };

  const contactsMutation = createSyncMutation('syncHubSpotContacts', 'contacts', ['contacts']);
  const companiesMutation = createSyncMutation('syncHubSpotCompanies', 'companies', ['companies']);
  const dealsMutation = createSyncMutation('syncHubSpotDeals', 'deals', ['deals']);
  const ticketsMutation = createSyncMutation('syncHubSpotTickets', 'tickets', ['tickets']);
  const campaignsMutation = createSyncMutation('syncHubSpotEmailCampaigns', 'campaigns', ['campaigns']);
  const formsMutation = createSyncMutation('syncHubSpotForms', 'forms', ['forms']);
  const engagementsMutation = createSyncMutation('syncHubSpotEngagements', 'engagements', ['activities']);
  const tasksMutation = createSyncMutation('syncHubSpotTasks', 'tasks', ['tasks']);

  const allMutations = [contactsMutation, companiesMutation, dealsMutation, ticketsMutation, campaignsMutation, formsMutation, engagementsMutation, tasksMutation];
  const isAnySyncing = allMutations.some(m => m.isPending);

  const handleSyncAll = () => {
    if (window.confirm('This will sync ALL data from HubSpot (Contacts, Companies, Deals, Tickets, Campaigns, Forms, Engagements, Tasks). This may take several minutes. Continue?')) {
      setSyncResults({});
      contactsMutation.mutate();
      companiesMutation.mutate();
      dealsMutation.mutate();
      ticketsMutation.mutate();
      campaignsMutation.mutate();
      formsMutation.mutate();
      engagementsMutation.mutate();
      tasksMutation.mutate();
    }
  };

  const syncItems = [
    { name: 'Contacts', icon: Users, mutation: contactsMutation, current: contacts.length, synced: hubspotContacts.length, color: '#4a90e2', fields: 37 },
    { name: 'Companies', icon: Building2, mutation: companiesMutation, current: companies.length, synced: hubspotCompanies.length, color: '#52c41a', fields: 13 },
    { name: 'Deals', icon: DollarSign, mutation: dealsMutation, current: deals.length, synced: hubspotDeals.length, color: '#fa8c16', fields: 10 },
    { name: 'Tickets', icon: Ticket, mutation: ticketsMutation, current: tickets.length, synced: hubspotTickets.length, color: '#eb2f96', fields: 11 },
    { name: 'Email Campaigns', icon: Mail, mutation: campaignsMutation, current: campaigns.length, synced: hubspotCampaigns.length, color: '#722ed1', fields: 15 },
    { name: 'Forms', icon: FileText, mutation: formsMutation, current: forms.length, synced: hubspotForms.length, color: '#13c2c2', fields: 8 },
    { name: 'Engagements', icon: Activity, mutation: engagementsMutation, current: activities.length, synced: hubspotActivities.length, color: '#faad14', fields: 8 },
    { name: 'Tasks', icon: CheckSquare, mutation: tasksMutation, current: tasks.length, synced: hubspotTasks.length, color: '#52c41a', fields: 7 }
  ];

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
                    {result.summary.total_hubspot_contacts || result.summary.total_hubspot_companies || result.summary.total_hubspot_deals || result.summary.total_hubspot_tickets || result.summary.total_hubspot_campaigns || result.summary.total_hubspot_forms || result.summary.total_hubspot_engagements || result.summary.total_hubspot_tasks || 0}
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

            {result.error && (
              <p className="text-sm" style={{ color: "#f5222d" }}>{result.error}</p>
            )}
          </div>
        </div>
      </NeuroCard>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeuroButton onClick={() => navigate(createPageUrl("SyncStatus"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                HubSpot Complete Sync
              </h1>
              <p style={{ color: "#888" }}>
                Sync all contacts, companies, deals, tickets, campaigns, forms, activities & tasks
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {syncItems.map(item => (
            <StatCard
              key={item.name}
              icon={item.icon}
              title={item.name}
              value={item.current}
              subtitle={`${item.synced} from HubSpot`}
              color={item.color}
            />
          ))}
        </div>

        {/* Sync All Button */}
        <NeuroCard className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold mb-1" style={{ color: "#666" }}>
                Ready to Sync Everything?
              </h3>
              <p className="text-sm" style={{ color: "#888" }}>
                This will sync all 8 object types with full pagination (109 fields total)
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
                  Sync All (8 Types)
                </>
              )}
            </NeuroButton>
          </div>
        </NeuroCard>

        {/* Individual Sync Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {syncItems.map(item => (
            <NeuroCard key={item.name}>
              <div className="text-center">
                <item.icon className="w-8 h-8 mx-auto mb-3" style={{ color: item.color }} />
                <h3 className="font-bold mb-2" style={{ color: "#666" }}>{item.name}</h3>
                <p className="text-sm mb-4" style={{ color: "#888" }}>{item.fields} fields</p>
                <NeuroButton 
                  onClick={() => {
                    setSyncResults(prev => ({ ...prev, [item.name.toLowerCase()]: null }));
                    item.mutation.mutate();
                  }}
                  disabled={item.mutation.isPending}
                  className="w-full"
                >
                  {item.mutation.isPending ? 'Syncing...' : 'Sync'}
                </NeuroButton>
              </div>
            </NeuroCard>
          ))}
        </div>

        {/* Sync Results */}
        {Object.entries(syncResults).map(([key, result]) => 
          renderSyncResult(result, key.charAt(0).toUpperCase() + key.slice(1) + ' Sync')
        )}
      </div>
    </div>
  );
}