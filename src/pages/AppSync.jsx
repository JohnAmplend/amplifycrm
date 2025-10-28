import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, RefreshCw, Edit2, Trash2, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function AppSync() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['sync_connections'],
    queryFn: () => base44.entities.App_Sync_Connection.list('-created_date')
  });

  const syncMutation = useMutation({
    mutationFn: async (connectionId) => {
      // This would trigger the sync function
      alert('Sync started! Check sync logs for details.');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sync_connections']);
      queryClient.invalidateQueries(['sync_logs']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.App_Sync_Connection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sync_connections']);
    }
  });

  const handleDelete = (connection) => {
    if (window.confirm(`Delete connection "${connection.connection_name}"?`)) {
      deleteMutation.mutate(connection.id);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-5 h-5" style={{ color: "#52c41a" }} />;
      case 'Error':
        return <XCircle className="w-5 h-5" style={{ color: "#f5222d" }} />;
      default:
        return <Clock className="w-5 h-5" style={{ color: "#aaa" }} />;
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              App Sync
            </h1>
            <p style={{ color: "#888" }}>Connect and sync with other Base44 apps</p>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={() => navigate(createPageUrl("SyncLogs"))}>
              <FileText className="w-4 h-4 mr-2" />
              View Logs
            </NeuroButton>
            <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("AddConnection"))}>
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </NeuroButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <NeuroCard>
            <div>
              <p className="text-sm mb-1" style={{ color: "#aaa" }}>Total Connections</p>
              <p className="text-3xl font-bold" style={{ color: "#666" }}>
                {connections.length}
              </p>
            </div>
          </NeuroCard>

          <NeuroCard>
            <div>
              <p className="text-sm mb-1" style={{ color: "#aaa" }}>Active</p>
              <p className="text-3xl font-bold" style={{ color: "#52c41a" }}>
                {connections.filter(c => c.sync_status === 'Active').length}
              </p>
            </div>
          </NeuroCard>

          <NeuroCard>
            <div>
              <p className="text-sm mb-1" style={{ color: "#aaa" }}>With Errors</p>
              <p className="text-3xl font-bold" style={{ color: "#f5222d" }}>
                {connections.filter(c => c.sync_status === 'Error').length}
              </p>
            </div>
          </NeuroCard>
        </div>

        {/* Connections List */}
        <NeuroCard>
          <h2 className="text-xl font-bold mb-6" style={{ color: "#666" }}>
            Connections
          </h2>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading connections...
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No connections configured</p>
              <NeuroButton onClick={() => navigate(createPageUrl("AddConnection"))}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Connection
              </NeuroButton>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div key={connection.id} className="neuro-inset p-6 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(connection.sync_status)}
                        <h3 className="text-xl font-bold" style={{ color: "#666" }}>
                          {connection.connection_name}
                        </h3>
                        <span className={`neuro-button px-2 py-1 text-xs ${
                          connection.sync_status === 'Active' ? 'text-green-600' :
                          connection.sync_status === 'Error' ? 'text-red-600' : ''
                        }`}>
                          {connection.sync_status}
                        </span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: "#888" }}>
                        {connection.source_app_url}
                      </p>
                      <div className="flex items-center gap-4 text-sm" style={{ color: "#aaa" }}>
                        <span>Type: {connection.sync_type}</span>
                        <span>•</span>
                        <span>Objects: {connection.sync_objects?.join(', ')}</span>
                        <span>•</span>
                        <span>
                          Last sync: {connection.last_sync_date ? 
                            new Date(connection.last_sync_date).toLocaleString() : 
                            'Never'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <NeuroButton
                        size="sm"
                        onClick={() => syncMutation.mutate(connection.id)}
                        disabled={syncMutation.isLoading}
                      >
                        <RefreshCw className={`w-4 h-4 mr-1 ${syncMutation.isLoading ? 'animate-spin' : ''}`} />
                        Sync Now
                      </NeuroButton>
                      <NeuroButton size="sm">
                        <Edit2 className="w-4 h-4" />
                      </NeuroButton>
                      <NeuroButton size="sm" onClick={() => handleDelete(connection)}>
                        <Trash2 className="w-4 h-4" />
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