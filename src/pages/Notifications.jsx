import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle, Trash2, Mail } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function Notifications() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [filterRead, setFilterRead] = useState("unread");

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', currentUser?.email],
    queryFn: () => {
      if (!currentUser?.email) return [];
      return base44.entities.Notifications.filter({ user_id: currentUser.email }, '-created_date');
    },
    enabled: !!currentUser?.email
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notifications.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifs = notifications.filter(n => !n.is_read);
      await Promise.all(unreadNotifs.map(n => 
        base44.entities.Notifications.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notifications.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const filteredNotifications = notifications.filter(n => {
    const typeMatch = !filterType || n.notification_type === filterType;
    const readMatch = filterRead === 'all' || 
                     (filterRead === 'unread' && !n.is_read) ||
                     (filterRead === 'read' && n.is_read);
    return typeMatch && readMatch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTypeColor = (type) => {
    const colors = {
      'Task Due': '#fa8c16',
      'Deal Won': '#52c41a',
      'Ticket Assigned': '#4a90e2',
      'Email Replied': '#eb2f96',
      'Mention': '#722ed1',
      'Workflow': '#13c2c2',
      'System': '#666'
    };
    return colors[type] || '#888';
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Notifications
            </h1>
            <p style={{ color: "#888" }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <NeuroButton onClick={() => markAllAsReadMutation.mutate()}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All as Read
            </NeuroButton>
          )}
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <NeuroSelect
              placeholder="All Types"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'Task Due', label: 'Task Due' },
                { value: 'Deal Won', label: 'Deal Won' },
                { value: 'Ticket Assigned', label: 'Ticket Assigned' },
                { value: 'Email Replied', label: 'Email Replied' },
                { value: 'Mention', label: 'Mention' },
                { value: 'Workflow', label: 'Workflow' },
                { value: 'System', label: 'System' }
              ]}
            />
            <NeuroSelect
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              options={[
                { value: 'unread', label: 'Unread Only' },
                { value: 'read', label: 'Read Only' },
                { value: 'all', label: 'All Notifications' }
              ]}
            />
          </div>
        </NeuroCard>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <NeuroCard>
              <div className="text-center py-12" style={{ color: "#aaa" }}>
                Loading notifications...
              </div>
            </NeuroCard>
          ) : filteredNotifications.length === 0 ? (
            <NeuroCard>
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
                <p style={{ color: "#aaa" }}>No notifications</p>
              </div>
            </NeuroCard>
          ) : (
            filteredNotifications.map((notification) => (
              <NeuroCard 
                key={notification.id} 
                className={`hover:shadow-lg transition-all ${
                  !notification.is_read ? 'border-l-4' : ''
                }`}
                style={{
                  borderLeftColor: !notification.is_read ? getTypeColor(notification.notification_type) : 'transparent'
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="ampvibe-inset p-3 rounded-lg"
                    style={{
                      background: !notification.is_read 
                        ? `linear-gradient(135deg, ${getTypeColor(notification.notification_type)}22, ${getTypeColor(notification.notification_type)}11)`
                        : undefined
                    }}
                  >
                    <Bell className="w-5 h-5" style={{ color: getTypeColor(notification.notification_type) }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 
                          className="font-bold mb-1" 
                          style={{ color: !notification.is_read ? "#333" : "#888" }}
                        >
                          {notification.notification_title}
                        </h3>
                        <p className="text-sm" style={{ color: "#888" }}>
                          {notification.notification_message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            className="ampvibe-button p-2"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-4 h-4" style={{ color: "#52c41a" }} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this notification?')) {
                              deleteMutation.mutate(notification.id);
                            }
                          }}
                          className="ampvibe-button p-2"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: "#f5222d" }} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "#aaa" }}>
                      <span className="ampvibe-button px-2 py-1">
                        {notification.notification_type}
                      </span>
                      <span>
                        {new Date(notification.created_date).toLocaleDateString()} at{' '}
                        {new Date(notification.created_date).toLocaleTimeString()}
                      </span>
                    </div>
                    {notification.action_url && (
                      <div className="mt-3">
                        <a
                          href={notification.action_url}
                          className="text-sm"
                          style={{ color: "#4a90e2" }}
                        >
                          View Details →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </NeuroCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}