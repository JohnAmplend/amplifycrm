import React, { useState } from "react";
import { Mail, ChevronDown, ChevronUp, Pin, Paperclip, ExternalLink } from "lucide-react";
import moment from "moment";

export default function EmailActivityCard({ activity, onPin }) {
  const [expanded, setExpanded] = useState(false);
  const emailData = activity.email_data || {};

  return (
    <div className="ampvibe-inset p-4 rounded-lg">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ 
            backgroundColor: activity.activity_type === 'Email Sent' ? '#4a90e220' : '#00A86B20',
            color: activity.activity_type === 'Email Sent' ? '#4a90e2' : '#00A86B'
          }}
        >
          <Mail className="w-5 h-5" />
        </div>

        {/* Content */}
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
                {emailData.to_emails && ` → ${emailData.to_emails.join(', ')}`}
              </p>
            </div>
            <button
              onClick={onPin}
              className={`p-2 hover:bg-gray-100 rounded ${activity.is_pinned ? 'text-orange-500' : 'text-gray-400'}`}
            >
              <Pin className="w-4 h-4" />
            </button>
          </div>

          {/* Subject */}
          <p className="font-medium mb-2" style={{ color: "#666" }}>
            Subject: {emailData.subject || activity.activity_title}
          </p>

          {/* Preview */}
          {!expanded && (
            <p className="text-sm mb-3 line-clamp-2" style={{ color: "#888" }}>
              {emailData.body_plain || activity.activity_description}
            </p>
          )}

          {/* Full Content */}
          {expanded && (
            <div className="mb-3">
              <div 
                className="text-sm prose max-w-none"
                style={{ color: "#666" }}
                dangerouslySetInnerHTML={{ 
                  __html: emailData.body_html || emailData.body_plain || activity.activity_description 
                }}
              />
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
            {emailData.attachments && emailData.attachments.length > 0 && (
              <span className="flex items-center gap-1" style={{ color: "#888" }}>
                <Paperclip className="w-3 h-3" />
                {emailData.attachments.length} attachment(s)
              </span>
            )}
            {emailData.opened_at && (
              <span className="px-2 py-1 rounded" style={{ backgroundColor: '#52c41a20', color: '#52c41a' }}>
                ✓ Opened
              </span>
            )}
            {emailData.clicked_at && (
              <span className="px-2 py-1 rounded" style={{ backgroundColor: '#4a90e220', color: '#4a90e2' }}>
                🔗 Clicked
              </span>
            )}
            {emailData.replied_at && (
              <span className="px-2 py-1 rounded" style={{ backgroundColor: '#00A86B20', color: '#00A86B' }}>
                ↩ Replied
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="ampvibe-button px-3 py-1 text-sm"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1 inline" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1 inline" />
                  Expand
                </>
              )}
            </button>
            {emailData.thread_id && (
              <button className="ampvibe-button px-3 py-1 text-sm">
                <ExternalLink className="w-3 h-3 mr-1 inline" />
                View Thread
              </button>
            )}
          </div>

          {/* Associated Records */}
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