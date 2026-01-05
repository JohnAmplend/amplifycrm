import React from "react";
import { Calendar, MessageSquare, CheckSquare, MoreHorizontal, Trash2, Edit2, User } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

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
  const priority = priorityColors[card.priority] || priorityColors.Medium;
  const status = statusColors[card.status] || statusColors["To do"];

  // Fetch user details if assigned
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!card.assigned_to
  });

  const assignedUser = users.find(u => u.email === card.assigned_to);

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-2 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? "shadow-lg scale-105 rotate-2" : "hover:shadow-md"
      }`}
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

      {/* Dates */}
      {(card.start_date || card.end_date) && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <Calendar className="w-3 h-3" />
          <span>
            {card.start_date && format(new Date(card.start_date), "MMM d")}
            {card.start_date && card.end_date && " - "}
            {card.end_date && format(new Date(card.end_date), "MMM d")}
          </span>
          {card.total_tasks > 0 && (
            <>
              <span className="mx-1">•</span>
              <CheckSquare className="w-3 h-3" />
              <span>{card.completed_tasks || 0}/{card.total_tasks}</span>
            </>
          )}
        </div>
      )}

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
    </div>
  );
}