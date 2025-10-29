
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Plus, Download, Upload, X } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import ContactForm from "../components/crm/ContactForm";

export default function Contacts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }
  }, []);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  // Calculate stats
  const hubspotContacts = contacts.filter(c => c.custom_data?.hubspot_id);
  const newThisWeek = contacts.filter(c => {
    const created = new Date(c.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  });
  const customers = contacts.filter(c => c.lifecycle_stage === 'Customer');

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onMutate: async (newContact) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['contacts']);

      // Snapshot the previous value
      const previousContacts = queryClient.getQueryData(['contacts']);

      // Optimistically update to the new value
      queryClient.setQueryData(['contacts'], (old) => {
        const optimisticContact = {
          ...newContact,
          id: 'temp-' + Date.now(), // Assign a temporary ID
          created_date: new Date().toISOString(),
          created_by: currentUser?.email,
          contact_owner: newContact.contact_owner || currentUser?.email, // Default owner to current user if not provided
          lifecycle_stage: newContact.lifecycle_stage || 'Lead', // Default stage
          lead_status: newContact.lead_status || 'New', // Default status
        };
        return [optimisticContact, ...(old || [])];
      });

      // Return context with the snapshot
      return { previousContacts };
    },
    onError: (err, newContact, context) => {
      // Rollback on error
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts);
      }
      alert('Failed to create contact: ' + err.message);
    },
    onSuccess: () => {
      // Invalidate and refetch to get the real data from server and remove optimistic entry
      queryClient.invalidateQueries(['contacts']);
      setShowForm(false);
    }
  });

  const handleExport = () => {
    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Company', 'Owner', 'Status', 'Created Date'],
      ...filteredContacts.map(c => [
        c.first_name, c.last_name, c.email, c.phone, c.job_title,
        c.company_id, c.contact_owner, c.lead_status,
        new Date(c.created_date).toLocaleDateString()
      ])
    ].map(row => row.map(field => `"${field ? String(field).replace(/"/g, '""') : ''}"`).join(',')).join('\n'); // Ensure proper CSV escaping

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url); // Clean up the URL object
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = !filterOwner || contact.contact_owner === filterOwner;
    const matchesStage = !filterStage || contact.lifecycle_stage === filterStage;
    const matchesStatus = !filterStatus || contact.lead_status === filterStatus;
    
    return matchesSearch && matchesOwner && matchesStage && matchesStatus;
  });

  if (showForm) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <NeuroCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                New Contact
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="neuro-button p-2"
              >
                <X className="w-5 h-5" style={{ color: "#888" }} />
              </button>
            </div>
            <ContactForm
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Contacts
            </h1>
            <p style={{ color: "#888" }}>{filteredContacts.length} total contacts</p>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </NeuroButton>
            <Link to={createPageUrl("Import") + "?type=Contacts"}>
              <NeuroButton>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </NeuroButton>
            </Link>
            <NeuroButton variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </NeuroButton>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <NeuroCard>
            <div className="text-center">
              <p className="text-sm mb-1" style={{ color: "#888" }}>Total Contacts</p>
              <p className="text-3xl font-bold" style={{ color: "#4a90e2" }}>
                {contacts.length}
              </p>
            </div>
          </NeuroCard>
          <NeuroCard>
            <div className="text-center">
              <p className="text-sm mb-1" style={{ color: "#888" }}>From HubSpot</p>
              <p className="text-3xl font-bold" style={{ color: "#00A86B" }}>
                {hubspotContacts.length}
              </p>
            </div>
          </NeuroCard>
          <NeuroCard>
            <div className="text-center">
              <p className="text-sm mb-1" style={{ color: "#888" }}>New This Week</p>
              <p className="text-3xl font-bold" style={{ color: "#fa8c16" }}>
                {newThisWeek.length}
              </p>
            </div>
          </NeuroCard>
          <NeuroCard>
            <div className="text-center">
              <p className="text-sm mb-1" style={{ color: "#888" }}>Customers</p>
              <p className="text-3xl font-bold" style={{ color: "#52c41a" }}>
                {customers.length}
              </p>
            </div>
          </NeuroCard>
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search contacts..."
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
              placeholder="Filter by stage"
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              options={[
                { value: 'Subscriber', label: 'Subscriber' },
                { value: 'Lead', label: 'Lead' },
                { value: 'MQL', label: 'MQL' },
                { value: 'SQL', label: 'SQL' },
                { value: 'Opportunity', label: 'Opportunity' },
                { value: 'Customer', label: 'Customer' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Attempting', label: 'Attempting' },
                { value: 'Connected', label: 'Connected' },
                { value: 'Qualified', label: 'Qualified' },
                { value: 'Unqualified', label: 'Unqualified' }
              ]}
            />
          </div>
        </NeuroCard>

        {/* Contacts Table */}
        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading contacts...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: "#aaa" }}>No contacts found</p>
              <NeuroButton onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Contact
              </NeuroButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Name</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Email</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Phone</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Job Title</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Stage</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Status</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => navigate(createPageUrl("ContactDetail") + `?id=${contact.id}`)}
                      className="border-b cursor-pointer hover:bg-gray-100 transition-colors"
                      style={{ borderColor: "#d8d8d8" }}
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium" style={{ color: "#666" }}>
                          {contact.first_name} {contact.last_name}
                        </p>
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>{contact.email}</td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>{contact.phone}</td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>{contact.job_title}</td>
                      <td className="py-3 px-4">
                        <span className="neuro-button px-2 py-1 text-xs">
                          {contact.lifecycle_stage}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="neuro-button px-2 py-1 text-xs">
                          {contact.lead_status}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>
                        {users.find(u => u.email === contact.contact_owner)?.full_name || contact.contact_owner}
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
