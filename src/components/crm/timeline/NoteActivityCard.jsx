import React from "react";
import { FileText, Pin, Edit2, Trash2 } from "lucide-react";
import moment from "moment";

export default function NoteActivityCard({ activity, onPin }) {
  return (
    <div className="ampvibe-inset p-4 rounded-lg">
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#fa8c1620', color: '#fa8c16' }}
        >
          <FileText className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm" style={{ color: "#666" }}>
                  Note Added
                </span>
                <span className="text-xs" style={{ color: "#aaa" }}>
                  {moment(activity.occurred_at || activity.created_date).fromNow()}
                </span>
              </div>
              <p className="text-sm mb-1" style={{ color: "#888" }}>
                {activity.performed_by_name}
              </p>
            </div>
            <button
              onClick={onPin}
              className={`p-2 hover:bg-gray-100 rounded ${activity.is_pinned ? 'text-orange-500' : 'text-gray-400'}`}
            >
              <Pin className="w-4 h-4" />
            </button>
          </div>

          <div 
            className="text-sm mb-3 prose max-w-none"
            style={{ color: "#666" }}
            dangerouslySetInnerHTML={{ __html: activity.activity_description }}
          />

          {activity.related_object_name && (
            <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: "#e0e0e0", color: "#888" }}>
              Associated: {activity.related_object_type} - {activity.related_object_name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}