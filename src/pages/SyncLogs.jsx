import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function SyncLogs() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("");
  const [filterConnection, setFilterConnection] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['sync_logs'],
    queryFn: () => base44.entities.Sync_Log.list('-sync_started_at')
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['sync_connections'],
    queryFn: () => base44.entities.App_Sync_Connection.list()
  });

  const filteredLogs = logs.filter(log => {
    const matchesStatus = !filterStatus || log.sync_status === filterStatus;
    const matchesConnection = !filterConnection || log.connection_id === filterConnection;
    return matchesStatus && matchesConnection;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5" style={{ color: "#52c41a" }} />;
      case 'Failed':
        return <XCircle className="w-5 h-5" style={{ color: "#f5222d" }} />;
      case 'Partial':
        return <AlertCircle className="w-5 h-5" style={{ color: "#fa8c16" }} />;
      default:
        return <Clock className="w-5 h-5 animate-spin" style={{ color: "#4a90e2" }} />;
    }
  };

  const getConnectionName = (connectionId) => {
    const connection = connections.find(c => c.id === connectionId);
    return connection?.connection_name || 'Unknown';
  };

  const getDuration = (startedAt, completedAt) => {
    if (!completedAt) return 'In progress...';
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const seconds = Math.floor((end - start) / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeuroButton onClick={() => navigate(createPageUrl("AppSync"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                Sync Logs
              </h1>
              <p style={{ color: "#888" }}>View synchronization history</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <NeuroSelect
              placeholder="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Failed', label: 'Failed' },
                { value: 'Partial', label: 'Partial' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by connection"
              value={filterConnection}
              onChange={(e) => setFilterConnection(e.target.value)}
              options={connections.map(c => ({ value: c.id, label: c.connection_name }))}
            />
          </div>
        </NeuroCard>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Logs List */}
          <div className="lg:col-span-2">
            <NeuroCard>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                Sync History ({filteredLogs.length})
              </h2>
              {isLoading ? (
                <div className="text-center py-12" style={{ color: "#aaa" }}>
                  Loading logs...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p style={{ color: "#aaa" }}>No sync logs found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`neuro-inset p-4 rounded-lg cursor-pointer ${
                        selectedLog?.id === log.id ? 'ring-2 ring-blue-400' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="neuro-button p-2 rounded-lg">
                          {getStatusIcon(log.sync_status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold" style={{ color: "#666" }}>
                              {getConnectionName(log.connection_id)}
                            </p>
                            <span className={`neuro-button px-2 py-1 text-xs ${
                              log.sync_status === 'Completed' ? 'text-green-600' :
                              log.sync_status === 'Failed' ? 'text-red-600' :
                              log.sync_status === 'Partial' ? 'text-orange-600' : 'text-blue-600'
                            }`}>
                              {log.sync_status}
                            </span>
                          </div>
                          <p className="text-sm mb-2" style={{ color: "#888" }}>
                            {new Date(log.sync_started_at).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-4 text-xs" style={{ color: "#aaa" }}>
                            <span>Duration: {getDuration(log.sync_started_at, log.sync_completed_at)}</span>
                            <span>•</span>
                            <span className="text-green-600">Synced: {log.records_synced || 0}</span>
                            {log.records_failed > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-red-600">Failed: {log.records_failed}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </NeuroCard>
          </div>

          {/* Log Details */}
          <div>
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                Log Details
              </h3>
              {selectedLog ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>Connection</p>
                    <p style={{ color: "#666" }}>{getConnectionName(selectedLog.connection_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>Status</p>
                    <span className={`neuro-button px-2 py-1 text-sm ${
                      selectedLog.sync_status === 'Completed' ? 'text-green-600' :
                      selectedLog.sync_status === 'Failed' ? 'text-red-600' :
                      selectedLog.sync_status === 'Partial' ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {selectedLog.sync_status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>Started</p>
                    <p style={{ color: "#666" }}>
                      {new Date(selectedLog.sync_started_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedLog.sync_completed_at && (
                    <div>
                      <p className="text-sm mb-1" style={{ color: "#aaa" }}>Completed</p>
                      <p style={{ color: "#666" }}>
                        {new Date(selectedLog.sync_completed_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>Records Synced</p>
                    <p className="font-bold" style={{ color: "#52c41a" }}>
                      {selectedLog.records_synced || 0}
                    </p>
                  </div>
                  {selectedLog.records_failed > 0 && (
                    <div>
                      <p className="text-sm mb-1" style={{ color: "#aaa" }}>Records Failed</p>
                      <p className="font-bold" style={{ color: "#f5222d" }}>
                        {selectedLog.records_failed}
                      </p>
                    </div>
                  )}
                  {selectedLog.error_details && (
                    <div>
                      <p className="text-sm mb-2" style={{ color: "#aaa" }}>Error Details</p>
                      <div className="neuro-inset p-3 rounded-lg">
                        <p className="text-xs" style={{ color: "#666" }}>
                          {selectedLog.error_details}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedLog.sync_summary && (
                    <div>
                      <p className="text-sm mb-2" style={{ color: "#aaa" }}>Summary</p>
                      <div className="neuro-inset p-3 rounded-lg">
                        <pre className="text-xs whitespace-pre-wrap" style={{ color: "#666" }}>
                          {JSON.stringify(selectedLog.sync_summary, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center py-8" style={{ color: "#aaa" }}>
                  Select a log to view details
                </p>
              )}
            </NeuroCard>
          </div>
        </div>
      </div>
    </div>
  );
}