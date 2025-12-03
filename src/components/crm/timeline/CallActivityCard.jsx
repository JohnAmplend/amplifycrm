import React, { useState } from "react";
import { Phone, ChevronDown, ChevronUp, Pin, Play, FileText } from "lucide-react";
import moment from "moment";

export default function CallActivityCard({ activity, onPin }) {
  const [expanded, setExpanded] = useState(false);
  const callData = activity.call_data || {};

  return (
    <div className="ampvibe-inset p-4 rounded-lg">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#00A86B20', color: '#00A86B' }}
        >
          <Phone className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm" style={{ color: "#666" }}>
                  Call Logged
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

          {/* Call Details */}
          <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
            {callData.duration && (
              <div>
                <span style={{ color: "#aaa" }}>Duration: </span>
                <span style={{ color: "#666" }}>{callData.duration}</span>
              </div>
            )}
            {callData.direction && (
              <div>
                <span style={{ color: "#aaa" }}>Direction: </span>
                <span style={{ color: "#666" }}>{callData.direction}</span>
              </div>
            )}
            {callData.outcome && (
              <div>
                <span style={{ color: "#aaa" }}>Outcome: </span>
                <span style={{ color: "#666" }}>{callData.outcome}</span>
              </div>
            )}
          </div>

          {/* Summary */}
          {callData.summary && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1" style={{ color: "#666" }}>
                AI Summary:
              </p>
              <p className="text-sm" style={{ color: "#888" }}>
                {callData.summary}
              </p>
            </div>
          )}

          {/* Action Items */}
          {expanded && callData.action_items && callData.action_items.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-2" style={{ color: "#666" }}>
                Action Items:
              </p>
              <ul className="space-y-1">
                {callData.action_items.map((item, index) => (
                  <li key={index} className="text-sm flex items-start gap-2" style={{ color: "#888" }}>
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sentiment */}
          {callData.sentiment && (
            <div className="mb-3">
              <span className="text-xs px-2 py-1 rounded" style={{
                backgroundColor: callData.sentiment === 'Positive' ? '#52c41a20' : 
                               callData.sentiment === 'Negative' ? '#ef444420' : '#f59e0b20',
                color: callData.sentiment === 'Positive' ? '#52c41a' : 
                       callData.sentiment === 'Negative' ? '#ef4444' : '#f59e0b'
              }}>
                Sentiment: {callData.sentiment}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {callData.recording_url && (
              <button className="ampvibe-button px-3 py-1 text-sm">
                <Play className="w-3 h-3 mr-1 inline" />
                Play Recording
              </button>
            )}
            {callData.transcript && (
              <button className="ampvibe-button px-3 py-1 text-sm">
                <FileText className="w-3 h-3 mr-1 inline" />
                View Transcript
              </button>
            )}
            {(callData.action_items || callData.summary) && (
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
                    Show More
                  </>
                )}
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