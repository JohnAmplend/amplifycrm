import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Phone, Mail, Users as MeetingIcon, FileText, CheckSquare, Plus } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";
import ActivityForm from "../components/crm/ActivityForm";
import ActivityDetail from "../components/crm/ActivityDetail";
import LoadingState from "../components/crm/LoadingState";
import EmptyState from "../components/crm/EmptyState";
import { toast } from "../components/crm/useToast";
import { Activity as ActivityIcon } from "lucide-react";

export default function Activities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-activity_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const getActivityIcon = (type) => {
    const icons = {
      Call: Phone,
      Email: Mail,
      Meeting: MeetingIcon,
      Note: FileText,
      Task: CheckSquare
    };
    const Icon = icons[type] || FileText;
    return Icon;
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Activity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      toast.success('Activity deleted successfully');
      setSelectedActivity(null);
    },
    onError: (err) => {
      toast.error('Failed to delete activity: ' + err.message);
    }
  });

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || activity.activity_type === filterType;
    const matchesStatus = !filterStatus || activity.status === filterStatus;
    const matchesUser = !filterUser || activity.created_by === filterUser;
    const matchesDirection = !filterDirection || activity.direction === filterDirection;
    
    return matchesSearch && matchesType && matchesStatus && matchesUser && matchesDirection;
  });

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setSelectedActivity(null);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries(['activities']);
    setShowForm(false);
    setEditingActivity(null);
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Activities
            </h1>
            <p style={{ color: "#888" }}>{filteredActivities.length} total activities</p>
          </div>
          <NeuroButton variant="primary" onClick={() => { setEditingActivity(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Log Activity
          </NeuroButton>
        </div>

        <NeuroCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neuro-input w-full pl-12"
              />
            </div>
            <NeuroSelect
              placeholder="Filter by type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'Call', label: 'Call' },
                { value: 'Email', label: 'Email' },
                { value: 'Meeting', label: 'Meeting' },
                { value: 'Note', label: 'Note' },
                { value: 'Task', label: 'Task' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by direction"
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
              options={[
                { value: 'Inbound', label: 'Inbound' },
                { value: 'Outbound', label: 'Outbound' },
                { value: 'Internal', label: 'Internal' },
                { value: 'N/A', label: 'N/A' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'Completed', label: 'Completed' },
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'Cancelled', label: 'Cancelled' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by user"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              options={users.map(u => ({ value: u.email, label: u.full_name || u.email }))}
            />
          </div>
        </NeuroCard>

        <NeuroCard>
          {isLoading ? (
            <LoadingState message="Loading activities..." />
          ) : filteredActivities.length === 0 ? (
            <EmptyState
              icon={ActivityIcon}
              title="No activities yet"
              message="Get started by logging your first activity"
              actionLabel="Log Activity"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(0, 0, 0, 0.06)" }}>
              {filteredActivities.map((activity) => {
                const Icon = getActivityIcon(activity.activity_type);
                return (
                  <div 
                    key={activity.id} 
                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleActivityClick(activity)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="neuro-button p-3 rounded-lg">
                        <Icon className="w-5 h-5" style={{ color: "#666" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-lg mb-1" style={{ color: "#666" }}>
                              {activity.subject}
                            </h3>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="neuro-button px-2 py-1 text-xs">
                                {activity.activity_type}
                              </span>
                              {activity.direction && activity.direction !== 'N/A' && (
                                <span 
                                  className="px-2 py-1 text-xs rounded-lg font-medium"
                                  style={{
                                    background: activity.direction === 'Inbound' ? '#e3f2fd' : 
                                               activity.direction === 'Outbound' ? '#fff3e0' : '#f3e5f5',
                                    color: activity.direction === 'Inbound' ? '#1976d2' : 
                                           activity.direction === 'Outbound' ? '#e65100' : '#7b1fa2'
                                  }}
                                >
                                  {activity.direction}
                                </span>
                              )}
                              <span className="neuro-button px-2 py-1 text-xs">
                                {activity.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm" style={{ color: "#888" }}>
                              {new Date(activity.activity_date || activity.created_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs" style={{ color: "#aaa" }}>
                              {new Date(activity.activity_date || activity.created_date).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        {activity.description && (
                          <p className="mb-3" style={{ color: "#888" }}>
                            {activity.description.replace(/<[^>]*>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').substring(0, 200)}
                            {activity.description.length > 200 ? '...' : ''}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm" style={{ color: "#aaa" }}>
                          {activity.duration_minutes && (
                            <span>Duration: {activity.duration_minutes} min</span>
                          )}
                          {activity.created_by && !activity.created_by.includes('service+7ecffa00') && (
                            <span>By: {users.find(u => u.email === activity.created_by)?.full_name || activity.created_by}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </NeuroCard>

        {showForm && (
          <ActivityForm
            activity={editingActivity}
            onClose={() => { setShowForm(false); setEditingActivity(null); }}
            onSuccess={handleFormSuccess}
          />
        )}

        {selectedActivity && (
          <ActivityDetail
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
            onEdit={() => handleEdit(selectedActivity)}
            onDelete={() => handleDelete(selectedActivity.id)}
            onAddNew={() => { setSelectedActivity(null); setEditingActivity(null); setShowForm(true); }}
          />
        )}
      </div>
    </div>
  );
}