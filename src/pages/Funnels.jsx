import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Eye, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import FunnelForm from "../components/crm/FunnelForm";

export default function Funnels() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState(null);

  const { data: funnels = [], isLoading } = useQuery({
    queryKey: ['funnels'],
    queryFn: () => base44.entities.FunnelDefinition.list('-created_date')
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['funnel_stages'],
    queryFn: () => base44.entities.FunnelStage.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FunnelDefinition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['funnels']);
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async ({ funnelId, objectType }) => {
      const sameFunnels = funnels.filter(f => f.object_type === objectType && f.id !== funnelId);
      await Promise.all(sameFunnels.map(f => base44.entities.FunnelDefinition.update(f.id, { is_default: false })));
      return await base44.entities.FunnelDefinition.update(funnelId, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['funnels']);
    }
  });

  const handleDelete = (funnel) => {
    if (window.confirm(`Delete funnel "${funnel.funnel_name}"? This will not delete associated records.`)) {
      deleteMutation.mutate(funnel.id);
    }
  };

  const getStageCount = (funnelId) => {
    return stages.filter(s => s.funnel_id === funnelId).length;
  };

  const objectTypeColors = {
    Deal: "bg-blue-100 text-blue-800",
    Lead: "bg-green-100 text-green-800",
    Contact: "bg-purple-100 text-purple-800",
    Opportunity: "bg-orange-100 text-orange-800"
  };

  if (showForm) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <NeuroCard>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#666" }}>
              {editingFunnel ? `Edit Funnel: ${editingFunnel.funnel_name}` : 'Create New Funnel'}
            </h2>
            <FunnelForm
              funnel={editingFunnel}
              onSave={() => {
                setShowForm(false);
                setEditingFunnel(null);
                queryClient.invalidateQueries(['funnels']);
                queryClient.invalidateQueries(['funnel_stages']);
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingFunnel(null);
              }}
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
            <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
              Funnels
            </h1>
            <p style={{ color: "#888" }}>
              Manage your sales and lead funnels with customizable stages
            </p>
          </div>
          <NeuroButton variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Funnel
          </NeuroButton>
        </div>

        {/* Funnels Grid */}
        {isLoading ? (
          <div className="text-center py-12" style={{ color: "#aaa" }}>
            Loading funnels...
          </div>
        ) : funnels.length === 0 ? (
          <NeuroCard>
            <div className="text-center py-12">
              <Settings className="w-16 h-16 mx-auto mb-4" style={{ color: "#ccc" }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: "#666" }}>
                No Funnels Yet
              </h3>
              <p className="mb-6" style={{ color: "#888" }}>
                Create your first funnel to start managing your sales pipeline
              </p>
              <NeuroButton variant="primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Funnel
              </NeuroButton>
            </div>
          </NeuroCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funnels.map((funnel) => (
              <NeuroCard key={funnel.id} className="hover:scale-102 transition-transform">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2" style={{ color: "#666" }}>
                      {funnel.funnel_name}
                    </h3>
                    {funnel.description && (
                      <p className="text-sm mb-3" style={{ color: "#888" }}>
                        {funnel.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`ampvibe-inset px-3 py-1 text-sm font-medium rounded-full ${objectTypeColors[funnel.object_type]}`}>
                    {funnel.object_type}
                  </span>
                  {funnel.is_default && (
                    <span className="ampvibe-inset px-3 py-1 text-sm font-medium rounded-full text-green-600">
                      Default
                    </span>
                  )}
                  {!funnel.is_active && (
                    <span className="ampvibe-inset px-3 py-1 text-sm font-medium rounded-full text-gray-500">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="ampvibe-inset p-3 rounded-lg mb-4">
                  <p className="text-sm" style={{ color: "#666" }}>
                    <strong>{getStageCount(funnel.id)}</strong> stages
                  </p>
                </div>

                <div className="flex gap-2">
                  <NeuroButton
                    className="flex-1"
                    onClick={() => navigate(createPageUrl("FunnelBoard") + `?funnelId=${funnel.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Board
                  </NeuroButton>
                  <NeuroButton
                    onClick={() => {
                      setEditingFunnel(funnel);
                      setShowForm(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </NeuroButton>
                  {!funnel.is_default && (
                    <NeuroButton onClick={() => handleDelete(funnel)}>
                      <Trash2 className="w-4 h-4" />
                    </NeuroButton>
                  )}
                </div>

                {!funnel.is_default && (
                  <NeuroButton
                    className="w-full mt-2"
                    size="sm"
                    onClick={() => setDefaultMutation.mutate({ funnelId: funnel.id, objectType: funnel.object_type })}
                  >
                    Set as Default for {funnel.object_type}
                  </NeuroButton>
                )}
              </NeuroCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}