import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, TrendingUp, DollarSign, Users, Mail, FileText, BarChart3, PieChart, Calendar, Download, Filter } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdvancedReports() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('last30days');
  const [activeReport, setActiveReport] = useState('overview');

  // Fetch data
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list()
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Email_Campaign.list()
  });

  const { data: forms = [] } = useQuery({
    queryKey: ['forms'],
    queryFn: () => base44.entities.Form.list()
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => base44.entities.Form_Submission.list()
  });

  // Calculate metrics
  const calculateMetrics = () => {
    const now = new Date();
    const days = dateRange === 'last7days' ? 7 : dateRange === 'last30days' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    const recentContacts = contacts.filter(c => new Date(c.created_date) > cutoffDate);
    const recentDeals = deals.filter(d => new Date(d.created_date) > cutoffDate);
    const recentSubmissions = submissions.filter(s => new Date(s.created_date) > cutoffDate);

    const totalRevenue = deals.filter(d => d.deal_stage === 'Closed Won').reduce((sum, d) => sum + (d.deal_amount || 0), 0);
    const pipelineValue = deals.filter(d => d.deal_stage !== 'Closed Won' && d.deal_stage !== 'Closed Lost').reduce((sum, d) => sum + (d.deal_amount || 0), 0);

    return {
      totalContacts: contacts.length,
      newContacts: recentContacts.length,
      totalDeals: deals.length,
      activeDeals: deals.filter(d => d.deal_stage !== 'Closed Won' && d.deal_stage !== 'Closed Lost').length,
      totalRevenue,
      pipelineValue,
      avgDealSize: deals.length > 0 ? (totalRevenue / deals.filter(d => d.deal_stage === 'Closed Won').length) || 0 : 0,
      winRate: deals.length > 0 ? ((deals.filter(d => d.deal_stage === 'Closed Won').length / deals.length) * 100).toFixed(1) : 0,
      formSubmissions: recentSubmissions.length,
      campaignsSent: campaigns.filter(c => c.status === 'Sent').length
    };
  };

  const metrics = calculateMetrics();

  // Sales Pipeline Data
  const getPipelineData = () => {
    const stages = {};
    deals.forEach(deal => {
      if (!stages[deal.deal_stage]) {
        stages[deal.deal_stage] = { count: 0, value: 0 };
      }
      stages[deal.deal_stage].count++;
      stages[deal.deal_stage].value += deal.deal_amount || 0;
    });

    return Object.entries(stages).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value
    }));
  };

  // Contact Growth Data
  const getContactGrowthData = () => {
    const days = dateRange === 'last7days' ? 7 : dateRange === 'last30days' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const count = contacts.filter(c => {
        const created = new Date(c.created_date);
        return created.toDateString() === date.toDateString();
      }).length;

      data.push({ date: dateStr, contacts: count });
    }

    return data;
  };

  // Revenue Trend Data
  const getRevenueTrendData = () => {
    const days = dateRange === 'last7days' ? 7 : dateRange === 'last30days' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const revenue = deals.filter(d => {
        if (d.deal_stage !== 'Closed Won') return false;
        const closeDate = new Date(d.close_date || d.updated_date);
        return closeDate.toDateString() === date.toDateString();
      }).reduce((sum, d) => sum + (d.deal_amount || 0), 0);

      data.push({ date: dateStr, revenue });
    }

    return data;
  };

  // Lifecycle Stage Distribution
  const getLifecycleDistribution = () => {
    const stages = {};
    contacts.forEach(contact => {
      const stage = contact.lifecycle_stage || 'Unknown';
      stages[stage] = (stages[stage] || 0) + 1;
    });

    return Object.entries(stages).map(([name, value]) => ({ name, value }));
  };

  // Campaign Performance
  const getCampaignPerformance = () => {
    return campaigns.slice(0, 5).map(campaign => ({
      name: campaign.campaign_name || 'Untitled',
      sent: campaign.total_sent || 0,
      opened: campaign.total_opened || 0,
      clicked: campaign.total_clicked || 0,
      openRate: campaign.total_sent > 0 ? ((campaign.total_opened / campaign.total_sent) * 100).toFixed(1) : 0
    }));
  };

  // Form Performance
  const getFormPerformance = () => {
    return forms.map(form => {
      const formSubmissions = submissions.filter(s => s.form_id === form.id);
      return {
        name: form.form_name,
        submissions: formSubmissions.length
      };
    }).sort((a, b) => b.submissions - a.submissions).slice(0, 5);
  };

  const pipelineData = getPipelineData();
  const contactGrowthData = getContactGrowthData();
  const revenueTrendData = getRevenueTrendData();
  const lifecycleDistribution = getLifecycleDistribution();
  const campaignPerformance = getCampaignPerformance();
  const formPerformance = getFormPerformance();

  const COLORS = ['#0066cc', '#00a86b', '#fa8c16', '#722ed1', '#eb2f96', '#52c41a'];

  const preBuiltReports = [
    { id: 'overview', name: 'Overview Dashboard', icon: BarChart3, color: '#0066cc' },
    { id: 'sales', name: 'Sales Pipeline', icon: DollarSign, color: '#00a86b' },
    { id: 'contacts', name: 'Contact Engagement', icon: Users, color: '#fa8c16' },
    { id: 'marketing', name: 'Marketing ROI', icon: Mail, color: '#722ed1' },
    { id: 'forms', name: 'Form Performance', icon: FileText, color: '#eb2f96' }
  ];

  return (
    <div className="p-8" style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#111827" }}>Advanced Reports</h1>
            <p style={{ color: "#6b7280" }}>Comprehensive analytics and insights for your CRM</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="ampvibe-input px-4 py-2"
            >
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
            </select>
            <NeuroButton onClick={() => navigate(createPageUrl("ReportBuilder"))}>
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Report
            </NeuroButton>
            <NeuroButton variant="primary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </NeuroButton>
          </div>
        </div>

        {/* Report Navigation */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {preBuiltReports.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeReport === report.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ background: 'white' }}
            >
              <report.icon className="w-6 h-6 mb-2" style={{ color: report.color }} />
              <p className="text-sm font-medium" style={{ color: "#374151" }}>{report.name}</p>
            </button>
          ))}
        </div>

        {/* Overview Dashboard */}
        {activeReport === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <NeuroCard className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Total Contacts</p>
                    <p className="text-3xl font-bold" style={{ color: "#0066cc" }}>
                      {metrics.totalContacts}
                    </p>
                    <p className="text-xs mt-2" style={{ color: "#00a86b" }}>
                      +{metrics.newContacts} new
                    </p>
                  </div>
                  <Users className="w-8 h-8" style={{ color: "#0066cc", opacity: 0.2 }} />
                </div>
              </NeuroCard>

              <NeuroCard className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Pipeline Value</p>
                    <p className="text-3xl font-bold" style={{ color: "#00a86b" }}>
                      ${(metrics.pipelineValue / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs mt-2" style={{ color: "#6b7280" }}>
                      {metrics.activeDeals} active deals
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8" style={{ color: "#00a86b", opacity: 0.2 }} />
                </div>
              </NeuroCard>

              <NeuroCard className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Total Revenue</p>
                    <p className="text-3xl font-bold" style={{ color: "#fa8c16" }}>
                      ${(metrics.totalRevenue / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs mt-2" style={{ color: "#6b7280" }}>
                      Win rate: {metrics.winRate}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8" style={{ color: "#fa8c16", opacity: 0.2 }} />
                </div>
              </NeuroCard>

              <NeuroCard className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Avg Deal Size</p>
                    <p className="text-3xl font-bold" style={{ color: "#722ed1" }}>
                      ${(metrics.avgDealSize / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs mt-2" style={{ color: "#6b7280" }}>
                      {metrics.formSubmissions} form submissions
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8" style={{ color: "#722ed1", opacity: 0.2 }} />
                </div>
              </NeuroCard>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <NeuroCard className="p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Contact Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={contactGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="contacts" stroke="#0066cc" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </NeuroCard>

              <NeuroCard className="p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#00a86b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </NeuroCard>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-2 gap-6">
              <NeuroCard className="p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Lifecycle Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={lifecycleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {lifecycleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </NeuroCard>

              <NeuroCard className="p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Sales Pipeline by Stage</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pipelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="stage" tick={{ fill: '#6b7280', fontSize: 10 }} angle={-45} textAnchor="end" height={100} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0066cc" />
                  </BarChart>
                </ResponsiveContainer>
              </NeuroCard>
            </div>
          </>
        )}

        {/* Sales Pipeline Report */}
        {activeReport === 'sales' && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <NeuroCard className="p-6">
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Total Pipeline Value</p>
                <p className="text-3xl font-bold" style={{ color: "#0066cc" }}>
                  ${(metrics.pipelineValue / 1000).toFixed(1)}k
                </p>
              </NeuroCard>

              <NeuroCard className="p-6">
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Closed Won Revenue</p>
                <p className="text-3xl font-bold" style={{ color: "#00a86b" }}>
                  ${(metrics.totalRevenue / 1000).toFixed(1)}k
                </p>
              </NeuroCard>

              <NeuroCard className="p-6">
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Win Rate</p>
                <p className="text-3xl font-bold" style={{ color: "#fa8c16" }}>
                  {metrics.winRate}%
                </p>
              </NeuroCard>
            </div>

            <NeuroCard className="p-6 mb-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Pipeline Value by Stage</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="stage" tick={{ fill: '#6b7280' }} angle={-45} textAnchor="end" height={100} />
                  <YAxis tick={{ fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00a86b" />
                </BarChart>
              </ResponsiveContainer>
            </NeuroCard>

            <NeuroCard className="p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Deal Count by Stage</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="stage" tick={{ fill: '#6b7280' }} angle={-45} textAnchor="end" height={100} />
                  <YAxis tick={{ fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0066cc" />
                </BarChart>
              </ResponsiveContainer>
            </NeuroCard>
          </>
        )}

        {/* Marketing ROI Report */}
        {activeReport === 'marketing' && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <NeuroCard className="p-6">
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Campaigns Sent</p>
                <p className="text-3xl font-bold" style={{ color: "#722ed1" }}>
                  {metrics.campaignsSent}
                </p>
              </NeuroCard>

              <NeuroCard className="p-6">
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Total Recipients</p>
                <p className="text-3xl font-bold" style={{ color: "#eb2f96" }}>
                  {campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0)}
                </p>
              </NeuroCard>

              <NeuroCard className="p-6">
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Avg Open Rate</p>
                <p className="text-3xl font-bold" style={{ color: "#52c41a" }}>
                  {campaigns.length > 0 
                    ? ((campaigns.reduce((sum, c) => sum + ((c.total_opened / (c.total_sent || 1)) * 100), 0) / campaigns.length) || 0).toFixed(1)
                    : 0}%
                </p>
              </NeuroCard>
            </div>

            <NeuroCard className="p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Campaign Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: "#374151" }}>Campaign</th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: "#374151" }}>Sent</th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: "#374151" }}>Opened</th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: "#374151" }}>Clicked</th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: "#374151" }}>Open Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignPerformance.map((campaign, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                        <td className="py-3 px-4" style={{ color: "#111827" }}>{campaign.name}</td>
                        <td className="py-3 px-4" style={{ color: "#6b7280" }}>{campaign.sent}</td>
                        <td className="py-3 px-4" style={{ color: "#6b7280" }}>{campaign.opened}</td>
                        <td className="py-3 px-4" style={{ color: "#6b7280" }}>{campaign.clicked}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium" style={{ color: "#00a86b" }}>{campaign.openRate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </NeuroCard>
          </>
        )}

        {/* Form Performance Report */}
        {activeReport === 'forms' && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <NeuroCard className="p-6">
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Total Forms</p>
                <p className="text-3xl font-bold" style={{ color: "#eb2f96" }}>
                  {forms.length}
                </p>
              </NeuroCard>

              <NeuroCard className="p-6">
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Total Submissions</p>
                <p className="text-3xl font-bold" style={{ color: "#52c41a" }}>
                  {submissions.length}
                </p>
              </NeuroCard>

              <NeuroCard className="p-6">
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Recent Submissions</p>
                <p className="text-3xl font-bold" style={{ color: "#0066cc" }}>
                  {metrics.formSubmissions}
                </p>
              </NeuroCard>
            </div>

            <NeuroCard className="p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Top Performing Forms</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={formPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fill: '#6b7280' }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#6b7280' }} width={150} />
                  <Tooltip />
                  <Bar dataKey="submissions" fill="#eb2f96" />
                </BarChart>
              </ResponsiveContainer>
            </NeuroCard>
          </>
        )}
      </div>
    </div>
  );
}