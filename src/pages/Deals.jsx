import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, X, Table as TableIcon, LayoutGrid } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import DealForm from "../components/crm/DealForm";
import DealKanban from "../components/crm/DealKanban";

export default function Deals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("kanban"); // kanban or table
  const [currentUser, setCurrentUser] = useState(null);

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
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
    }
  });

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
          <NeuroCard>
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
                  {deals.map((deal) => (
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
          </NeuroCard>
        )}
      </div>
    </div>
  );
}