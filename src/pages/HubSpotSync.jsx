import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle, AlertCircle, ArrowLeft, Users, Building2, DollarSign, Ticket, Mail, FileText, Activity, CheckSquare, Eye, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";
import StatCard from "../components/crm/StatCard";

export default function HubSpotSync() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [syncResults, setSyncResults] = useState({});
  const [hubspotCounts, setHubspotCounts] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [customPage, setCustomPage] = useState('');

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

  // Load HubSpot counts on mount
  useEffect(() => {
    loadHubSpotCounts();
  }, []);

  const loadHubSpotCounts = async () => {
    setLoadingCounts(true);
    try {
      const response = await base44.functions.invoke('getHubSpotCounts', {});
      if (response.data.success) {
        setHubspotCounts(response.data.counts);
      }
    } catch (error) {
      console.error('Failed to load HubSpot counts:', error);
    } finally {
      setLoadingCounts(false);
    }
  };

  const makeMutationConfig = (functionName, key, queryKeys) => ({
    mutationFn: async () => {
      const response = await base44.functions.invoke(functionName, {});
      return response.data;
    },
    onSuccess: (data) => {
      setSyncResults(prev => ({ ...prev, [key]: data }));
      queryKeys.forEach(qk => queryClient.invalidateQueries([qk]));
      queryClient.invalidateQueries(['sync_logs']);
      loadHubSpotCounts();
    },
    onError: (error) => {
      setSyncResults(prev => ({ ...prev, [key]: {
        success: false,
        error: error.message || `Failed to sync ${key}`
      }}));
    }
  });

  const contactsMutation = useMutation(makeMutationConfig('syncHubSpotContacts', 'contacts', ['contacts']));
  const companiesMutation = useMutation(makeMutationConfig('syncHubSpotCompanies', 'companies', ['companies']));
  const dealsMutation = useMutation(makeMutationConfig('syncHubSpotDeals', 'deals', ['deals']));
  const ticketsMutation = useMutation(makeMutationConfig('syncHubSpotTickets', 'tickets', ['tickets']));
  const campaignsMutation = useMutation(makeMutationConfig('syncHubSpotEmailCampaigns', 'campaigns', ['campaigns']));
  const formsMutation = useMutation(makeMutationConfig('syncHubSpotForms', 'forms', ['forms']));
  const engagementsMutation = useMutation(makeMutationConfig('syncHubSpotEngagements', 'engagements', ['activities']));
  const tasksMutation = useMutation(makeMutationConfig('syncHubSpotTasks', 'tasks', ['tasks']));

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
    { 
      name: 'Contacts', 
      icon: Users, 
      mutation: contactsMutation, 
      current: contacts.length, 
      synced: hubspotContacts.length, 
      hubspotCount: hubspotCounts?.contacts || 0,
      color: '#4a90e2', 
      fields: 37 
    },
    { 
      name: 'Companies', 
      icon: Building2, 
      mutation: companiesMutation, 
      current: companies.length, 
      synced: hubspotCompanies.length, 
      hubspotCount: hubspotCounts?.companies || 0,
      color: '#52c41a', 
      fields: 13 
    },
    { 
      name: 'Deals', 
      icon: DollarSign, 
      mutation: dealsMutation, 
      current: deals.length, 
      synced: hubspotDeals.length, 
      hubspotCount: hubspotCounts?.deals || 0,
      color: '#fa8c16', 
      fields: 10 
    },
    { 
      name: 'Tickets', 
      icon: Ticket, 
      mutation: ticketsMutation, 
      current: tickets.length, 
      synced: hubspotTickets.length, 
      hubspotCount: hubspotCounts?.tickets || 0,
      color: '#eb2f96', 
      fields: 11 
    },
    { 
      name: 'Email Campaigns', 
      icon: Mail, 
      mutation: campaignsMutation, 
      current: campaigns.length, 
      synced: hubspotCampaigns.length, 
      hubspotCount: hubspotCounts?.campaigns || 0,
      color: '#722ed1', 
      fields: 15 
    },
    { 
      name: 'Forms', 
      icon: FileText, 
      mutation: formsMutation, 
      current: forms.length, 
      synced: hubspotForms.length, 
      hubspotCount: hubspotCounts?.forms || 0,
      color: '#13c2c2', 
      fields: 8 
    },
    { 
      name: 'Engagements', 
      icon: Activity, 
      mutation: engagementsMutation, 
      current: activities.length, 
      synced: hubspotActivities.length, 
      hubspotCount: hubspotCounts?.engagements || 0,
      color: '#faad14', 
      fields: 8 
    },
    { 
      name: 'Tasks', 
      icon: CheckSquare, 
      mutation: tasksMutation, 
      current: tasks.length, 
      synced: hubspotTasks.length, 
      hubspotCount: hubspotCounts?.tasks || 0,
      color: '#52c41a', 
      fields: 7 
    }
  ];

  // Pagination calculations
  const totalItems = syncItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = syncItems.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleCustomPageSubmit = (e) => {
    e.preventDefault();
    const page = parseInt(customPage);
    if (page && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setCustomPage('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`ampvibe-button px-4 py-2 ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    return pages;
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

  const totalHubSpotRecords = hubspotCounts ? 
    (hubspotCounts.contacts + hubspotCounts.companies + hubspotCounts.deals + 
     hubspotCounts.tickets + hubspotCounts.campaigns + hubspotCounts.forms + 
     hubspotCounts.engagements + hubspotCounts.tasks) : 0;

  const totalCurrentRecords = contacts.length + companies.length + deals.length + 
    tickets.length + campaigns.length + forms.length + activities.length + tasks.length;

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
          <NeuroButton onClick={loadHubSpotCounts} disabled={loadingCounts}>
            <Eye className="w-4 h-4 mr-2" />
            {loadingCounts ? 'Loading...' : 'Refresh Counts'}
          </NeuroButton>
        </div>

        {/* Summary Stats */}
        {hubspotCounts && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard
              icon={TrendingUp}
              title="In HubSpot"
              value={totalHubSpotRecords.toLocaleString()}
              subtitle="Total records available"
              color="#fa8c16"
            />
            <StatCard
              icon={CheckCircle}
              title="In AmplifyCRM"
              value={totalCurrentRecords.toLocaleString()}
              subtitle="Total records synced"
              color="#00A86B"
            />
            <StatCard
              icon={RefreshCw}
              title="Will Process"
              value={totalHubSpotRecords.toLocaleString()}
              subtitle="Records to sync/update"
              color="#4a90e2"
            />
          </div>
        )}

        {/* Sync All Button */}
        <NeuroCard className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold mb-1" style={{ color: "#666" }}>
                Ready to Sync Everything?
              </h3>
              {hubspotCounts ? (
                <p className="text-sm" style={{ color: "#888" }}>
                  This will sync {totalHubSpotRecords.toLocaleString()} records across 8 object types with 109 fields total
                </p>
              ) : (
                <p className="text-sm" style={{ color: "#888" }}>
                  Loading HubSpot counts...
                </p>
              )}
            </div>
            <NeuroButton 
              variant="primary" 
              onClick={handleSyncAll}
              disabled={isAnySyncing || !hubspotCounts}
            >
              {isAnySyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync All ({totalHubSpotRecords.toLocaleString()} Records)
                </>
              )}
            </NeuroButton>
          </div>
        </NeuroCard>

        {/* Pagination Controls - Top */}
        <NeuroCard className="mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Items per page */}
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: "#666" }}>Show:</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="ampvibe-input px-3 py-2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm" style={{ color: "#888" }}>
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
              </span>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <NeuroButton
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </NeuroButton>

              {renderPageNumbers()}

              <NeuroButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </NeuroButton>

              {/* Custom page input */}
              <form onSubmit={handleCustomPageSubmit} className="flex items-center gap-2 ml-4">
                <span className="text-sm" style={{ color: "#888" }}>Go to:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={customPage}
                  onChange={(e) => setCustomPage(e.target.value)}
                  placeholder="#"
                  className="ampvibe-input w-16 px-2 py-1 text-center"
                />
                <NeuroButton type="submit" size="sm">Go</NeuroButton>
              </form>
            </div>
          </div>
        </NeuroCard>

        {/* Paginated Sync Items Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {paginatedItems.map(item => (
            <NeuroCard key={item.name}>
              <div className="flex items-start justify-between mb-3">
                <item.icon className="w-6 h-6" style={{ color: item.color }} />
                {hubspotCounts && (
                  <span className="ampvibe-button px-2 py-1 text-xs font-bold" style={{ color: item.color }}>
                    {item.hubspotCount} in HubSpot
                  </span>
                )}
              </div>
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>{item.name}</h3>
              <div className="space-y-1 text-sm mb-4">
                <div className="flex justify-between">
                  <span style={{ color: "#888" }}>Current:</span>
                  <span className="font-bold" style={{ color: "#666" }}>{item.current}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#888" }}>From HubSpot:</span>
                  <span className="font-bold text-green-600">{item.synced}</span>
                </div>
                {hubspotCounts && (
                  <div className="flex justify-between pt-1 border-t" style={{ borderColor: "#e0e0e0" }}>
                    <span style={{ color: "#888" }}>Will Sync:</span>
                    <span className="font-bold" style={{ color: item.color }}>{item.hubspotCount}</span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm mb-2" style={{ color: "#888" }}>{item.fields} fields</p>
                {hubspotCounts && (
                  <p className="text-lg font-bold mb-4" style={{ color: item.color }}>
                    {item.hubspotCount.toLocaleString()} to sync
                  </p>
                )}
                <NeuroButton 
                  onClick={() => {
                    setSyncResults(prev => ({ ...prev, [item.name.toLowerCase()]: null }));
                    item.mutation.mutate();
                  }}
                  disabled={item.mutation.isPending || !hubspotCounts}
                  className="w-full"
                >
                  {item.mutation.isPending ? 'Syncing...' : 'Sync'}
                </NeuroButton>
              </div>
            </NeuroCard>
          ))}
        </div>

        {/* Pagination Controls - Bottom */}
        <NeuroCard className="mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Items info */}
            <span className="text-sm" style={{ color: "#888" }}>
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
            </span>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <NeuroButton
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </NeuroButton>

              <span className="text-sm px-4" style={{ color: "#666" }}>
                Page {currentPage} of {totalPages}
              </span>

              <NeuroButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </NeuroButton>
            </div>
          </div>
        </NeuroCard>

        {/* Sync Results */}
        {Object.entries(syncResults).map(([key, result]) => 
          renderSyncResult(result, key.charAt(0).toUpperCase() + key.slice(1) + ' Sync')
        )}
      </div>
    </div>
  );
}