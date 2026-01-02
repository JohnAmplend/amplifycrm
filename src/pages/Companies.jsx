import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Plus, Download, Upload, X, ChevronLeft, ChevronRight, Building2, TrendingUp, DollarSign, Users, Filter } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import CompanyForm from "../components/crm/CompanyForm";
import AdvancedFilters from "../components/crm/AdvancedFilters";
import LoadingState from "../components/crm/LoadingState";
import EmptyState from "../components/crm/EmptyState";
import { toast } from "../components/crm/useToast";

export default function Companies() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeStatFilter, setActiveStatFilter] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [filterLogic, setFilterLogic] = useState('AND'); // Added filterLogic state
  
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

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onMutate: async (newCompany) => {
      await queryClient.cancelQueries(['companies']);
      const previousCompanies = queryClient.getQueryData(['companies']);

      queryClient.setQueryData(['companies'], (old) => {
        const optimisticCompany = {
          ...newCompany,
          id: 'temp-' + Date.now(),
          created_date: new Date().toISOString(),
          created_by: currentUser?.email,
          company_owner: newCompany.company_owner || currentUser?.email,
          domain: newCompany.domain || '',
          industry: newCompany.industry || '',
          phone: newCompany.phone || '',
          city: newCompany.city || '',
          state: newCompany.state || '',
          country: newCompany.country || '',
          number_of_employees: newCompany.number_of_employees || null,
          annual_revenue: newCompany.annual_revenue || null,
          lifecycle_stage: newCompany.lifecycle_stage || 'Lead',
        };
        return [optimisticCompany, ...(old || [])];
      });

      return { previousCompanies };
    },
    onError: (err, newCompany, context) => {
      if (context?.previousCompanies) {
        queryClient.setQueryData(['companies'], context.previousCompanies);
      }
      toast.error('Failed to create company: ' + err.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      toast.success('Company created successfully');
      setShowForm(false);
    }
  });

  const handleExport = () => {
    const csvContent = [
      ['Company Name', 'Domain', 'Industry', 'Phone', 'City', 'State', 'Country', 'Employees', 'Revenue', 'Owner', 'Stage', 'Created Date'],
      ...filteredCompanies.map(c => [
        c.company_name, c.domain, c.industry, c.phone, c.city, c.state, c.country,
        c.number_of_employees, c.annual_revenue, c.company_owner, c.lifecycle_stage,
        new Date(c.created_date).toLocaleDateString()
      ])
    ].map(row => row.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatCardClick = (filterType) => {
    setSearchTerm("");
    setFilterOwner("");
    setFilterStage("");
    setFilterIndustry("");
    setAdvancedFilters([]);
    setFilterLogic('AND'); // Reset logic when stat card clicked
    
    if (activeStatFilter === filterType) {
      setActiveStatFilter(null);
    } else {
      setActiveStatFilter(filterType);
    }
    
    setCurrentPage(1);
  };

  const applyAdvancedFilter = (company, filter) => {
    const value = company[filter.field];
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
  const newThisWeek = companies.filter(c => {
    const created = new Date(c.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  });
  const customers = companies.filter(c => c.lifecycle_stage === 'Customer');
  const largeCompanies = companies.filter(c => c.number_of_employees && c.number_of_employees > 500);

  const filteredCompanies = companies.filter(company => {
    // Apply stat card filter
    if (activeStatFilter === 'new-week') {
      const created = new Date(company.created_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (created <= weekAgo) return false;
    } else if (activeStatFilter === 'customers') {
      if (company.lifecycle_stage !== 'Customer') return false;
    } else if (activeStatFilter === 'large') {
      if (!company.number_of_employees || company.number_of_employees <= 500) return false;
    } else if (activeStatFilter === 'all') {
      // 'all' stat filter means no stat filter
    }
    
    // Apply advanced filters with AND/OR logic
    if (advancedFilters.length > 0) {
      if (filterLogic === 'AND') {
        const passesAllFilters = advancedFilters.every(filter => applyAdvancedFilter(company, filter));
        if (!passesAllFilters) return false;
      } else {
        // OR logic - at least one filter must match
        const passesAnyFilter = advancedFilters.some(filter => applyAdvancedFilter(company, filter));
        if (!passesAnyFilter) return false;
      }
    }
    
    // Apply regular filters
    const matchesSearch = 
      company.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = !filterOwner || company.company_owner === filterOwner;
    const matchesStage = !filterStage || company.lifecycle_stage === filterStage;
    const matchesIndustry = !filterIndustry || company.industry === filterIndustry;
    
    return matchesSearch && matchesOwner && matchesStage && matchesIndustry;
  });

  // Pagination calculations
  const totalItems = filteredCompanies.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

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
  }, [searchTerm, filterOwner, filterStage, filterIndustry, activeStatFilter, advancedFilters, filterLogic]);

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
                New Company
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="neuro-button p-2"
              >
                <X className="w-5 h-5" style={{ color: "#888" }} />
              </button>
            </div>
            <CompanyForm
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
              Companies
            </h1>
            <p style={{ color: "#888" }}>
              {filteredCompanies.length} {activeStatFilter || advancedFilters.length > 0 ? 'filtered' : 'total'} companies
            </p>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </NeuroButton>
            <Link to={createPageUrl("Import") + "?type=Companies"}>
              <NeuroButton>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </NeuroButton>
            </Link>
            <NeuroButton variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Company
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
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>Total Companies</p>
                <p className="text-3xl font-bold mb-1" style={{ color: "#4a90e2" }}>
                  {companies.length}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>Click to show all</p>
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <Building2 className="w-6 h-6" style={{ color: "#4a90e2" }} />
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
            onClick={() => handleStatCardClick('customers')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${activeStatFilter === 'customers' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>Customers</p>
                <p className="text-3xl font-bold mb-1" style={{ color: "#52c41a" }}>
                  {customers.length}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>Click to filter</p>
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <DollarSign className="w-6 h-6" style={{ color: "#52c41a" }} />
              </div>
            </div>
          </button>

          <button
            onClick={() => handleStatCardClick('large')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${activeStatFilter === 'large' ? 'ring-2 ring-purple-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>Large (500+ employees)</p>
                <p className="text-3xl font-bold mb-1" style={{ color: "#722ed1" }}>
                  {largeCompanies.length}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>Click to filter</p>
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <Users className="w-6 h-6" style={{ color: "#722ed1" }} />
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
                    {activeStatFilter === 'all' ? 'All Companies' :
                     activeStatFilter === 'new-week' ? 'New This Week' :
                     activeStatFilter === 'customers' ? 'Customers Only' :
                     activeStatFilter === 'large' ? 'Large Companies' : ''}
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
                  Showing {filteredCompanies.length} companies
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
                placeholder="Search companies..."
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
              placeholder="Filter by stage"
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              options={[
                { value: 'Lead', label: 'Lead' },
                { value: 'Opportunity', label: 'Opportunity' },
                { value: 'Customer', label: 'Customer' },
                { value: 'Evangelist', label: 'Evangelist' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by industry"
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              options={[
                { value: 'Technology', label: 'Technology' },
                { value: 'Healthcare', label: 'Healthcare' },
                { value: 'Finance', label: 'Finance' },
                { value: 'Retail', label: 'Retail' },
                { value: 'Manufacturing', label: 'Manufacturing' }
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

        {/* Companies Table */}
        <NeuroCard>
          {isLoading ? (
            <LoadingState message="Loading companies..." />
          ) : filteredCompanies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={activeStatFilter || advancedFilters.length > 0 ? 'No companies match these filters' : 'No companies yet'}
              message={activeStatFilter || advancedFilters.length > 0 ? 'Try adjusting your filters' : 'Get started by adding your first company'}
              actionLabel={!activeStatFilter && advancedFilters.length === 0 ? 'Add Company' : undefined}
              onAction={!activeStatFilter && advancedFilters.length === 0 ? () => setShowForm(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Company Name</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Industry</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Phone</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Location</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Stage</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.map((company) => (
                    <tr
                      key={company.id}
                      onClick={() => navigate(createPageUrl("CompanyDetail") + `?id=${company.id}`)}
                      className="border-b cursor-pointer hover:bg-gray-100 transition-colors"
                      style={{ borderColor: "#d8d8d8" }}
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium" style={{ color: "#666" }}>
                          {company.company_name}
                        </p>
                        {company.domain && (
                          <p className="text-sm" style={{ color: "#aaa" }}>{company.domain}</p>
                        )}
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>{company.industry}</td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>{company.phone}</td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>
                        {company.city && company.state && `${company.city}, ${company.state}`}
                        {company.city && !company.state && company.city}
                        {!company.city && company.state && company.state}
                      </td>
                      <td className="py-3 px-4">
                        <span className="neuro-button px-2 py-1 text-xs">
                          {company.lifecycle_stage}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>
                        {users.find(u => u.email === company.company_owner)?.full_name || company.company_owner}
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
          setFilterLogic(logic); // Set the logic
          setActiveStatFilter(null);
          setSearchTerm("");
          setFilterOwner("");
          setFilterStage("");
          setFilterIndustry("");
          setCurrentPage(1);
          setShowAdvancedFilters(false);
        }}
        currentFilters={advancedFilters}
        currentLogic={filterLogic} // Pass current logic to AdvancedFilters
      />
    </div>
  );
}