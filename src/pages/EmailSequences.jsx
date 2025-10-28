import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, BarChart3, Edit2, Copy, Trash2, Layers, Power } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function EmailSequences() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ['email_sequences'],
    queryFn: () => base44.entities.Email_Sequence.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Email_Sequence.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['email_sequences']);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Email_Sequence.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['email_sequences']);
    }
  });

  const filteredSequences = sequences.filter(seq =>
    seq.sequence_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (seq) => {
    if (window.confirm(`Delete sequence "${seq.sequence_name}"?`)) {
      deleteMutation.mutate(seq.id);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Email Sequences
            </h1>
            <p style={{ color: "#888" }}>Automate your email follow-ups</p>
          </div>
          <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("CreateSequence"))}>
            <Plus className="w-4 h-4 mr-2" />
            Create Sequence
          </NeuroButton>
        </div>

        {/* Search */}
        <NeuroCard className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
            <input
              type="text"
              placeholder="Search sequences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neuro-input w-full pl-12"
            />
          </div>
        </NeuroCard>

        {/* Sequences */}
        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading sequences...
            </div>
          ) : filteredSequences.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No sequences found</p>
              <NeuroButton onClick={() => navigate(createPageUrl("CreateSequence"))}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Sequence
              </NeuroButton>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSequences.map((sequence) => (
                <div key={sequence.id} className="neuro-inset p-5 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="neuro-button p-2 rounded-lg">
                          <Layers className="w-5 h-5" style={{ color: "#4a90e2" }} />
                        </div>
                        <div>
                          <h3 className="font-bold" style={{ color: "#666" }}>
                            {sequence.sequence_name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={`neuro-button px-2 py-1 text-xs ${
                              sequence.is_active ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {sequence.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs" style={{ color: "#888" }}>
                              {sequence.enrollment_trigger}
                            </span>
                          </div>
                        </div>
                      </div>
                      {sequence.description && (
                        <p className="text-sm" style={{ color: "#888" }}>
                          {sequence.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <NeuroButton
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({
                          id: sequence.id,
                          is_active: !sequence.is_active
                        })}
                      >
                        <Power className={`w-3 h-3 ${sequence.is_active ? 'text-green-600' : ''}`} />
                      </NeuroButton>
                      <NeuroButton
                        size="sm"
                        onClick={() => navigate(createPageUrl("CreateSequence") + `?id=${sequence.id}`)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </NeuroButton>
                      <NeuroButton
                        size="sm"
                        onClick={() => handleDelete(sequence)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </NeuroButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}