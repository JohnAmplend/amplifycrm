import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, CheckSquare, Square, X, UserPlus, Users } from "lucide-react";
import { toast } from "../components/crm/useToast";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function Tasks() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    task_name: "",
    description: "",
    due_date: "",
    priority: "Medium",
    status: "Not Started",
    assigned_to: "",
    collaborators: [],
    related_to_type: "",
    related_to_id: ""
  });
  const [showCollaborators, setShowCollaborators] = useState({});

  useEffect(() => {
    base44.auth.me().then((user) => {
      setCurrentUser(user);
      setFormData(prev => ({ ...prev, assigned_to: user.email }));
    }).catch(() => {});
  }, []);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task created successfully');
      setShowForm(false);
      setFormData({
        task_name: "",
        description: "",
        due_date: "",
        priority: "Medium",
        status: "Not Started",
        assigned_to: currentUser?.email || "",
        collaborators: [],
        related_to_type: "",
        related_to_id: ""
      });
    },
    onError: (err) => {
      toast.error('Failed to create task: ' + err.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task updated successfully');
    },
    onError: (err) => {
      toast.error('Failed to update task: ' + err.message);
    }
  });

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'Completed' ? 'Not Started' : 'Completed';
    const updateData = {
      status: newStatus,
      ...(newStatus === 'Completed' ? {
        completed_at: new Date().toISOString(),
        completed_by: currentUser?.email
      } : {
        completed_at: null,
        completed_by: null
      })
    };
    updateMutation.mutate({ id: task.id, data: updateData });
  };

  const handleAddCollaborator = (taskId, userEmail) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const currentCollaborators = task.collaborators || [];
    if (currentCollaborators.includes(userEmail)) {
      toast.error('User is already a collaborator');
      return;
    }
    
    updateMutation.mutate({
      id: taskId,
      data: { collaborators: [...currentCollaborators, userEmail] }
    });
    setShowCollaborators(prev => ({ ...prev, [taskId]: false }));
  };

  const handleRemoveCollaborator = (taskId, userEmail) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const currentCollaborators = task.collaborators || [];
    updateMutation.mutate({
      id: taskId,
      data: { collaborators: currentCollaborators.filter(c => c !== userEmail) }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: formData });
      setEditingTask(null);
      setShowForm(false);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setFormData({
      task_name: task.task_name || "",
      description: task.description || "",
      due_date: task.due_date || "",
      priority: task.priority || "Medium",
      status: task.status || "Not Started",
      assigned_to: task.assigned_to || "",
      collaborators: task.collaborators || [],
      related_to_type: task.related_to_type || "",
      related_to_id: task.related_to_id || ""
    });
    setShowForm(true);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.task_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    const matchesAssignee = !filterAssignee || task.assigned_to === filterAssignee;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  if (showForm) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <NeuroCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                {editingTask ? 'Edit Task' : 'New Task'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="neuro-button p-2"
              >
                <X className="w-5 h-5" style={{ color: "#888" }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <NeuroInput
                    label="Task Name"
                    value={formData.task_name}
                    onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium" style={{ color: "#666" }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="neuro-input w-full min-h-[100px]"
                    placeholder="Task details..."
                  />
                </div>
                <NeuroInput
                  label="Due Date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
                <NeuroSelect
                  label="Priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  options={[
                    { value: 'Low', label: 'Low' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High', label: 'High' }
                  ]}
                />
                <NeuroSelect
                  label="Assigned To"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  options={users.map(u => ({ value: u.email, label: u.full_name || u.email }))}
                />
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium" style={{ color: "#666" }}>
                    Collaborators
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.collaborators.map((email) => (
                      <span key={email} className="neuro-button px-3 py-1 text-xs flex items-center gap-2">
                        {users.find(u => u.email === email)?.full_name || email}
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            collaborators: formData.collaborators.filter(c => c !== email)
                          })}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <select
                    className="neuro-input w-full"
                    onChange={(e) => {
                      if (e.target.value && !formData.collaborators.includes(e.target.value)) {
                        setFormData({
                          ...formData,
                          collaborators: [...formData.collaborators, e.target.value]
                        });
                      }
                      e.target.value = '';
                    }}
                    value=""
                  >
                    <option value="">Add collaborator...</option>
                    {users
                      .filter(u => u.email !== formData.assigned_to && !formData.collaborators.includes(u.email))
                      .map(u => (
                        <option key={u.email} value={u.email}>
                          {u.full_name || u.email}
                        </option>
                      ))}
                  </select>
                </div>
                <NeuroSelect
                  label="Related To Type"
                  value={formData.related_to_type}
                  onChange={(e) => setFormData({ ...formData, related_to_type: e.target.value })}
                  options={[
                    { value: 'Contact', label: 'Contact' },
                    { value: 'Company', label: 'Company' },
                    { value: 'Deal', label: 'Deal' },
                    { value: 'Lead', label: 'Lead' }
                  ]}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <NeuroButton type="button" onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                }}>
                  Cancel
                </NeuroButton>
                <NeuroButton type="submit" variant="primary">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </NeuroButton>
              </div>
            </form>
          </NeuroCard>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Tasks
            </h1>
            <p style={{ color: "#888" }}>
              {filteredTasks.length} total tasks • {filteredTasks.filter(t => t.status !== 'Completed').length} active
            </p>
          </div>
          <NeuroButton variant="primary" onClick={() => {
            setEditingTask(null);
            setFormData({
              task_name: "",
              description: "",
              due_date: "",
              priority: "Medium",
              status: "Not Started",
              assigned_to: currentUser?.email || "",
              collaborators: [],
              related_to_type: "",
              related_to_id: ""
            });
            setShowForm(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </NeuroButton>
        </div>

        <NeuroCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neuro-input w-full pl-12"
              />
            </div>
            <NeuroSelect
              placeholder="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'Not Started', label: 'Not Started' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Deferred', label: 'Deferred' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by priority"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by assignee"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              options={users.map(u => ({ value: u.email, label: u.full_name || u.email }))}
            />
          </div>
        </NeuroCard>

        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: "#aaa" }}>No tasks found</p>
              <NeuroButton onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Task
              </NeuroButton>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="neuro-inset p-4 rounded-lg flex items-start gap-4 cursor-pointer hover:scale-[1.01] transition-transform"
                  onDoubleClick={() => handleEditTask(task)}
                >
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(task);
                      }}
                      className="neuro-button p-2"
                      title={task.status === 'Completed' ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {task.status === 'Completed' ? (
                        <CheckSquare className="w-5 h-5" style={{ color: "#52c41a" }} />
                      ) : (
                        <Square className="w-5 h-5" style={{ color: "#888" }} />
                      )}
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCollaborators(prev => ({ ...prev, [task.id]: !prev[task.id] }));
                        }}
                        className="neuro-button p-2"
                        title="Manage collaborators"
                      >
                        <UserPlus className="w-5 h-5" style={{ color: "#888" }} />
                      </button>
                      {showCollaborators[task.id] && (
                        <div className="absolute left-0 top-full mt-2 ampvibe-card p-3 shadow-lg z-10 w-64">
                          <p className="text-xs font-semibold mb-2" style={{ color: "#666" }}>
                            Add Collaborator
                          </p>
                          <select
                            className="neuro-input w-full text-sm mb-2"
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.value) {
                                handleAddCollaborator(task.id, e.target.value);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            value=""
                          >
                            <option value="">Select user...</option>
                            {users
                              .filter(u => 
                                u.email !== task.assigned_to && 
                                !(task.collaborators || []).includes(u.email)
                              )
                              .map(u => (
                                <option key={u.email} value={u.email}>
                                  {u.full_name || u.email}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-bold mb-1 ${
                        task.status === 'Completed' ? 'line-through' : ''
                      }`}
                      style={{ color: "#666" }}
                    >
                      {task.task_name}
                    </h3>
                    {task.description && (
                      <p className="text-sm mb-2" style={{ color: "#888" }}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className={`neuro-button px-2 py-1 ${
                        task.priority === 'High' ? 'text-red-600' :
                        task.priority === 'Medium' ? 'text-orange-600' : ''
                      }`}>
                        {task.priority}
                      </span>
                      <span className="neuro-button px-2 py-1">
                        {task.status}
                      </span>
                      {task.due_date && (
                        <span style={{ color: "#aaa" }}>
                          Due: {new Date(task.due_date).toLocaleString()}
                        </span>
                      )}
                      {task.assigned_to && (
                        <span style={{ color: "#aaa" }}>
                          Assigned: {users.find(u => u.email === task.assigned_to)?.full_name || task.assigned_to}
                        </span>
                      )}
                      {task.collaborators && task.collaborators.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" style={{ color: "#888" }} />
                          <span style={{ color: "#888" }}>
                            {task.collaborators.length} collaborator{task.collaborators.length > 1 ? 's' : ''}:
                          </span>
                          {task.collaborators.map(email => (
                            <span key={email} className="neuro-button px-2 py-1 flex items-center gap-1">
                              {users.find(u => u.email === email)?.full_name || email}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCollaborator(task.id, email);
                                }}
                                className="hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {task.related_to_type && (
                        <span className="neuro-button px-2 py-1">
                          {task.related_to_type}
                        </span>
                      )}
                      {task.status === 'Completed' && task.completed_at && (
                        <span style={{ color: "#52c41a" }} className="text-xs">
                          ✓ Completed {new Date(task.completed_at).toLocaleDateString()}
                          {task.completed_by && ` by ${users.find(u => u.email === task.completed_by)?.full_name || task.completed_by}`}
                        </span>
                      )}
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