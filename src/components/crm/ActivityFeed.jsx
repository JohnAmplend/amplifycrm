import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Mail, Phone, FileText, UserPlus, Edit, MessageSquare, 
  Calendar, CheckCircle, Tag, TrendingUp, DollarSign,
  Clock, User
} from "lucide-react";
import moment from "moment";

export default function ActivityFeed({ recordType, recordId, recordName }) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-feed', recordType, recordId],
    queryFn: () => base44.entities.Activity_Feed.filter({
      record_type: recordType,
      record_id: recordId
    }).then(acts => acts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)))
  });

  const getActivityIcon = (type) => {
    switch (type) {
      case 'Email Sent': return <Mail className="w-4 h-4" />;
      case 'Record Created': return <UserPlus className="w-4 h-4" />;
      case 'Record Updated': return <Edit className="w-4 h-4" />;
      case 'Note Added': return <FileText className="w-4 h-4" />;
      case 'Task Assigned': return <CheckCircle className="w-4 h-4" />;
      case 'Mention': return <MessageSquare className="w-4 h-4" />;
      case 'Deal Stage Changed': return <TrendingUp className="w-4 h-4" />;
      case 'Form Submitted': return <FileText className="w-4 h-4" />;
      case 'File Uploaded': return <FileText className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'Email Sent': return '#4a90e2';
      case 'Record Created': return '#52c41a';
      case 'Record Updated': return '#fa8c16';
      case 'Note Added': return '#8b5cf6';
      case 'Task Assigned': return '#00A86B';
      case 'Mention': return '#ef4444';
      case 'Deal Stage Changed': return '#06b6d4';
      default: return '#888';
    }
  };

  if (isLoading) {
    return (
      <div className="ampvibe-card p-6">
        <div className="text-center py-8" style={{ color: "#aaa" }}>
          Loading activity feed...
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="ampvibe-card p-6">
        <h3 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
          Activity Feed
        </h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: "#ccc" }} />
          <p style={{ color: "#888" }}>No activities yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ampvibe-card p-6">
      <h3 className="text-xl font-bold mb-6" style={{ color: "#666" }}>
        Activity Feed
      </h3>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div 
            key={activity.id}
            className="ampvibe-inset p-4 rounded-lg relative"
          >
            {/* Timeline connector */}
            {index < activities.length - 1 && (
              <div 
                className="absolute left-[30px] top-[52px] w-0.5 h-[calc(100%+16px)]"
                style={{ backgroundColor: "#e0e0e0" }}
              />
            )}

            <div className="flex gap-4">
              {/* Icon */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                style={{ 
                  backgroundColor: `${getActivityColor(activity.activity_type)}20`,
                  color: getActivityColor(activity.activity_type)
                }}
              >
                {getActivityIcon(activity.activity_type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="font-medium mb-1" style={{ color: "#666" }}>
                      {activity.activity_summary}
                    </p>
                    {activity.activity_details && Object.keys(activity.activity_details).length > 0 && (
                      <div className="text-sm space-y-1" style={{ color: "#888" }}>
                        {activity.activity_details.old_value && (
                          <p>
                            <span className="font-medium">From:</span> {activity.activity_details.old_value}
                          </p>
                        )}
                        {activity.activity_details.new_value && (
                          <p>
                            <span className="font-medium">To:</span> {activity.activity_details.new_value}
                          </p>
                        )}
                        {activity.activity_details.note && (
                          <p className="italic">&quot;{activity.activity_details.note}&quot;</p>
                        )}
                      </div>
                    )}
                  </div>
                  <span 
                    className="text-xs whitespace-nowrap flex-shrink-0"
                    style={{ color: "#aaa" }}
                  >
                    {moment(activity.created_date).fromNow()}
                  </span>
                </div>

                {/* Actor */}
                <div className="flex items-center gap-2 text-sm" style={{ color: "#888" }}>
                  <User className="w-3 h-3" />
                  <span>{activity.actor_name || activity.actor_email}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}