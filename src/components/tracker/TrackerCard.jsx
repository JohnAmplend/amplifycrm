import React, { useState } from "react";
import { Calendar, MessageSquare, CheckSquare, MoreHorizontal, Trash2, Edit2, User, Plus, X, Paperclip } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const priorityColors = {
  Highest: { bg: "bg-red-500", text: "text-white" },
  High: { bg: "bg-orange-500", text: "text-white" },
  Medium: { bg: "bg-yellow-400", text: "text-yellow-900" },
  Low: { bg: "bg-blue-400", text: "text-white" }
};

const statusColors = {
  "To do": { bg: "bg-red-100", text: "text-red-600", border: "border-red-200" },
  "In progress": { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" },
  "Approved": { bg: "bg-green-100", text: "text-green-600", border: "border-green-200" },
  "Done": { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" }
};

export default function TrackerCard({ card, onEdit, onDelete, isDragging }) {
  const queryClient = useQueryClient();
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const priority = priorityColors[card.priority] || priorityColors.Medium;
  const status = statusColors[card.status] || statusColors["To do"];

  // Fetch user details if assigned
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!card.assigned_to
  });

  const assignedUser = users.find(u => u.email === card.assigned_to);

  // Fetch subtasks for this card
  const { data: subtasks = [] } = useQuery({
    queryKey: ['tracker-subtasks', card.id],
    queryFn: () => base44.entities.Tracker_Subtask.filter({ card_id: card.id })
  });

  const completedCount = subtasks.filter(st => st.completed).length;
  const totalCount = subtasks.length;

  // Subtask mutations
  const createSubtaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Tracker_Subtask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker-subtasks', card.id] });
      setNewSubtask("");
      setIsAddingSubtask(false);
    }
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tracker_Subtask.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-subtasks', card.id] })
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Tracker_Subtask.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-subtasks', card.id] })
  });

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    createSubtaskMutation.mutate({
      card_id: card.id,
      title: newSubtask,
      completed: false,
      position: subtasks.length
    });
  };

  const handleToggleSubtask = (subtask) => {
    updateSubtaskMutation.mutate({
      id: subtask.id,
      data: { completed: !subtask.completed }
    });
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-2 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? "shadow-lg scale-105 rotate-2" : "hover:shadow-md"
      }`}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit(card);
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-gray-800 text-sm leading-tight flex-1">
          {card.title}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(card)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(card.id)} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dates and Subtask Count */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        {(card.start_date || card.end_date) && (
          <>
            <Calendar className="w-3 h-3" />
            <span>
              {card.start_date && format(new Date(card.start_date), "MMM d")}
              {card.start_date && card.end_date && " - "}
              {card.end_date && format(new Date(card.end_date), "MMM d")}
            </span>
          </>
        )}
        {totalCount > 0 && (
          <>
            {(card.start_date || card.end_date) && <span className="mx-1">•</span>}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowSubtasks(!showSubtasks);
              }}
              className="flex items-center gap-1 hover:text-gray-700"
            >
              <CheckSquare className="w-3 h-3" />
              <span>{completedCount}/{totalCount}</span>
            </button>
          </>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority.bg} ${priority.text}`}>
          Priority: {card.priority}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>
          Status: {card.status}
        </span>
      </div>

      {/* Assigned User */}
      {card.assigned_to && (
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
            <User className="w-3 h-3" />
            <span>{assignedUser?.full_name || card.assigned_to}</span>
          </div>
        </div>
      )}

      {/* Subtasks Section */}
      {showSubtasks && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="space-y-1 mb-2">
            {subtasks.map((subtask) => (
              <div 
                key={subtask.id} 
                className="flex items-center gap-2 group/subtask"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleToggleSubtask(subtask);
                }}
              >
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={(e) => {
                    e?.stopPropagation?.();
                    handleToggleSubtask(subtask);
                  }}
                  className="h-3 w-3"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className={`text-xs flex-1 ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {subtask.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSubtaskMutation.mutate(subtask.id);
                  }}
                  className="opacity-0 group-hover/subtask:opacity-100 p-0.5 hover:bg-gray-100 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            ))}
          </div>

          {isAddingSubtask ? (
            <form onSubmit={handleAddSubtask} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask..."
                className="h-6 text-xs"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button type="submit" className="p-1 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}>
                <CheckSquare className="w-3 h-3 text-green-600" />
              </button>
              <button type="button" onClick={(e) => {
                e.stopPropagation();
                setIsAddingSubtask(false);
              }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </form>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingSubtask(true);
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 w-full py-1"
            >
              <Plus className="w-3 h-3" />
              Add subtask
            </button>
          )}
        </div>
      )}

      {/* Add Subtask Button (when collapsed) */}
      {!showSubtasks && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSubtasks(true);
          }}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-2 w-full"
        >
          <Plus className="w-3 h-3" />
          Add subtask
        </button>
      )}

      {/* Attachments */}
      {card.attachments && card.attachments.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-1">
            {card.attachments.map((file, index) => (
              <a
                key={index}
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(file.file_url, '_blank');
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                title={file.file_name}
              >
                <Paperclip className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{file.file_name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}