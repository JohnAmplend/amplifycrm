import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Plus, Download, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import CompanyForm from "../components/crm/CompanyForm";

export default function Companies() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
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
      alert('Failed to create company: ' + err.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
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

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = !filterOwner || company.company_owner === filterOwner;
    const matchesStage = !filterStage || company.lifecycle_stage === filterStage;
    
    return matchesSearch && matchesOwner && matchesStage;
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterOwner, filterStage]);

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Companies
            </h1>
            <p style={{ color: "#888" }}>{filteredCompanies.length} total companies</p>
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

        <NeuroCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search companies..."
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
                { value: 'Lead', label: 'Lead' },
                { value: 'Opportunity', label: 'Opportunity' },
                { value: 'Customer', label: 'Customer' },
                { value: 'Evangelist', label: 'Evangelist' }
              ]}
            />
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

        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading companies...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: "#aaa" }}>No companies found</p>
              <NeuroButton onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Company
              </NeuroButton>
            </div>
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
    </div>
  );
}