import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, TrendingUp, Edit2, Trash2 } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function Goals() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    goal_name: "",
    goal_type: "Revenue",
    target_value: "",
    time_period: "Monthly",
    assigned_to: "",
    start_date: "",
    end_date: "",
    is_active: true
  });

  React.useEffect(() => {
    base44.auth.me().then((user) => {
      setCurrentUser(user);
      setFormData(prev => ({ ...prev, assigned_to: user.email }));
    }).catch(() => {});
  }, []);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goals.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingGoal) {
        return base44.entities.Goals.update(editingGoal.id, data);
      } else {
        return base44.entities.Goals.create({
          ...data,
          created_by: currentUser?.email,
          current_value: 0
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setShowForm(false);
      setEditingGoal(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Goals.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
    }
  });

  const resetForm = () => {
    setFormData({
      goal_name: "",
      goal_type: "Revenue",
      target_value: "",
      time_period: "Monthly",
      assigned_to: currentUser?.email || "",
      start_date: "",
      end_date: "",
      is_active: true
    });
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      goal_name: goal.goal_name,
      goal_type: goal.goal_type,
      target_value: goal.target_value,
      time_period: goal.time_period,
      assigned_to: goal.assigned_to || "",
      start_date: goal.start_date || "",
      end_date: goal.end_date || "",
      is_active: goal.is_active !== false
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const calculateProgress = (goal) => {
    if (!goal.target_value) return 0;
    return Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Goals
            </h1>
            <p style={{ color: "#888" }}>Track team and individual performance</p>
          </div>
          <NeuroButton 
            variant="primary" 
            onClick={() => { 
              setShowForm(true); 
              setEditingGoal(null);
              resetForm();
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Goal
          </NeuroButton>
        </div>

        {showForm && (
          <NeuroCard className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              {editingGoal ? 'Edit Goal' : 'New Goal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <NeuroInput
                label="Goal Name"
                value={formData.goal_name}
                onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
                placeholder="e.g., Q4 Revenue Target"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <NeuroSelect
                  label="Goal Type"
                  value={formData.goal_type}
                  onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                  options={[
                    { value: 'Revenue', label: 'Revenue' },
                    { value: 'Deals Closed', label: 'Deals Closed' },
                    { value: 'Contacts Created', label: 'Contacts Created' },
                    { value: 'Calls Made', label: 'Calls Made' },
                    { value: 'Emails Sent', label: 'Emails Sent' },
                    { value: 'Tickets Resolved', label: 'Tickets Resolved' },
                    { value: 'Custom Metric', label: 'Custom Metric' }
                  ]}
                  required
                />
                <NeuroInput
                  label="Target Value"
                  type="number"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <NeuroSelect
                  label="Time Period"
                  value={formData.time_period}
                  onChange={(e) => setFormData({ ...formData, time_period: e.target.value })}
                  options={[
                    { value: 'Daily', label: 'Daily' },
                    { value: 'Weekly', label: 'Weekly' },
                    { value: 'Monthly', label: 'Monthly' },
                    { value: 'Quarterly', label: 'Quarterly' },
                    { value: 'Yearly', label: 'Yearly' }
                  ]}
                  required
                />
                <NeuroInput
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
                <NeuroInput
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <NeuroSelect
                label="Assigned To"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                options={[
                  { value: '', label: 'Team-wide Goal' },
                  ...users.map(u => ({ value: u.email, label: u.full_name || u.email }))
                ]}
              />
              <div className="flex justify-end gap-3">
                <NeuroButton 
                  type="button" 
                  onClick={() => { 
                    setShowForm(false); 
                    setEditingGoal(null);
                    resetForm();
                  }}
                >
                  Cancel
                </NeuroButton>
                <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading ? 'Saving...' : editingGoal ? 'Update' : 'Create'} Goal
                </NeuroButton>
              </div>
            </form>
          </NeuroCard>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12" style={{ color: "#aaa" }}>
              Loading goals...
            </div>
          ) : goals.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Target className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No goals yet</p>
              <NeuroButton onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </NeuroButton>
            </div>
          ) : (
            goals.map((goal) => {
              const progress = calculateProgress(goal);
              return (
                <NeuroCard key={goal.id} className="hover:shadow-xl transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="ampvibe-inset p-3 rounded-lg">
                          <Target className="w-6 h-6" style={{ color: "#4a90e2" }} />
                        </div>
                        <div>
                          <h3 className="font-bold" style={{ color: "#666" }}>
                            {goal.goal_name}
                          </h3>
                          <p className="text-xs" style={{ color: "#888" }}>
                            {goal.goal_type}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm" style={{ color: "#888" }}>Progress</span>
                        <span className="font-bold" style={{ color: "#666" }}>
                          {progress}%
                        </span>
                      </div>
                      <div className="ampvibe-inset rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${progress}%`,
                            background: progress >= 100 ? 'linear-gradient(90deg, #52c41a, #73d13d)' :
                                      progress >= 75 ? 'linear-gradient(90deg, #4a90e2, #1890ff)' :
                                      progress >= 50 ? 'linear-gradient(90deg, #fa8c16, #ffa940)' :
                                      'linear-gradient(90deg, #f5222d, #ff4d4f)'
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs" style={{ color: "#aaa" }}>
                        <span>{goal.current_value || 0}</span>
                        <span>{goal.target_value}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <span className="ampvibe-button px-2 py-1 text-xs">
                        {goal.time_period}
                      </span>
                      {goal.assigned_to && (
                        <span className="ampvibe-button px-2 py-1 text-xs">
                          {users.find(u => u.email === goal.assigned_to)?.full_name || goal.assigned_to}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                      <NeuroButton
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(goal)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </NeuroButton>
                      <NeuroButton
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Delete ${goal.goal_name}?`)) {
                            deleteMutation.mutate(goal.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </NeuroButton>
                    </div>
                  </div>
                </NeuroCard>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}