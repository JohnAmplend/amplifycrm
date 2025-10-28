import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, BarChart3, Edit2, Copy, Trash2, Send, Mail } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";
import StatCard from "../components/crm/StatCard";

export default function Campaigns() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email_campaigns'],
    queryFn: () => base44.entities.Email_Campaign.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Email_Campaign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['email_campaigns']);
    }
  });

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = 
      campaign.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || campaign.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalSent = campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0);
  const totalUnsubscribed = campaigns.reduce((sum, c) => sum + (c.total_unsubscribed || 0), 0);
  
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0;
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0;

  const handleDelete = (campaign) => {
    if (window.confirm(`Delete campaign "${campaign.campaign_name}"?`)) {
      deleteMutation.mutate(campaign.id);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Email Campaigns
            </h1>
            <p style={{ color: "#888" }}>Manage your email marketing campaigns</p>
          </div>
          <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("CreateCampaign"))}>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </NeuroButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            icon={Send}
            title="Total Sent"
            value={totalSent.toLocaleString()}
            subtitle={`${campaigns.length} campaigns`}
            color="#4a90e2"
          />
          <StatCard
            icon={Mail}
            title="Open Rate"
            value={`${openRate}%`}
            subtitle={`${totalOpened.toLocaleString()} opened`}
            color="#52c41a"
          />
          <StatCard
            icon={BarChart3}
            title="Click Rate"
            value={`${clickRate}%`}
            subtitle={`${totalClicked.toLocaleString()} clicked`}
            color="#fa8c16"
          />
          <StatCard
            icon={Mail}
            title="Unsubscribed"
            value={totalUnsubscribed}
            subtitle="Total"
            color="#f5222d"
          />
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neuro-input w-full pl-12"
              />
            </div>
            <NeuroSelect
              placeholder="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'Draft', label: 'Draft' },
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'Sending', label: 'Sending' },
                { value: 'Sent', label: 'Sent' },
                { value: 'Paused', label: 'Paused' }
              ]}
            />
          </div>
        </NeuroCard>

        {/* Campaigns Table */}
        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading campaigns...
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No campaigns found</p>
              <NeuroButton onClick={() => navigate(createPageUrl("CreateCampaign"))}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Campaign
              </NeuroButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Campaign Name</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Status</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Sent Date</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Recipients</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Open Rate</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Click Rate</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => {
                    const openRate = campaign.total_sent > 0 ? ((campaign.total_opened || 0) / campaign.total_sent * 100).toFixed(1) : 0;
                    const clickRate = campaign.total_sent > 0 ? ((campaign.total_clicked || 0) / campaign.total_sent * 100).toFixed(1) : 0;

                    return (
                      <tr
                        key={campaign.id}
                        className="border-b hover:bg-gray-100 transition-colors"
                        style={{ borderColor: "#d8d8d8" }}
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium" style={{ color: "#666" }}>
                            {campaign.campaign_name}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`neuro-button px-2 py-1 text-xs ${
                            campaign.status === 'Sent' ? 'text-green-600' :
                            campaign.status === 'Sending' ? 'text-blue-600' :
                            campaign.status === 'Scheduled' ? 'text-orange-600' : ''
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="py-3 px-4" style={{ color: "#888" }}>
                          {campaign.send_date ? new Date(campaign.send_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4" style={{ color: "#888" }}>
                          {campaign.total_recipients || 0}
                        </td>
                        <td className="py-3 px-4 font-semibold" style={{ color: "#52c41a" }}>
                          {openRate}%
                        </td>
                        <td className="py-3 px-4 font-semibold" style={{ color: "#4a90e2" }}>
                          {clickRate}%
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <NeuroButton
                              size="sm"
                              onClick={() => navigate(createPageUrl("CampaignReport") + `?id=${campaign.id}`)}
                            >
                              <BarChart3 className="w-3 h-3" />
                            </NeuroButton>
                            <NeuroButton
                              size="sm"
                              onClick={() => navigate(createPageUrl("CreateCampaign") + `?id=${campaign.id}`)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </NeuroButton>
                            <NeuroButton
                              size="sm"
                              onClick={() => handleDelete(campaign)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </NeuroButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}