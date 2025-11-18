import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Calendar as CalendarIcon, RefreshCw, Plus, Filter, 
  Search, AlertCircle, CheckCircle, Loader2, 
  ExternalLink, Database, Bug, Download
} from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";

export default function CRMCalendar() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showGoogleOnly, setShowGoogleOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [dbVerification, setDbVerification] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Load activities
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['calendar-activities', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Activity.list('-activity_date', 500);
      return all.filter(a => 
        a.assigned_to === user.email && 
        !a.deleted_at &&
        a.activity_date
      );
    },
    enabled: !!user
  });

  // Load sync logs
  const { data: syncLogs = [] } = useQuery({
    queryKey: ['sync-logs', user?.email],
    queryFn: () => base44.entities.Calendar_Sync_Log.filter({ 
      user_email: user.email 
    }).then(logs => logs.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )),
    enabled: !!user
  });

  // Sync from Google mutation
  const syncFromGoogleMutation = useMutation({
    mutationFn: () => base44.functions.invoke('gcal/pullGoogleEvents', {}),
    onSuccess: (response) => {
      const result = response.data;
      setLastSyncResult(result);
      queryClient.invalidateQueries(['calendar-activities']);
      queryClient.invalidateQueries(['sync-logs']);
      
      // Verify DB
      verifyDatabase();
    }
  });

  // Push to Google mutation
  const pushToGoogleMutation = useMutation({
    mutationFn: () => base44.functions.invoke('calendarSync/bulkPushActivities', {}),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['calendar-activities']);
      queryClient.invalidateQueries(['sync-logs']);
    }
  });

  // Full sync mutation
  const fullSyncMutation = useMutation({
    mutationFn: () => base44.functions.invoke('gcal/fullSyncForUser', {}),
    onSuccess: (response) => {
      const result = response.data;
      setLastSyncResult({
        ...result.from_google,
        full_sync: true
      });
      queryClient.invalidateQueries(['calendar-activities']);
      queryClient.invalidateQueries(['sync-logs']);
      verifyDatabase();
    }
  });

  // Connect Google mutation
  const connectGoogleMutation = useMutation({
    mutationFn: () => base44.functions.invoke('gcal/connectGoogle', {}),
    onSuccess: (response) => {
      if (response.data.auth_url) {
        window.open(response.data.auth_url, '_blank');
      }
    }
  });

  const verifyDatabase = async () => {
    try {
      const all = await base44.entities.Activity.list();
      const userActivities = all.filter(a => a.assigned_to === user.email);
      const googleSynced = userActivities.filter(a => a.google_event_id);
      
      setDbVerification({
        total: userActivities.length,
        google_synced: googleSynced.length,
        local_only: userActivities.length - googleSynced.length
      });
    } catch (error) {
      console.error('DB verification failed:', error);
    }
  };

  useEffect(() => {
    if (user) {
      verifyDatabase();
    }
  }, [user, activities]);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    // Date range filter
    const activityDate = new Date(activity.activity_date);
    const now = new Date();
    if (dateRange === 'today') {
      if (activityDate.toDateString() !== now.toDateString()) return false;
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (activityDate < weekAgo) return false;
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (activityDate < monthAgo) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && activity.status !== statusFilter) return false;

    // Type filter
    if (typeFilter !== 'all' && activity.activity_type !== typeFilter) return false;

    // Google sync filter
    if (showGoogleOnly && !activity.google_event_id) return false;

    // Search filter
    if (searchTerm && !activity.subject.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  const stats = {
    total: activities.length,
    google_synced: activities.filter(a => a.google_event_id).length,
    local_only: activities.filter(a => !a.google_event_id).length,
    filtered_out: activities.length - filteredActivities.length
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00A86B" }} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#666" }}>
              CRM Calendar
            </h1>
            <p style={{ color: "#888" }}>
              Two-way sync with Google Calendar
            </p>
          </div>

          <div className="flex gap-2">
            {!user.google_connected ? (
              <NeuroButton 
                variant="primary" 
                onClick={() => connectGoogleMutation.mutate()}
                disabled={connectGoogleMutation.isLoading}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect Google
              </NeuroButton>
            ) : (
              <>
                <NeuroButton 
                  onClick={() => syncFromGoogleMutation.mutate()}
                  disabled={syncFromGoogleMutation.isLoading}
                >
                  {syncFromGoogleMutation.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync from Google
                </NeuroButton>

                <NeuroButton 
                  onClick={() => pushToGoogleMutation.mutate()}
                  disabled={pushToGoogleMutation.isLoading}
                >
                  {pushToGoogleMutation.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Push to Google
                </NeuroButton>

                <NeuroButton 
                  variant="primary"
                  onClick={() => fullSyncMutation.mutate()}
                  disabled={fullSyncMutation.isLoading}
                >
                  {fullSyncMutation.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Full Sync
                </NeuroButton>
              </>
            )}
          </div>
        </div>

        {/* Connection Status */}
        {user.google_connected && (
          <NeuroCard className="mb-6 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5" style={{ color: "#00A86B" }} />
              <div>
                <p className="font-medium" style={{ color: "#666" }}>
                  Google Calendar Connected
                </p>
                <p className="text-sm" style={{ color: "#aaa" }}>
                  Calendar: {user.google_calendar_id || 'primary'}
                </p>
              </div>
            </div>
          </NeuroCard>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <NeuroCard className="p-4">
            <p className="text-sm mb-1" style={{ color: "#888" }}>Total Activities</p>
            <p className="text-3xl font-bold" style={{ color: "#666" }}>{stats.total}</p>
          </NeuroCard>

          <NeuroCard className="p-4">
            <p className="text-sm mb-1" style={{ color: "#888" }}>Google Synced</p>
            <p className="text-3xl font-bold" style={{ color: "#00A86B" }}>{stats.google_synced}</p>
          </NeuroCard>

          <NeuroCard className="p-4">
            <p className="text-sm mb-1" style={{ color: "#888" }}>Local Only</p>
            <p className="text-3xl font-bold" style={{ color: "#4a90e2" }}>{stats.local_only}</p>
          </NeuroCard>

          <NeuroCard className="p-4">
            <p className="text-sm mb-1" style={{ color: "#888" }}>Hidden by Filters</p>
            <p className="text-3xl font-bold" style={{ color: "#fa8c16" }}>{stats.filtered_out}</p>
          </NeuroCard>
        </div>

        {/* Last Sync Result */}
        {lastSyncResult && (
          <NeuroCard className="mb-6 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-1" style={{ color: "#00A86B" }} />
              <div className="flex-1">
                <p className="font-bold mb-2" style={{ color: "#666" }}>
                  Last Sync Result
                </p>
                <p style={{ color: "#888" }}>
                  Imported <span className="font-bold">{lastSyncResult.created}</span> new events and 
                  updated <span className="font-bold">{lastSyncResult.updated}</span> existing events from Google.
                  Total: <span className="font-bold">{lastSyncResult.total}</span>
                </p>
                {lastSyncResult.sample_items && lastSyncResult.sample_items.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2" style={{ color: "#666" }}>Sample Items:</p>
                    <div className="space-y-1">
                      {lastSyncResult.sample_items.map((item, idx) => (
                        <div key={idx} className="text-sm ampvibe-inset p-2 rounded" style={{ color: "#888" }}>
                          {item.title} - {new Date(item.start).toLocaleString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </NeuroCard>
        )}

        {/* DB Verification */}
        {dbVerification && (
          <NeuroCard className="mb-6 p-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 mt-1" style={{ color: "#4a90e2" }} />
              <div>
                <p className="font-bold mb-2" style={{ color: "#666" }}>
                  Database Verification
                </p>
                <div className="space-y-1 text-sm" style={{ color: "#888" }}>
                  <p>Total activities in DB: <span className="font-bold">{dbVerification.total}</span></p>
                  <p>Google synced: <span className="font-bold">{dbVerification.google_synced}</span></p>
                  <p>Local only: <span className="font-bold">{dbVerification.local_only}</span></p>
                </div>
              </div>
            </div>
          </NeuroCard>
        )}

        {/* Filters */}
        <NeuroCard className="mb-6 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5" style={{ color: "#666" }} />
            <h2 className="font-bold" style={{ color: "#666" }}>Filters</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: "#888" }}>
                Date Range
              </label>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="ampvibe-input w-full"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: "#888" }}>
                Status
              </label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ampvibe-input w-full"
              >
                <option value="all">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: "#888" }}>
                Type
              </label>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="ampvibe-input w-full"
              >
                <option value="all">All Types</option>
                <option value="Meeting">Meeting</option>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Task">Task</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: "#888" }}>
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "#aaa" }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search activities..."
                  className="ampvibe-input w-full pl-10"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showGoogleOnly}
              onChange={(e) => setShowGoogleOnly(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: "#00A86B" }}
            />
            <span className="text-sm" style={{ color: "#666" }}>
              Show only Google-synced activities
            </span>
          </label>
        </NeuroCard>

        {/* Activities List */}
        <NeuroCard>
          <div className="p-6 border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
            <h2 className="font-bold" style={{ color: "#666" }}>
              Activities ({filteredActivities.length})
            </h2>
            {stats.filtered_out > 0 && (
              <p className="text-sm mt-1" style={{ color: "#fa8c16" }}>
                <AlertCircle className="w-4 h-4 inline mr-1" />
                {stats.filtered_out} items are hidden by filters
              </p>
            )}
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "#00A86B" }} />
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3" style={{ color: "#ddd" }} />
                <p style={{ color: "#aaa" }}>No activities found</p>
              </div>
            ) : (
              filteredActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium" style={{ color: "#666" }}>
                          {activity.subject}
                        </h3>
                        {activity.google_event_id && (
                          <span className="ampvibe-button px-2 py-0.5 text-xs" style={{ color: "#00A86B" }}>
                            Google Synced
                          </span>
                        )}
                        <span className="ampvibe-button px-2 py-0.5 text-xs">
                          {activity.activity_type}
                        </span>
                        <span className="ampvibe-button px-2 py-0.5 text-xs">
                          {activity.status}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: "#888" }}>
                        {activity.description?.substring(0, 100)}
                      </p>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "#aaa" }}>
                        <span>
                          {new Date(activity.activity_date).toLocaleString()}
                        </span>
                        {activity.all_day && <span>(All day)</span>}
                        {activity.duration_minutes && <span>{activity.duration_minutes} min</span>}
                        {activity.sync_error && (
                          <span className="text-red-500">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Sync error
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </NeuroCard>

        {/* Sync Logs */}
        <NeuroCard className="mt-6">
          <div className="p-6 border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
            <div className="flex items-center gap-3">
              <Bug className="w-5 h-5" style={{ color: "#666" }} />
              <h2 className="font-bold" style={{ color: "#666" }}>
                Sync Logs
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {syncLogs.length === 0 ? (
              <p className="text-center" style={{ color: "#aaa" }}>No sync logs yet</p>
            ) : (
              syncLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="ampvibe-inset p-3 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm" style={{ color: "#666" }}>
                        {log.sync_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                        log.status === 'success' ? 'bg-green-100 text-green-800' :
                        log.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: "#aaa" }}>
                      {new Date(log.created_date).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs space-y-1" style={{ color: "#888" }}>
                    <p>Created: {log.created_count} | Updated: {log.updated_count} | Total: {log.total_processed}</p>
                    {log.error_count > 0 && <p className="text-red-600">Errors: {log.error_count}</p>}
                    {log.duration_ms && <p>Duration: {log.duration_ms}ms</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </NeuroCard>
      </div>
    </div>
  );
}