import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Plus, Filter, Search, Mail, Phone, Calendar, FileText, 
  Edit, TrendingUp, Tag, User, Clock, ChevronDown, X, Pin
} from "lucide-react";
import moment from "moment";
import NeuroButton from "./NeuroButton";
import EmailActivityCard from "./timeline/EmailActivityCard";
import CallActivityCard from "./timeline/CallActivityCard";
import MeetingActivityCard from "./timeline/MeetingActivityCard";
import NoteActivityCard from "./timeline/NoteActivityCard";
import FieldChangeActivityCard from "./timeline/FieldChangeActivityCard";
import TaskActivityCard from "./timeline/TaskActivityCard";
import SystemActivityCard from "./timeline/SystemActivityCard";

export default function ActivityTimelinePanel({ 
  objectType, 
  objectId, 
  objectName,
  showQuickActions = true 
}) {
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    activityTypes: [],
    dateRange: "all",
    performedBy: "all",
    includeAssociated: true
  });
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [viewMode, setViewMode] = useState("chronological");

  // Fetch timeline activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['timeline', objectType, objectId, filters],
    queryFn: async () => {
      // Fetch direct activities
      const directActivities = await base44.entities.Activity_Timeline.filter({
        primary_object_type: objectType,
        primary_object_id: objectId
      });

      // Fetch associated activities if enabled
      let associatedActivities = [];
      if (filters.includeAssociated) {
        const associations = await base44.entities.Activity_Associations.filter({
          associated_object_type: objectType,
          associated_object_id: objectId
        });

        if (associations.length > 0) {
          const timelineIds = associations.map(a => a.timeline_id);
          const promises = timelineIds.map(id => 
            base44.entities.Activity_Timeline.filter({ id })
          );
          const results = await Promise.all(promises);
          associatedActivities = results.flat();
        }
      }

      // Combine and deduplicate
      const allActivities = [...directActivities, ...associatedActivities];
      const uniqueActivities = Array.from(
        new Map(allActivities.map(a => [a.id, a])).values()
      );

      // Sort by occurred_at or created_date
      return uniqueActivities.sort((a, b) => {
        const dateA = new Date(a.occurred_at || a.created_date);
        const dateB = new Date(b.occurred_at || b.created_date);
        return dateB - dateA;
      });
    }
  });

  // Pin/unpin activity
  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }) => 
      base44.entities.Activity_Timeline.update(id, { is_pinned: !isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeline']);
    }
  });

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        activity.activity_title?.toLowerCase().includes(searchLower) ||
        activity.activity_description?.toLowerCase().includes(searchLower) ||
        activity.performed_by_name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Activity type filter
    if (filters.activityTypes.length > 0) {
      if (!filters.activityTypes.includes(activity.activity_type)) return false;
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const activityDate = moment(activity.occurred_at || activity.created_date);
      const now = moment();
      
      switch (filters.dateRange) {
        case "today":
          if (!activityDate.isSame(now, 'day')) return false;
          break;
        case "week":
          if (!activityDate.isAfter(now.subtract(7, 'days'))) return false;
          break;
        case "month":
          if (!activityDate.isAfter(now.subtract(30, 'days'))) return false;
          break;
        case "quarter":
          if (!activityDate.isAfter(now.subtract(90, 'days'))) return false;
          break;
      }
    }

    return true;
  });

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = moment(activity.occurred_at || activity.created_date);
    let key;
    
    if (date.isSame(moment(), 'day')) {
      key = 'Today';
    } else if (date.isSame(moment().subtract(1, 'day'), 'day')) {
      key = 'Yesterday';
    } else if (date.isAfter(moment().subtract(7, 'days'))) {
      key = date.format('dddd'); // Day name
    } else {
      key = date.format('MMMM D, YYYY');
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(activity);
    return groups;
  }, {});

  // Separate pinned activities
  const pinnedActivities = filteredActivities.filter(a => a.is_pinned);
  const unpinnedGroups = Object.keys(groupedActivities).reduce((acc, key) => {
    acc[key] = groupedActivities[key].filter(a => !a.is_pinned);
    return acc;
  }, {});

  const renderActivityCard = (activity) => {
    const commonProps = {
      activity,
      onPin: () => pinMutation.mutate({ id: activity.id, isPinned: activity.is_pinned }),
      objectType,
      objectId
    };

    if (activity.activity_type.includes('Email')) {
      return <EmailActivityCard key={activity.id} {...commonProps} />;
    } else if (activity.activity_type.includes('Call')) {
      return <CallActivityCard key={activity.id} {...commonProps} />;
    } else if (activity.activity_type.includes('Meeting')) {
      return <MeetingActivityCard key={activity.id} {...commonProps} />;
    } else if (activity.activity_type === 'Note Added') {
      return <NoteActivityCard key={activity.id} {...commonProps} />;
    } else if (activity.activity_type === 'Task Created' || activity.activity_type === 'Task Completed') {
      return <TaskActivityCard key={activity.id} {...commonProps} />;
    } else if (
      activity.activity_type === 'Field Updated' || 
      activity.activity_type === 'Status Changed' || 
      activity.activity_type === 'Stage Changed'
    ) {
      return <FieldChangeActivityCard key={activity.id} {...commonProps} />;
    } else {
      return <SystemActivityCard key={activity.id} {...commonProps} />;
    }
  };

  if (isLoading) {
    return (
      <div className="ampvibe-card p-6">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Loading activity timeline...
        </div>
      </div>
    );
  }

  return (
    <div className="ampvibe-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold" style={{ color: "#666" }}>
          Activity Timeline ({filteredActivities.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ampvibe-button px-3 py-2 ${showFilters ? 'active' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          {showQuickActions && (
            <div className="relative">
              <NeuroButton 
                variant="primary"
                onClick={() => setShowQuickLog(!showQuickLog)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Activity
              </NeuroButton>
              {showQuickLog && (
                <div className="absolute right-0 top-full mt-2 ampvibe-card p-2 shadow-lg z-50 min-w-[200px]">
                  <button
                    onClick={() => {/* TODO: Open email modal */}}
                    className="ampvibe-button w-full px-4 py-2 mb-2 text-left"
                  >
                    <Mail className="w-4 h-4 mr-2 inline" />
                    Log Email
                  </button>
                  <button
                    onClick={() => {/* TODO: Open call modal */}}
                    className="ampvibe-button w-full px-4 py-2 mb-2 text-left"
                  >
                    <Phone className="w-4 h-4 mr-2 inline" />
                    Log Call
                  </button>
                  <button
                    onClick={() => {/* TODO: Open meeting modal */}}
                    className="ampvibe-button w-full px-4 py-2 mb-2 text-left"
                  >
                    <Calendar className="w-4 h-4 mr-2 inline" />
                    Log Meeting
                  </button>
                  <button
                    onClick={() => {/* TODO: Open note modal */}}
                    className="ampvibe-button w-full px-4 py-2 text-left"
                  >
                    <FileText className="w-4 h-4 mr-2 inline" />
                    Add Note
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="ampvibe-inset p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm mb-2 block" style={{ color: "#888" }}>
                Activity Types
              </label>
              <select
                multiple
                className="ampvibe-input w-full"
                value={filters.activityTypes}
                onChange={(e) => setFilters({
                  ...filters,
                  activityTypes: Array.from(e.target.selectedOptions, opt => opt.value)
                })}
              >
                <option value="Email Sent">Email Sent</option>
                <option value="Email Received">Email Received</option>
                <option value="Call Logged">Call Logged</option>
                <option value="Meeting Completed">Meeting Completed</option>
                <option value="Note Added">Note Added</option>
                <option value="Task Created">Task Created</option>
                <option value="Field Updated">Field Updated</option>
              </select>
            </div>
            <div>
              <label className="text-sm mb-2 block" style={{ color: "#888" }}>
                Date Range
              </label>
              <select
                className="ampvibe-input w-full"
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
              </select>
            </div>
            <div>
              <label className="text-sm mb-2 block" style={{ color: "#888" }}>
                Include Associated
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.includeAssociated}
                  onChange={(e) => setFilters({ ...filters, includeAssociated: e.target.checked })}
                  className="mr-2"
                  style={{ accentColor: "#00A86B" }}
                />
                <span className="text-sm" style={{ color: "#666" }}>
                  Show activities from related records
                </span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({
                activityTypes: [],
                dateRange: "all",
                performedBy: "all",
                includeAssociated: true
              })}
              className="ampvibe-button px-3 py-2"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
        <input
          type="text"
          placeholder="Search timeline..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ampvibe-input w-full pl-10"
        />
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {/* Pinned Activities */}
        {pinnedActivities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-4 h-4" style={{ color: "#fa8c16" }} />
              <h4 className="font-semibold text-sm" style={{ color: "#fa8c16" }}>
                PINNED
              </h4>
            </div>
            <div className="space-y-3">
              {pinnedActivities.map(renderActivityCard)}
            </div>
            <div className="border-t my-6" style={{ borderColor: "#e0e0e0" }} />
          </div>
        )}

        {/* Grouped Activities */}
        {Object.keys(unpinnedGroups).length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: "#ccc" }} />
            <p style={{ color: "#888" }}>No activities yet</p>
          </div>
        ) : (
          Object.keys(unpinnedGroups).map((dateKey) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1" style={{ backgroundColor: "#e0e0e0" }} />
                <span className="text-sm font-semibold px-3" style={{ color: "#888" }}>
                  {dateKey}
                </span>
                <div className="h-px flex-1" style={{ backgroundColor: "#e0e0e0" }} />
              </div>
              <div className="space-y-3">
                {unpinnedGroups[dateKey].map(renderActivityCard)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}