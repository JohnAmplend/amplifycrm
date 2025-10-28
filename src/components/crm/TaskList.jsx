import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tantml:react-query";
import { Plus, CheckSquare, Square } from "lucide-react";
import NeuroCard from "./NeuroCard";
import NeuroButton from "./NeuroButton";

export default function TaskList({ tasks = [], relatedType, relatedId }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    }
  });

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'Completed' ? 'Not Started' : 'Completed';
    updateMutation.mutate({ id: task.id, data: { status: newStatus } });
  };

  return (
    <NeuroCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold" style={{ color: "#666" }}>
          Tasks ({tasks.length})
        </h3>
        <NeuroButton size="sm">
          <Plus className="w-3 h-3" />
        </NeuroButton>
      </div>
      
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-center py-4 text-sm" style={{ color: "#aaa" }}>
            No tasks
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="neuro-inset p-3 rounded-lg flex items-start gap-3"
            >
              <button
                onClick={() => handleToggleComplete(task)}
                className="neuro-button p-1 mt-0.5"
              >
                {task.status === 'Completed' ? (
                  <CheckSquare className="w-4 h-4" style={{ color: "#52c41a" }} />
                ) : (
                  <Square className="w-4 h-4" style={{ color: "#888" }} />
                )}
              </button>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium mb-1 ${
                    task.status === 'Completed' ? 'line-through' : ''
                  }`}
                  style={{ color: "#666" }}
                >
                  {task.task_name}
                </p>
                {task.due_date && (
                  <p className="text-xs" style={{ color: "#aaa" }}>
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </p>
                )}
                {task.priority && (
                  <span className={`neuro-button px-2 py-0.5 text-xs mt-1 inline-block ${
                    task.priority === 'High' ? 'text-red-600' :
                    task.priority === 'Medium' ? 'text-orange-600' : ''
                  }`}>
                    {task.priority}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </NeuroCard>
  );
}