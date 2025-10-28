import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Phone, Mail, Users as MeetingIcon, FileText, CheckSquare } from "lucide-react";
import NeuroCard from "./NeuroCard";
import NeuroButton from "./NeuroButton";
import NeuroInput from "./NeuroInput";
import NeuroSelect from "./NeuroSelect";

export default function ActivityTimeline({ activities = [], relatedType, relatedId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: "Note",
    subject: "",
    description: "",
    activity_date: new Date().toISOString().slice(0, 16),
    duration_minutes: 30,
    status: "Completed"
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      setShowForm(false);
      setFormData({
        activity_type: "Note",
        subject: "",
        description: "",
        activity_date: new Date().toISOString().slice(0, 16),
        duration_minutes: 30,
        status: "Completed"
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const activityData = {
      ...formData,
      [`${relatedType.toLowerCase()}_id`]: relatedId
    };
    createMutation.mutate(activityData);
  };

  const getActivityIcon = (type) => {
    const icons = {
      Call: Phone,
      Email: Mail,
      Meeting: MeetingIcon,
      Note: FileText,
      Task: CheckSquare
    };
    const Icon = icons[type] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <NeuroCard>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: "#666" }}>
          Activity Timeline ({activities.length})
        </h2>
        <NeuroButton size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Log Activity
        </NeuroButton>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 neuro-inset p-4 rounded-lg space-y-4">
          <NeuroSelect
            label="Activity Type"
            value={formData.activity_type}
            onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
            options={[
              { value: 'Call', label: 'Call' },
              { value: 'Email', label: 'Email' },
              { value: 'Meeting', label: 'Meeting' },
              { value: 'Note', label: 'Note' },
              { value: 'Task', label: 'Task' }
            ]}
            required
          />
          <NeuroInput
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: "#666" }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="neuro-input w-full min-h-[100px]"
              placeholder="Add details..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NeuroInput
              label="Date & Time"
              type="datetime-local"
              value={formData.activity_date}
              onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
            />
            <NeuroInput
              label="Duration (minutes)"
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <NeuroButton type="button" onClick={() => setShowForm(false)}>
              Cancel
            </NeuroButton>
            <NeuroButton type="submit" variant="primary">
              Save Activity
            </NeuroButton>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-center py-8" style={{ color: "#aaa" }}>
            No activities logged yet
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="neuro-inset p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="neuro-button p-2 rounded-lg">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold" style={{ color: "#666" }}>
                      {activity.subject}
                    </span>
                    <span className="neuro-button px-2 py-0.5 text-xs">
                      {activity.activity_type}
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: "#888" }}>
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "#aaa" }}>
                    <span>
                      {new Date(activity.activity_date || activity.created_date).toLocaleString()}
                    </span>
                    {activity.duration_minutes && (
                      <span>{activity.duration_minutes} min</span>
                    )}
                    <span className="neuro-button px-2 py-0.5 text-xs">
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </NeuroCard>
  );
}