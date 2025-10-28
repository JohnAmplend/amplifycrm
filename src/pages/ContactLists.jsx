import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Edit2, Trash2, List, Users } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function ContactLists() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['contact_lists'],
    queryFn: () => base44.entities.Contact_List.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact_List.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contact_lists']);
    }
  });

  const filteredLists = lists.filter(list =>
    list.list_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (list) => {
    if (window.confirm(`Delete list "${list.list_name}"?`)) {
      deleteMutation.mutate(list.id);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Contact Lists
            </h1>
            <p style={{ color: "#888" }}>Organize contacts for targeted campaigns</p>
          </div>
          <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("CreateList"))}>
            <Plus className="w-4 h-4 mr-2" />
            Create List
          </NeuroButton>
        </div>

        {/* Search */}
        <NeuroCard className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
            <input
              type="text"
              placeholder="Search lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neuro-input w-full pl-12"
            />
          </div>
        </NeuroCard>

        {/* Lists */}
        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading lists...
            </div>
          ) : filteredLists.length === 0 ? (
            <div className="text-center py-12">
              <List className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No lists found</p>
              <NeuroButton onClick={() => navigate(createPageUrl("CreateList"))}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First List
              </NeuroButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLists.map((list) => (
                <div key={list.id} className="neuro-inset p-5 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="neuro-button p-3 rounded-lg">
                      <Users className="w-6 h-6" style={{ color: "#4a90e2" }} />
                    </div>
                    <span className="neuro-button px-2 py-1 text-xs">
                      {list.list_type}
                    </span>
                  </div>
                  <h3 className="font-bold mb-2" style={{ color: "#666" }}>
                    {list.list_name}
                  </h3>
                  {list.description && (
                    <p className="text-sm mb-3" style={{ color: "#888" }}>
                      {list.description.substring(0, 80)}...
                    </p>
                  )}
                  <div className="neuro-inset p-3 rounded-lg text-center mb-3">
                    <p className="text-2xl font-bold" style={{ color: "#666" }}>
                      {list.total_contacts || 0}
                    </p>
                    <p className="text-xs" style={{ color: "#aaa" }}>Contacts</p>
                  </div>
                  <div className="flex gap-2">
                    <NeuroButton
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(createPageUrl("ListDetail") + `?id=${list.id}`)}
                    >
                      View
                    </NeuroButton>
                    <NeuroButton
                      size="sm"
                      onClick={() => navigate(createPageUrl("CreateList") + `?id=${list.id}`)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </NeuroButton>
                    <NeuroButton
                      size="sm"
                      onClick={() => handleDelete(list)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </NeuroButton>
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