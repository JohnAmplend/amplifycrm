import React from "react";
import { Edit, Pin, ArrowRight } from "lucide-react";
import moment from "moment";

export default function FieldChangeActivityCard({ activity, onPin }) {
  const fieldChanges = activity.field_changes || {};

  return (
    <div className="ampvibe-inset p-4 rounded-lg">
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#06b6d420', color: '#06b6d4' }}
        >
          <Edit className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm" style={{ color: "#666" }}>
                  {activity.activity_type}
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

          <p className="font-medium mb-2" style={{ color: "#666" }}>
            {activity.activity_title}
          </p>

          {Object.keys(fieldChanges).length > 0 && (
            <div className="space-y-2">
              {Object.entries(fieldChanges).map(([field, change]) => (
                <div key={field} className="flex items-center gap-2 text-sm">
                  <span style={{ color: "#aaa" }}>{field}:</span>
                  <span 
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: "#ef444420", color: "#ef4444" }}
                  >
                    {change.old_value || '(empty)'}
                  </span>
                  <ArrowRight className="w-4 h-4" style={{ color: "#888" }} />
                  <span 
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: "#52c41a20", color: "#52c41a" }}
                  >
                    {change.new_value}
                  </span>
                </div>
              ))}
            </div>
          )}

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