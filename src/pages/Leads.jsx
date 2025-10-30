
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Plus, Download, Upload, X, RefreshCw, ChevronLeft, ChevronRight, UserPlus, TrendingUp, Award, AlertCircle, Filter } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import LeadForm from "../components/crm/LeadForm";
import AdvancedFilters from "../components/crm/AdvancedFilters";

export default function Leads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeStatFilter, setActiveStatFilter] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [filterLogic, setFilterLogic] = useState('AND');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [customPage, setCustomPage] = useState('');

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
          id: 'temp-' + Date.now(),
          created_date: new Date().toISOString(),
          created_by: currentUser?.email,
          lead_owner: newLead.lead_owner || currentUser?.email,
          lead_status: newLead.lead_status || 'New',
          lead_score: newLead.lead_score || 0,
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
    ].map(row => row.map(item => `"${(item || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStatCardClick = (filterType) => {
    setSearchTerm("");
    setFilterOwner("");
    setFilterStatus("");
    setFilterSource("");
    setAdvancedFilters([]);
    setFilterLogic('AND'); // Reset filter logic when stat card is clicked

    if (activeStatFilter === filterType) {
      setActiveStatFilter(null);
    } else {
      setActiveStatFilter(filterType);
    }

    setCurrentPage(1);
  };

  const applyAdvancedFilter = (lead, filter) => {
    const value = lead[filter.field];
    const filterValue = filter.value;

    switch (filter.operator) {
      case 'contains':
        return value?.toString().toLowerCase().includes(filterValue.toLowerCase());
      case 'not_contains':
        return !value?.toString().toLowerCase().includes(filterValue.toLowerCase());
      case 'equals':
        return value?.toString().toLowerCase() === filterValue.toLowerCase();
      case 'not_equals':
        return value?.toString().toLowerCase() !== filterValue.toLowerCase();
      case 'starts_with':
        return value?.toString().toLowerCase().startsWith(filterValue.toLowerCase());
      case 'ends_with':
        return value?.toString().toLowerCase().endsWith(filterValue.toLowerCase());
      case 'is_empty':
        return !value || value === '';
      case 'is_not_empty':
        return value && value !== '';
      case 'greater_than':
        return parseFloat(value) > parseFloat(filterValue);
      case 'less_than':
        return parseFloat(value) < parseFloat(filterValue);
      case 'greater_or_equal':
        return parseFloat(value) >= parseFloat(filterValue);
      case 'less_or_equal':
        return parseFloat(value) <= parseFloat(filterValue);
      case 'is_after':
        return new Date(value) > new Date(filterValue);
      case 'is_before':
        return new Date(value) < new Date(filterValue);
      case 'in_last':
        const daysAgo = new Date();
        const amount = parseInt(filterValue);
        const unit = filter.unit || 'days';
        if (unit === 'days') daysAgo.setDate(daysAgo.getDate() - amount);
        else if (unit === 'weeks') daysAgo.setDate(daysAgo.getDate() - (amount * 7));
        else if (unit === 'months') daysAgo.setMonth(daysAgo.getMonth() - amount);
        else if (unit === 'years') daysAgo.setFullYear(daysAgo.getFullYear() - amount);
        return new Date(value) > daysAgo;
      case 'in_next':
        const daysAhead = new Date();
        const amountAhead = parseInt(filterValue);
        const unitAhead = filter.unit || 'days';
        if (unitAhead === 'days') daysAhead.setDate(daysAhead.getDate() + amountAhead);
        else if (unitAhead === 'weeks') daysAhead.setDate(daysAhead.getDate() + (amountAhead * 7));
        else if (unitAhead === 'months') daysAhead.setMonth(daysAhead.getMonth() + amountAhead);
        else if (unitAhead === 'years') daysAhead.setFullYear(daysAhead.getFullYear() + amountAhead);
        return new Date(value) < daysAhead;
      default:
        return true;
    }
  };

  // Stats calculations
  const newThisWeek = leads.filter(l => {
    const created = new Date(l.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  });
  const qualifiedLeads = leads.filter(l => l.lead_status === 'Qualified');
  const highScoreLeads = leads.filter(l => l.lead_score && l.lead_score >= 75);

  const filteredLeads = leads.filter(lead => {
    // Apply stat card filter
    if (activeStatFilter === 'new-week') {
      const created = new Date(lead.created_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (created <= weekAgo) return false;
    } else if (activeStatFilter === 'qualified') {
      if (lead.lead_status !== 'Qualified') return false;
    } else if (activeStatFilter === 'high-score') {
      if (!lead.lead_score || lead.lead_score < 75) return false;
    } else if (activeStatFilter === 'all') {
      // 'all' stat filter means no stat filter
    }

    // Apply advanced filters with AND/OR logic
    if (advancedFilters.length > 0) {
      if (filterLogic === 'AND') {
        const passesAllFilters = advancedFilters.every(filter => applyAdvancedFilter(lead, filter));
        if (!passesAllFilters) return false;
      } else {
        // OR logic - at least one filter must match
        const passesAnyFilter = advancedFilters.some(filter => applyAdvancedFilter(lead, filter));
        if (!passesAnyFilter) return false;
      }
    }

    // Apply regular filters
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

  // Pagination calculations
  const totalItems = filteredLeads.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 300, behavior: 'smooth' });
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
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterOwner, filterStatus, filterSource, activeStatFilter, advancedFilters, filterLogic]);

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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Leads
            </h1>
            <p style={{ color: "#888" }}>
              {filteredLeads.length} {activeStatFilter || advancedFilters.length > 0 ? 'filtered' : 'total'} leads • {filteredLeads.filter(l => !l.converted_contact_id).length} unconverted
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => handleStatCardClick('all')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${activeStatFilter === 'all' && !advancedFilters.length ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>Total Leads</p>
                <p className="text-3xl font-bold mb-1" style={{ color: "#4a90e2" }}>
                  {leads.length}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>Click to show all</p>
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <UserPlus className="w-6 h-6" style={{ color: "#4a90e2" }} />
              </div>
            </div>
          </button>

          <button
            onClick={() => handleStatCardClick('new-week')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${activeStatFilter === 'new-week' ? 'ring-2 ring-orange-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>New This Week</p>
                <p className="text-3xl font-bold mb-1" style={{ color: "#fa8c16" }}>
                  {newThisWeek.length}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>Click to filter</p>
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <TrendingUp className="w-6 h-6" style={{ color: "#fa8c16" }} />
              </div>
            </div>
          </button>

          <button
            onClick={() => handleStatCardClick('qualified')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${activeStatFilter === 'qualified' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>Qualified</p>
                <p className="text-3xl font-bold mb-1" style={{ color: "#52c41a" }}>
                  {qualifiedLeads.length}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>Click to filter</p>
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <AlertCircle className="w-6 h-6" style={{ color: "#52c41a" }} />
              </div>
            </div>
          </button>

          <button
            onClick={() => handleStatCardClick('high-score')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${activeStatFilter === 'high-score' ? 'ring-2 ring-purple-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>High Score (75+)</p>
                <p className="text-3xl font-bold mb-1" style={{ color: "#722ed1" }}>
                  {highScoreLeads.length}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>Click to filter</p>
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <Award className="w-6 h-6" style={{ color: "#722ed1" }} />
              </div>
            </div>
          </button>
        </div>

        {/* Active Filter Indicator */}
        {(activeStatFilter || advancedFilters.length > 0) && (
          <NeuroCard className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                {activeStatFilter && (
                  <span className="ampvibe-button px-3 py-2 active">
                    {activeStatFilter === 'all' ? 'All Leads' :
                     activeStatFilter === 'new-week' ? 'New This Week' :
                     activeStatFilter === 'qualified' ? 'Qualified Leads' :
                     activeStatFilter === 'high-score' ? 'High Score Leads' : ''}
                  </span>
                )}
                {advancedFilters.length > 0 && (
                  <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                    filterLogic === 'OR' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {filterLogic} Logic
                  </span>
                )}
                {advancedFilters.map((filter, index) => (
                  <span key={`${filter.field}-${index}`} className="ampvibe-button px-3 py-2 active flex items-center gap-2">
                    {filter.label} {filter.operator}{filter.value ? ` ${filter.value}` : ''}
                    <button onClick={() => setAdvancedFilters(advancedFilters.filter((_, i) => i !== index))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <span style={{ color: "#888" }}>
                  Showing {filteredLeads.length} leads
                </span>
              </div>
              <NeuroButton onClick={() => { setActiveStatFilter(null); setAdvancedFilters([]); setFilterLogic('AND'); }}>
                <X className="w-4 h-4 mr-2" />
                Clear All
              </NeuroButton>
            </div>
          </NeuroCard>
        )}

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-5 h-5 pointer-events-none" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ampvibe-input w-full pl-10"
                style={{ paddingLeft: '2.5rem' }}
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
            <NeuroButton onClick={() => setShowAdvancedFilters(true)} className="flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" />
              Advanced Filters {advancedFilters.length > 0 && `(${advancedFilters.length})`}
            </NeuroButton>
          </div>
        </NeuroCard>

        {/* Pagination Controls - Top */}
        {totalPages > 1 && (
          <NeuroCard className="mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
        )}

        {/* Leads Table */}
        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: "#aaa" }}>
                {activeStatFilter || advancedFilters.length > 0 ? 'No leads match these filters' : 'No leads found'}
              </p>
              {(activeStatFilter || advancedFilters.length > 0) && (
                <NeuroButton onClick={() => { setActiveStatFilter(null); setAdvancedFilters([]); setFilterLogic('AND'); }}>
                  Clear Filters
                </NeuroButton>
              )}
              {!activeStatFilter && advancedFilters.length === 0 && (
                <NeuroButton onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Lead
                </NeuroButton>
              )}
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
                  {paginatedLeads.map((lead) => (
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

        {/* Pagination Controls - Bottom */}
        {totalPages > 1 && (
          <NeuroCard className="mt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="text-sm" style={{ color: "#888" }}>
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
              </span>

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
        )}
      </div>

      {/* Advanced Filters Modal */}
      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={(filters, logic) => {
          setAdvancedFilters(filters);
          setFilterLogic(logic);
          setActiveStatFilter(null);
          setSearchTerm("");
          setFilterOwner("");
          setFilterStatus("");
          setFilterSource("");
          setCurrentPage(1);
          setShowAdvancedFilters(false);
        }}
        currentFilters={advancedFilters}
        currentLogic={filterLogic}
      />
    </div>
  );
}
