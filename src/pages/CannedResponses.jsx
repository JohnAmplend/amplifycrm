import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, Trash2, MessageSquare } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";

export default function CannedResponses() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingResponse, setEditingResponse] = useState(null);
  const [formData, setFormData] = useState({
    response_name: "",
    shortcut_code: "",
    response_body: "",
    category: "",
    is_active: true
  });

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['canned_responses'],
    queryFn: () => base44.entities.Canned_Response.list('-created_date')
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingResponse) {
        return base44.entities.Canned_Response.update(editingResponse.id, data);
      } else {
        return base44.entities.Canned_Response.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['canned_responses']);
      setShowForm(false);
      setEditingResponse(null);
      setFormData({
        response_name: "",
        shortcut_code: "",
        response_body: "",
        category: "",
        is_active: true
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Canned_Response.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['canned_responses']);
    }
  });

  const handleEdit = (response) => {
    setEditingResponse(response);
    setFormData({
      response_name: response.response_name,
      shortcut_code: response.shortcut_code || "",
      response_body: response.response_body,
      category: response.category || "",
      is_active: response.is_active !== false
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const filteredResponses = responses.filter(r =>
    r.response_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.shortcut_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Canned Responses
            </h1>
            <p style={{ color: "#888" }}>Pre-written responses for common support questions</p>
          </div>
          <NeuroButton variant="primary" onClick={() => { setShowForm(true); setEditingResponse(null); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Response
          </NeuroButton>
        </div>

        {showForm && (
          <NeuroCard className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              {editingResponse ? 'Edit Response' : 'New Response'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <NeuroInput
                  label="Response Name"
                  value={formData.response_name}
                  onChange={(e) => setFormData({ ...formData, response_name: e.target.value })}
                  required
                />
                <NeuroInput
                  label="Shortcut Code"
                  value={formData.shortcut_code}
                  onChange={(e) => setFormData({ ...formData, shortcut_code: e.target.value })}
                  placeholder="#greeting"
                />
              </div>
              <NeuroInput
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Greeting, Closing, Technical"
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#333" }}>
                  Response Body <span style={{ color: "#f5222d" }}>*</span>
                </label>
                <textarea
                  value={formData.response_body}
                  onChange={(e) => setFormData({ ...formData, response_body: e.target.value })}
                  className="ampvibe-input w-full min-h-[150px]"
                  placeholder="Write your response... Use {{first_name}}, {{company_name}}, etc. for personalization"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <NeuroButton type="button" onClick={() => { setShowForm(false); setEditingResponse(null); }}>
                  Cancel
                </NeuroButton>
                <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading ? 'Saving...' : 'Save Response'}
                </NeuroButton>
              </div>
            </form>
          </NeuroCard>
        )}

        {/* Search */}
        <NeuroCard className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
            <input
              type="text"
              placeholder="Search responses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ampvibe-input w-full pl-12"
            />
          </div>
        </NeuroCard>

        {/* Responses */}
        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading responses...
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No canned responses found</p>
              <NeuroButton onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Response
              </NeuroButton>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResponses.map((response) => (
                <div key={response.id} className="ampvibe-inset p-5 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold" style={{ color: "#666" }}>
                          {response.response_name}
                        </h3>
                        {response.shortcut_code && (
                          <span className="ampvibe-button px-2 py-1 text-xs font-mono">
                            {response.shortcut_code}
                          </span>
                        )}
                        {response.category && (
                          <span className="ampvibe-button px-2 py-1 text-xs">
                            {response.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: "#888" }}>
                        {response.response_body.substring(0, 200)}
                        {response.response_body.length > 200 && '...'}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <NeuroButton size="sm" onClick={() => handleEdit(response)}>
                        <Edit2 className="w-3 h-3" />
                      </NeuroButton>
                      <NeuroButton 
                        size="sm" 
                        onClick={() => {
                          if (window.confirm('Delete this response?')) {
                            deleteMutation.mutate(response.id);
                          }
                        }}
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