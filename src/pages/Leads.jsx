
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Plus, Download, Upload, X, RefreshCw } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import LeadForm from "../components/crm/LeadForm";

export default function Leads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }
  }, []);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onMutate: async (newLead) => {
      await queryClient.cancelQueries(['leads']);
      const previousLeads = queryClient.getQueryData(['leads']);

      queryClient.setQueryData(['leads'], (old) => {
        const optimisticLead = {
          ...newLead,
          id: 'temp-' + Date.now(), // Temporary ID for optimistic rendering
          created_date: new Date().toISOString(),
          created_by: currentUser?.email,
          lead_owner: newLead.lead_owner || currentUser?.email, // Ensure owner is set
          lead_status: newLead.lead_status || 'New', // Default status
          lead_score: newLead.lead_score || 0, // Default score
        };
        return [optimisticLead, ...(old || [])];
      });

      return { previousLeads };
    },
    onError: (err, newLead, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads'], context.previousLeads);
      }
      alert('Failed to create lead: ' + err.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      setShowForm(false);
    }
  });

  const handleExport = () => {
    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title', 'Source', 'Status', 'Score', 'Owner', 'Created Date'],
      ...filteredLeads.map(l => [
        l.first_name, l.last_name, l.email, l.phone, l.company_name, l.job_title,
        l.lead_source, l.lead_status, l.lead_score, l.lead_owner,
        new Date(l.created_date).toLocaleDateString()
      ])
    ].map(row => row.map(item => `"${(item || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n'); // Ensure proper CSV escaping

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); // Required for Firefox
    a.click();
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(url); // Release object URL
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = !filterOwner || lead.lead_owner === filterOwner;
    const matchesStatus = !filterStatus || lead.lead_status === filterStatus;
    const matchesSource = !filterSource || lead.lead_source === filterSource;
    
    return matchesSearch && matchesOwner && matchesStatus && matchesSource;
  });

  if (showForm) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <NeuroCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                New Lead
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="neuro-button p-2"
              >
                <X className="w-5 h-5" style={{ color: "#888" }} />
              </button>
            </div>
            <LeadForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowForm(false)}
              currentUser={currentUser}
            />
          </NeuroCard>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Leads
            </h1>
            <p style={{ color: "#888" }}>
              {filteredLeads.length} total leads • {filteredLeads.filter(l => !l.converted_contact_id).length} unconverted
            </p>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </NeuroButton>
            <Link to={createPageUrl("Import") + "?type=Leads"}>
              <NeuroButton>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </NeuroButton>
            </Link>
            <NeuroButton variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </NeuroButton>
          </div>
        </div>

        <NeuroCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neuro-input w-full pl-12"
              />
            </div>
            <NeuroSelect
              placeholder="Filter by owner"
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              options={users.map(u => ({ value: u.email, label: u.full_name || u.email }))}
            />
            <NeuroSelect
              placeholder="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Attempting Contact', label: 'Attempting Contact' },
                { value: 'Connected', label: 'Connected' },
                { value: 'Qualified', label: 'Qualified' },
                { value: 'Converted', label: 'Converted' },
                { value: 'Unqualified', label: 'Unqualified' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by source"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              options={[
                { value: 'Website', label: 'Website' },
                { value: 'Referral', label: 'Referral' },
                { value: 'Social Media', label: 'Social Media' },
                { value: 'Cold Call', label: 'Cold Call' },
                { value: 'Event', label: 'Event' },
                { value: 'Form', label: 'Form' }
              ]}
            />
          </div>
        </NeuroCard>

        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: "#aaa" }}>No leads found</p>
              <NeuroButton onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Lead
              </NeuroButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Name</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Email</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Company</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Source</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Status</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Score</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Owner</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b hover:bg-gray-100 transition-colors"
                      style={{ borderColor: "#d8d8d8" }}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(createPageUrl("LeadDetail") + `?id=${lead.id}`)}
                          className="font-medium text-left hover:underline"
                          style={{ color: "#666" }}
                        >
                          {lead.first_name} {lead.last_name}
                        </button>
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>{lead.email}</td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>{lead.company_name}</td>
                      <td className="py-3 px-4">
                        <span className="neuro-button px-2 py-1 text-xs">
                          {lead.lead_source}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`neuro-button px-2 py-1 text-xs ${
                          lead.lead_status === 'Converted' ? 'text-green-600' :
                          lead.lead_status === 'Qualified' ? 'text-blue-600' :
                          lead.lead_status === 'Unqualified' ? 'text-red-600' : ''
                        }`}>
                          {lead.lead_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold" style={{ color: "#666" }}>
                          {lead.lead_score || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>
                        {users.find(u => u.email === lead.lead_owner)?.full_name || lead.lead_owner}
                      </td>
                      <td className="py-3 px-4">
                        {!lead.converted_contact_id && (
                          <NeuroButton
                            size="sm"
                            onClick={() => navigate(createPageUrl("LeadDetail") + `?id=${lead.id}&convert=true`)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Convert
                          </NeuroButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}
