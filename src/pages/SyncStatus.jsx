import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { RefreshCw, Users, Building2, DollarSign, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import StatCard from "../components/crm/StatCard";

export default function SyncStatus() {
  const navigate = useNavigate();

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list()
  });

  const { data: syncLogs = [], refetch } = useQuery({
    queryKey: ['sync_logs'],
    queryFn: () => base44.entities.Sync_Log.list('-created_date', 20)
  });

  const hubspotContacts = contacts.filter(c => c.custom_data?.hubspot_id);
  const lastSync = syncLogs.find(log => log.sync_type === 'HubSpot Contacts');
  const successfulSyncs = syncLogs.filter(log => log.sync_status === 'Completed').length;
  const failedSyncs = syncLogs.filter(log => log.sync_status === 'Failed').length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Sync Status Dashboard
            </h1>
            <p style={{ color: "#888" }}>Monitor all your integration syncs</p>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </NeuroButton>
            <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("HubSpotSync"))}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run HubSpot Sync
            </NeuroButton>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total Contacts"
            value={contacts.length}
            subtitle={`${hubspotContacts.length} from HubSpot`}
            color="#4a90e2"
          />
          <StatCard
            icon={Building2}
            title="Total Companies"
            value={companies.length}
            subtitle="Synced organizations"
            color="#52c41a"
          />
          <StatCard
            icon={DollarSign}
            title="Total Deals"
            value={deals.length}
            subtitle={`$${deals.reduce((sum, d) => sum + (d.deal_amount || 0), 0).toLocaleString()} value`}
            color="#fa8c16"
          />
          <StatCard
            icon={TrendingUp}
            title="Sync Success Rate"
            value={syncLogs.length > 0 ? `${Math.round((successfulSyncs / syncLogs.length) * 100)}%` : '—'}
            subtitle={`${successfulSyncs} successful, ${failedSyncs} failed`}
            color="#00A86B"
          />
        </div>

        {/* Last Sync Info */}
        {lastSync && (
          <NeuroCard className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              Last HubSpot Sync
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="ampvibe-inset p-4 rounded-lg">
                <p className="text-sm mb-1" style={{ color: "#888" }}>Status</p>
                <div className="flex items-center gap-2">
                  {lastSync.sync_status === 'Completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : lastSync.sync_status === 'Failed' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className="font-bold" style={{ color: "#666" }}>
                    {lastSync.sync_status}
                  </span>
                </div>
              </div>
              <div className="ampvibe-inset p-4 rounded-lg">
                <p className="text-sm mb-1" style={{ color: "#888" }}>Created</p>
                <p className="text-2xl font-bold text-green-600">
                  {lastSync.records_created || 0}
                </p>
              </div>
              <div className="ampvibe-inset p-4 rounded-lg">
                <p className="text-sm mb-1" style={{ color: "#888" }}>Updated</p>
                <p className="text-2xl font-bold text-blue-600">
                  {lastSync.records_updated || 0}
                </p>
              </div>
              <div className="ampvibe-inset p-4 rounded-lg">
                <p className="text-sm mb-1" style={{ color: "#888" }}>Errors</p>
                <p className="text-2xl font-bold text-red-600">
                  {lastSync.records_failed || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#888" }}>
                  Started: {new Date(lastSync.sync_started_at || lastSync.created_date).toLocaleString()}
                </p>
                {lastSync.sync_completed_at && (
                  <p className="text-sm" style={{ color: "#888" }}>
                    Completed: {new Date(lastSync.sync_completed_at).toLocaleString()}
                  </p>
                )}
              </div>
              {lastSync.sync_summary?.fields_synced && (
                <span className="ampvibe-button px-3 py-1 text-sm">
                  {lastSync.sync_summary.fields_synced} fields synced
                </span>
              )}
            </div>
          </NeuroCard>
        )}

        {/* Sync History */}
        <NeuroCard>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            Sync History
          </h2>
          {syncLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: "#aaa" }}>No sync history yet</p>
              <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("HubSpotSync"))}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Your First Sync
              </NeuroButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Type</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Status</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Created</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Updated</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Errors</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Started</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {syncLogs.map((log) => {
                    const duration = log.sync_completed_at 
                      ? Math.round((new Date(log.sync_completed_at) - new Date(log.sync_started_at || log.created_date)) / 1000)
                      : null;
                    
                    return (
                      <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#e0e0e0" }}>
                        <td className="py-3 px-4" style={{ color: "#666" }}>
                          {log.sync_type}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {log.sync_status === 'Completed' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : log.sync_status === 'Failed' ? (
                              <XCircle className="w-4 h-4 text-red-600" />
                            ) : log.sync_status === 'Partial' ? (
                              <CheckCircle className="w-4 h-4 text-yellow-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-blue-600" />
                            )}
                            <span className={`text-sm ${
                              log.sync_status === 'Completed' ? 'text-green-600' :
                              log.sync_status === 'Failed' ? 'text-red-600' :
                              log.sync_status === 'Partial' ? 'text-yellow-600' : 'text-blue-600'
                            }`}>
                              {log.sync_status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-green-600">
                          {log.records_created || 0}
                        </td>
                        <td className="py-3 px-4 font-semibold text-blue-600">
                          {log.records_updated || 0}
                        </td>
                        <td className="py-3 px-4 font-semibold text-red-600">
                          {log.records_failed || 0}
                        </td>
                        <td className="py-3 px-4" style={{ color: "#888" }}>
                          {new Date(log.sync_started_at || log.created_date).toLocaleString()}
                        </td>
                        <td className="py-3 px-4" style={{ color: "#888" }}>
                          {duration ? `${duration}s` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}