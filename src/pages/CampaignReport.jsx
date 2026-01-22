import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send, Mail, MousePointerClick, UserX, TrendingUp, Users, Eye } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import StatCard from "../components/crm/StatCard";

export default function CampaignReport() {
  const navigate = useNavigate();
  const [campaignId, setCampaignId] = useState(null);
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setCampaignId(id);
      loadCampaign(id);
    }
  }, []);

  const loadCampaign = async (id) => {
    try {
      const data = await base44.entities.Email_Campaign.get(id);
      setCampaign(data);
    } catch (error) {
      console.error('Failed to load campaign');
    }
  };

  const { data: tracking = [] } = useQuery({
    queryKey: ['email-tracking', campaignId],
    queryFn: () => base44.entities.Email_Tracking.filter({ campaign_id: campaignId }),
    enabled: !!campaignId
  });

  if (!campaign) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p style={{ color: "#aaa" }}>Loading campaign...</p>
        </div>
      </div>
    );
  }

  const openRate = campaign.total_sent > 0 ? ((campaign.total_opened || 0) / campaign.total_sent * 100).toFixed(1) : 0;
  const clickRate = campaign.total_sent > 0 ? ((campaign.total_clicked || 0) / campaign.total_sent * 100).toFixed(1) : 0;
  const bounceRate = campaign.total_sent > 0 ? ((campaign.total_bounced || 0) / campaign.total_sent * 100).toFixed(1) : 0;
  const unsubscribeRate = campaign.total_sent > 0 ? ((campaign.total_unsubscribed || 0) / campaign.total_sent * 100).toFixed(1) : 0;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <NeuroButton onClick={() => navigate(createPageUrl("Campaigns"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </NeuroButton>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              {campaign.campaign_name}
            </h1>
            <div className="flex items-center gap-3">
              <span className={`ampvibe-button px-3 py-1 text-sm ${
                campaign.status === 'Sent' ? 'text-green-600' :
                campaign.status === 'Sending' ? 'text-blue-600' :
                campaign.status === 'Scheduled' ? 'text-orange-600' : ''
              }`}>
                {campaign.status}
              </span>
              {campaign.send_date && (
                <p className="text-sm" style={{ color: "#888" }}>
                  Sent: {new Date(campaign.send_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Send}
            title="Total Sent"
            value={campaign.total_sent || 0}
            subtitle={`${campaign.total_delivered || 0} delivered`}
            color="#4a90e2"
          />
          <StatCard
            icon={Eye}
            title="Open Rate"
            value={`${openRate}%`}
            subtitle={`${campaign.total_opened || 0} opens`}
            color="#52c41a"
          />
          <StatCard
            icon={MousePointerClick}
            title="Click Rate"
            value={`${clickRate}%`}
            subtitle={`${campaign.total_clicked || 0} clicks`}
            color="#fa8c16"
          />
          <StatCard
            icon={UserX}
            title="Unsubscribed"
            value={campaign.total_unsubscribed || 0}
            subtitle={`${unsubscribeRate}% rate`}
            color="#f5222d"
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <NeuroCard>
            <h3 className="font-bold mb-4" style={{ color: "#666" }}>Engagement Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 ampvibe-inset rounded-lg">
                <span style={{ color: "#888" }}>Bounce Rate</span>
                <span className="font-bold" style={{ color: "#f5222d" }}>{bounceRate}%</span>
              </div>
              <div className="flex items-center justify-between p-3 ampvibe-inset rounded-lg">
                <span style={{ color: "#888" }}>Bounced Emails</span>
                <span className="font-bold" style={{ color: "#666" }}>{campaign.total_bounced || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 ampvibe-inset rounded-lg">
                <span style={{ color: "#888" }}>Click-to-Open Rate</span>
                <span className="font-bold" style={{ color: "#4a90e2" }}>
                  {campaign.total_opened > 0 ? ((campaign.total_clicked / campaign.total_opened) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </NeuroCard>

          <NeuroCard>
            <h3 className="font-bold mb-4" style={{ color: "#666" }}>Campaign Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 ampvibe-inset rounded-lg">
                <span style={{ color: "#888" }}>From Name</span>
                <span className="font-medium" style={{ color: "#666" }}>{campaign.from_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 ampvibe-inset rounded-lg">
                <span style={{ color: "#888" }}>From Email</span>
                <span className="font-medium" style={{ color: "#666" }}>{campaign.from_email || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 ampvibe-inset rounded-lg">
                <span style={{ color: "#888" }}>Subject Line</span>
                <span className="font-medium" style={{ color: "#666" }}>{campaign.subject_line}</span>
              </div>
            </div>
          </NeuroCard>
        </div>

        {/* Email Tracking */}
        {tracking.length > 0 && (
          <NeuroCard>
            <h3 className="font-bold mb-4" style={{ color: "#666" }}>
              Email Activity ({tracking.length} recipients)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Contact</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Status</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Sent</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Opened</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  {tracking.slice(0, 50).map((track) => (
                    <tr key={track.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#d8d8d8" }}>
                      <td className="py-3 px-4" style={{ color: "#666" }}>
                        Contact ID: {track.contact_id}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`ampvibe-button px-2 py-1 text-xs ${
                          track.status === 'Clicked' ? 'text-green-600' :
                          track.status === 'Opened' ? 'text-blue-600' :
                          track.status === 'Bounced' ? 'text-red-600' : ''
                        }`}>
                          {track.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: "#888" }}>
                        {track.sent_date ? new Date(track.sent_date).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: "#888" }}>
                        {track.opened_date ? new Date(track.opened_date).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: "#888" }}>
                        {track.clicked_date ? new Date(track.clicked_date).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NeuroCard>
        )}
      </div>
    </div>
  );
}