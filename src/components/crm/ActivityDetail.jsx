import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { X, Phone, Mail, Users as MeetingIcon, FileText, CheckSquare, Calendar, Clock, User, Building2, DollarSign, Edit, Trash2, Plus, ExternalLink } from "lucide-react";
import NeuroButton from "./NeuroButton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ActivityDetail({ activity, onClose, onEdit, onDelete, onAddNew }) {
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: contact } = useQuery({
    queryKey: ['contact', activity.contact_id],
    queryFn: () => base44.entities.Contact.filter({ id: activity.contact_id }),
    enabled: !!activity.contact_id
  });

  const { data: company } = useQuery({
    queryKey: ['company', activity.company_id],
    queryFn: () => base44.entities.Company.filter({ id: activity.company_id }),
    enabled: !!activity.company_id
  });

  const { data: deal } = useQuery({
    queryKey: ['deal', activity.deal_id],
    queryFn: () => base44.entities.Deal.filter({ id: activity.deal_id }),
    enabled: !!activity.deal_id
  });

  const getActivityIcon = (type) => {
    const icons = {
      Call: Phone,
      Email: Mail,
      Meeting: MeetingIcon,
      Note: FileText,
      Task: CheckSquare
    };
    return icons[type] || FileText;
  };

  const Icon = getActivityIcon(activity.activity_type);
  const creator = users.find(u => u.email === activity.created_by);

  // Extract URLs from description
  const extractLinks = (text) => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    return text.match(urlRegex) || [];
  };

  // Render description with clickable links
  const renderDescription = (text) => {
    if (!text) return null;
    
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = cleanText.split(urlRegex);
    
    return (
      <div>
        {parts.map((part, index) => {
          if (part.match(urlRegex)) {
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {part.length > 50 ? part.substring(0, 50) + '...' : part}
                <ExternalLink className="w-3 h-3" />
              </a>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  const links = extractLinks(activity.description);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="ampvibe-card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="ampvibe-button-primary p-3 rounded-xl">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                {activity.subject}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="ampvibe-button px-2 py-1 text-xs">
                  {activity.activity_type}
                </span>
                <span className="ampvibe-button px-2 py-1 text-xs">
                  {activity.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="ampvibe-button p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          {activity.description && (
            <div>
              <h3 className="font-bold mb-2 text-sm" style={{ color: "#888" }}>Description</h3>
              <div className="ampvibe-inset p-4 rounded-lg">
                <div style={{ color: "#666", lineHeight: "1.6" }}>
                  {renderDescription(activity.description)}
                </div>
              </div>
            </div>
          )}

          {/* Links Section */}
          {links.length > 0 && (
            <div>
              <h3 className="font-bold mb-2 text-sm" style={{ color: "#888" }}>Attachments & Links</h3>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ampvibe-button p-3 rounded-lg flex items-center gap-3 hover:scale-[1.02] transition-transform"
                  >
                    <ExternalLink className="w-5 h-5" style={{ color: "#4a90e2" }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: "#666" }}>
                        {link.includes('recording') ? 'Call Recording' : link.includes('ringcentral') ? 'RingCentral Link' : 'Link'}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#888" }}>{link}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold mb-2 text-sm flex items-center gap-2" style={{ color: "#888" }}>
                <Calendar className="w-4 h-4" />
                Date & Time
              </h3>
              <div className="ampvibe-inset p-3 rounded-lg">
                <p className="font-medium" style={{ color: "#666" }}>
                  {new Date(activity.activity_date || activity.created_date).toLocaleDateString()}
                </p>
                <p className="text-sm" style={{ color: "#888" }}>
                  {new Date(activity.activity_date || activity.created_date).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {activity.duration_minutes && (
              <div>
                <h3 className="font-bold mb-2 text-sm flex items-center gap-2" style={{ color: "#888" }}>
                  <Clock className="w-4 h-4" />
                  Duration
                </h3>
                <div className="ampvibe-inset p-3 rounded-lg">
                  <p className="font-medium" style={{ color: "#666" }}>
                    {activity.duration_minutes} minutes
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Created By */}
          {creator && (
            <div>
              <h3 className="font-bold mb-2 text-sm flex items-center gap-2" style={{ color: "#888" }}>
                <User className="w-4 h-4" />
                Created By
              </h3>
              <div className="ampvibe-inset p-3 rounded-lg">
                <p className="font-medium" style={{ color: "#666" }}>
                  {creator.full_name || creator.email}
                </p>
                <p className="text-sm" style={{ color: "#888" }}>
                  {new Date(activity.created_date).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Related Records */}
          <div>
            <h3 className="font-bold mb-2 text-sm" style={{ color: "#888" }}>Related Records</h3>
            <div className="space-y-2">
              {contact && contact[0] && (
                <Link to={createPageUrl("ContactDetail") + `?id=${contact[0].id}`}>
                  <div className="ampvibe-button p-3 rounded-lg flex items-center gap-3 hover:scale-[1.02] transition-transform">
                    <User className="w-5 h-5" style={{ color: "#4a90e2" }} />
                    <div>
                      <p className="font-medium" style={{ color: "#666" }}>
                        {contact[0].first_name} {contact[0].last_name}
                      </p>
                      <p className="text-xs" style={{ color: "#888" }}>Contact</p>
                    </div>
                  </div>
                </Link>
              )}

              {company && company[0] && (
                <Link to={createPageUrl("CompanyDetail") + `?id=${company[0].id}`}>
                  <div className="ampvibe-button p-3 rounded-lg flex items-center gap-3 hover:scale-[1.02] transition-transform">
                    <Building2 className="w-5 h-5" style={{ color: "#52c41a" }} />
                    <div>
                      <p className="font-medium" style={{ color: "#666" }}>
                        {company[0].company_name}
                      </p>
                      <p className="text-xs" style={{ color: "#888" }}>Company</p>
                    </div>
                  </div>
                </Link>
              )}

              {deal && deal[0] && (
                <Link to={createPageUrl("DealDetail") + `?id=${deal[0].id}`}>
                  <div className="ampvibe-button p-3 rounded-lg flex items-center gap-3 hover:scale-[1.02] transition-transform">
                    <DollarSign className="w-5 h-5" style={{ color: "#fa8c16" }} />
                    <div>
                      <p className="font-medium" style={{ color: "#666" }}>
                        {deal[0].deal_name}
                      </p>
                      <p className="text-xs" style={{ color: "#888" }}>Deal</p>
                    </div>
                  </div>
                </Link>
              )}

              {!contact && !company && !deal && (
                <div className="ampvibe-inset p-4 rounded-lg text-center">
                  <p className="text-sm" style={{ color: "#aaa" }}>No related records</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <NeuroButton onClick={onEdit} className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </NeuroButton>
            <NeuroButton onClick={onAddNew} variant="primary" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Log New Activity
            </NeuroButton>
            <NeuroButton onClick={onDelete} className="hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </NeuroButton>
          </div>
        </div>
      </div>
    </div>
  );
}