import React, { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Pin, Users } from "lucide-react";
import moment from "moment";

export default function MeetingActivityCard({ activity, onPin }) {
  const [expanded, setExpanded] = useState(false);
  const meetingData = activity.meeting_data || {};

  return (
    <div className="ampvibe-inset p-4 rounded-lg">
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#8b5cf620', color: '#8b5cf6' }}
        >
          <Calendar className="w-5 h-5" />
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
            {meetingData.title || activity.activity_title}
          </p>

          {meetingData.duration && (
            <p className="text-sm mb-2" style={{ color: "#888" }}>
              Duration: {meetingData.duration}
            </p>
          )}

          {meetingData.attendees && meetingData.attendees.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4" style={{ color: "#888" }} />
                <span className="text-sm font-medium" style={{ color: "#666" }}>
                  Attendees:
                </span>
              </div>
              <ul className="space-y-1 ml-6">
                {meetingData.attendees.map((attendee, index) => (
                  <li key={index} className="text-sm" style={{ color: "#888" }}>
                    {attendee}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {meetingData.notes && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1" style={{ color: "#666" }}>
                Meeting Notes:
              </p>
              <p className="text-sm" style={{ color: "#888" }}>
                {expanded ? meetingData.notes : `${meetingData.notes.substring(0, 150)}...`}
              </p>
            </div>
          )}

          {meetingData.notes && meetingData.notes.length > 150 && (
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
                  Read More
                </>
              )}
            </button>
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