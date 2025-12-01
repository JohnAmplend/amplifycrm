import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, CheckSquare, Clock, AlertCircle, Calendar, User, X, Edit2, Trash2 } from "lucide-react";
import NeuroButton from "./NeuroButton";
import moment from "moment";

export default function TaskManager({ relatedToType, relatedToId, relatedToName }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    task_name: '',
    description: '',
    due_date: '',
    priority: 'Medium',
    status: 'Not Started',
    assigned_to: ''
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', relatedToType, relatedToId],
    queryFn: () => base44.entities.Task.filter({
      related_to_type: relatedToType,
      related_to_id: relatedToId
    }).then(tasks => tasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)))
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    }
  });

  const resetForm = () => {
    setFormData({
      task_name: '',
      description: '',
      due_date: '',
      priority: 'Medium',
      status: 'Not Started',
      assigned_to: ''
    });
    setShowForm(false);
    setEditingTask(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const taskData = {
      ...formData,
      related_to_type: relatedToType,
      related_to_id: relatedToId,
      assigned_to: formData.assigned_to || currentUser?.email
    };

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: taskData });
    } else {
      createMutation.mutate(taskData);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      task_name: task.task_name,
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority,
      status: task.status,
      assigned_to: task.assigned_to || ''
    });
    setShowForm(true);
  };

  const handleStatusChange = (task, newStatus) => {
    updateMutation.mutate({
      id: task.id,
      data: { ...task, status: newStatus }
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#52c41a';
      default: return '#888';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#52c41a';
      case 'In Progress': return '#4a90e2';
      case 'Deferred': return '#888';
      default: return '#f59e0b';
    }
  };

  const isOverdue = (dueDate) => {
    return dueDate && new Date(dueDate) < new Date() && moment(dueDate).format('YYYY-MM-DD') !== moment().format('YYYY-MM-DD');
  };

  return (
    <div className="ampvibe-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold" style={{ color: "#666" }}>
          Tasks ({tasks.length})
        </h3>
        <NeuroButton onClick={() => setShowForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </NeuroButton>
      </div>

      {/* Task Form */}
      {showForm && (
        <div className="ampvibe-inset p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold" style={{ color: "#666" }}>
              {editingTask ? 'Edit Task' : 'New Task'}
            </h4>
            <button onClick={resetForm}>
              <X className="w-5 h-5" style={{ color: "#888" }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Task name *"
                value={formData.task_name}
                onChange={(e) => setFormData({...formData, task_name: e.target.value})}
                className="ampvibe-input w-full"
                required
              />
            </div>

            <div>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="ampvibe-input w-full h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="ampvibe-input w-full"
                />
              </div>

              <div>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="ampvibe-input w-full"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="ampvibe-input w-full"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Deferred">Deferred</option>
                </select>
              </div>

              <div>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                  className="ampvibe-input w-full"
                >
                  <option value="">Assign to me</option>
                  {users.map(user => (
                    <option key={user.email} value={user.email}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <NeuroButton type="button" onClick={resetForm}>
                Cancel
              </NeuroButton>
              <NeuroButton type="submit" variant="primary">
                {editingTask ? 'Update Task' : 'Create Task'}
              </NeuroButton>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      {isLoading ? (
        <div className="text-center py-8" style={{ color: "#aaa" }}>
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckSquare className="w-12 h-12 mx-auto mb-3" style={{ color: "#ccc" }} />
          <p style={{ color: "#888" }}>No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task.id}
              className="ampvibe-inset p-4 rounded-lg"
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => handleStatusChange(
                    task, 
                    task.status === 'Completed' ? 'Not Started' : 'Completed'
                  )}
                  className="mt-1"
                >
                  {task.status === 'Completed' ? (
                    <CheckSquare className="w-5 h-5" style={{ color: "#52c41a" }} />
                  ) : (
                    <div className="w-5 h-5 border-2 rounded" style={{ borderColor: "#ccc" }} />
                  )}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <p 
                    className={`font-medium mb-1 ${task.status === 'Completed' ? 'line-through' : ''}`}
                    style={{ color: "#666" }}
                  >
                    {task.task_name}
                  </p>
                  
                  {task.description && (
                    <p className="text-sm mb-2" style={{ color: "#888" }}>
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Due Date */}
                    {task.due_date && (
                      <span 
                        className="flex items-center gap-1 px-2 py-1 rounded"
                        style={{
                          backgroundColor: isOverdue(task.due_date) && task.status !== 'Completed' ? '#fef2f2' : '#f3f4f6',
                          color: isOverdue(task.due_date) && task.status !== 'Completed' ? '#ef4444' : '#666'
                        }}
                      >
                        <Clock className="w-3 h-3" />
                        {moment(task.due_date).format('MMM D')}
                        {isOverdue(task.due_date) && task.status !== 'Completed' && ' (Overdue)'}
                      </span>
                    )}

                    {/* Priority */}
                    <span 
                      className="flex items-center gap-1 px-2 py-1 rounded"
                      style={{
                        backgroundColor: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority)
                      }}
                    >
                      <AlertCircle className="w-3 h-3" />
                      {task.priority}
                    </span>

                    {/* Status */}
                    <span 
                      className="flex items-center gap-1 px-2 py-1 rounded"
                      style={{
                        backgroundColor: `${getStatusColor(task.status)}20`,
                        color: getStatusColor(task.status)
                      }}
                    >
                      {task.status}
                    </span>

                    {/* Assignee */}
                    {task.assigned_to && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100" style={{ color: "#666" }}>
                        <User className="w-3 h-3" />
                        {users.find(u => u.email === task.assigned_to)?.full_name || task.assigned_to}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(task)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" style={{ color: "#888" }} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this task?')) {
                        deleteMutation.mutate(task.id);
                      }
                    }}
                    className="p-2 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}