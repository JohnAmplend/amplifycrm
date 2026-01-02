import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, X, Table as TableIcon, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import DealForm from "../components/crm/DealForm";
import DealKanban from "../components/crm/DealKanban";
import LoadingState from "../components/crm/LoadingState";
import EmptyState from "../components/crm/EmptyState";
import { toast } from "../components/crm/useToast";
import { DollarSign } from "lucide-react";

export default function Deals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("kanban");
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

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Deal.create(data),
    onMutate: async (newDeal) => {
      await queryClient.cancelQueries(['deals']);
      const previousDeals = queryClient.getQueryData(['deals']);

      queryClient.setQueryData(['deals'], (old) => {
        const optimisticDeal = {
          ...newDeal,
          id: 'temp-' + Date.now(),
          created_date: new Date().toISOString(),
          created_by: currentUser?.email
        };
        return [optimisticDeal, ...(old || [])];
      });

      return { previousDeals };
    },
    onError: (err, newDeal, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals'], context.previousDeals);
      }
      toast.error('Failed to create deal: ' + err.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      toast.success('Deal created successfully');
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deal.update(id, data),
    onMutate: async ({ id, data: updatedData }) => {
      await queryClient.cancelQueries(['deals']);
      const previousDeals = queryClient.getQueryData(['deals']);

      queryClient.setQueryData(['deals'], (old) => {
        if (!old) return old;
        return old.map(d => d.id === id ? { ...d, ...updatedData } : d);
      });

      return { previousDeals };
    },
    onError: (err, variables, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals'], context.previousDeals);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
    }
  });

  // Pagination calculations
  const totalItems = deals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDeals = deals.slice(startIndex, endIndex);

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
                New Deal
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="neuro-button p-2"
              >
                <X className="w-5 h-5" style={{ color: "#888" }} />
              </button>
            </div>
            <DealForm
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
              Deals
            </h1>
            <p style={{ color: "#888" }}>
              {deals.length} total deals • $
              {deals.reduce((sum, d) => sum + (d.deal_amount || 0), 0).toLocaleString()} pipeline value
            </p>
          </div>
          <div className="flex gap-3">
            <div className="neuro-card flex p-1">
              <button
                onClick={() => setViewMode("kanban")}
                className={`neuro-button p-2 ${viewMode === "kanban" ? "active" : ""}`}
              >
                <LayoutGrid className="w-4 h-4" style={{ color: "#666" }} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`neuro-button p-2 ${viewMode === "table" ? "active" : ""}`}
              >
                <TableIcon className="w-4 h-4" style={{ color: "#666" }} />
              </button>
            </div>
            <NeuroButton variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </NeuroButton>
          </div>
        </div>

        {viewMode === "kanban" ? (
          <DealKanban
            deals={deals}
            onUpdateDeal={updateMutation.mutate}
            onClickDeal={(deal) => navigate(createPageUrl("DealDetail") + `?id=${deal.id}`)}
          />
        ) : (
          <>
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
                <LoadingState message="Loading deals..." />
              ) : paginatedDeals.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="No deals yet"
                  message="Get started by creating your first deal"
                  actionLabel="Add Deal"
                  onAction={() => setShowForm(true)}
                />
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Deal Name</th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Amount</th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Stage</th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Close Date</th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Priority</th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDeals.map((deal) => (
                      <tr
                        key={deal.id}
                        onClick={() => navigate(createPageUrl("DealDetail") + `?id=${deal.id}`)}
                        className="border-b cursor-pointer hover:bg-gray-100 transition-colors"
                        style={{ borderColor: "#d8d8d8" }}
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium" style={{ color: "#666" }}>
                            {deal.deal_name}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-semibold" style={{ color: "#4a90e2" }}>
                          ${(deal.deal_amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="neuro-button px-2 py-1 text-xs">
                            {deal.deal_stage}
                          </span>
                        </td>
                        <td className="py-3 px-4" style={{ color: "#888" }}>
                          {deal.close_date ? new Date(deal.close_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`neuro-button px-2 py-1 text-xs ${
                            deal.priority === 'High' ? 'text-red-600' :
                            deal.priority === 'Medium' ? 'text-orange-600' : ''
                          }`}>
                            {deal.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4" style={{ color: "#888" }}>
                          {deal.deal_owner}
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
          </>
        )}
      </div>
    </div>
  );
}