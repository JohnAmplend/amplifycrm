import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, TrendingUp, DollarSign, Users, BarChart3, 
  Loader2, Brain, Zap, AlertCircle, Target, Calendar
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function AITokenAnalytics() {
  const [user, setUser] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30days");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tokenUsage = [], isLoading } = useQuery({
    queryKey: ['token-usage-analytics'],
    queryFn: () => base44.entities.Token_Usage.list('-created_date', 1000),
    enabled: user?.role === 'admin'
  });

  // Filter data by time range
  const filteredData = tokenUsage.filter(usage => {
    const date = new Date(usage.created_date);
    const now = new Date();
    const daysAgo = selectedTimeRange === '7days' ? 7 : selectedTimeRange === '30days' ? 30 : 90;
    const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return date >= cutoff;
  });

  // Calculate statistics
  const stats = {
    totalTokens: filteredData.reduce((sum, u) => sum + (u.total_tokens || 0), 0),
    totalCost: filteredData.reduce((sum, u) => sum + (u.estimated_cost || 0), 0),
    totalRequests: filteredData.length,
    avgTokensPerRequest: filteredData.length > 0 ? Math.round(filteredData.reduce((sum, u) => sum + (u.total_tokens || 0), 0) / filteredData.length) : 0,
    byUser: filteredData.reduce((acc, u) => {
      const email = u.user_email;
      if (!acc[email]) acc[email] = { name: u.user_name || email, tokens: 0, cost: 0, requests: 0 };
      acc[email].tokens += u.total_tokens || 0;
      acc[email].cost += u.estimated_cost || 0;
      acc[email].requests += 1;
      return acc;
    }, {}),
    byModel: filteredData.reduce((acc, u) => {
      const model = u.model || 'unknown';
      if (!acc[model]) acc[model] = { tokens: 0, cost: 0, requests: 0 };
      acc[model].tokens += u.total_tokens || 0;
      acc[model].cost += u.estimated_cost || 0;
      acc[model].requests += 1;
      return acc;
    }, {}),
    byAction: filteredData.reduce((acc, u) => {
      const action = u.action_type || 'unknown';
      if (!acc[action]) acc[action] = { tokens: 0, cost: 0, requests: 0 };
      acc[action].tokens += u.total_tokens || 0;
      acc[action].cost += u.estimated_cost || 0;
      acc[action].requests += 1;
      return acc;
    }, {})
  };

  // Daily usage for line chart
  const dailyUsage = filteredData.reduce((acc, u) => {
    const date = new Date(u.created_date).toLocaleDateString();
    if (!acc[date]) acc[date] = { date, tokens: 0, cost: 0, requests: 0 };
    acc[date].tokens += u.total_tokens || 0;
    acc[date].cost += u.estimated_cost || 0;
    acc[date].requests += 1;
    return acc;
  }, {});
  const dailyData = Object.values(dailyUsage).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Top users for bar chart
  const topUsersData = Object.entries(stats.byUser)
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .slice(0, 10)
    .map(([email, data]) => ({ name: data.name, tokens: data.tokens, cost: data.cost }));

  // Model distribution for pie chart
  const modelData = Object.entries(stats.byModel).map(([model, data]) => ({
    name: model,
    value: data.requests,
    tokens: data.tokens,
    cost: data.cost
  }));

  // Action type distribution
  const actionData = Object.entries(stats.byAction).map(([action, data]) => ({
    name: action,
    value: data.requests,
    tokens: data.tokens
  }));

  const COLORS = ['#00A86B', '#4a90e2', '#fa8c16', '#eb2f96', '#52c41a', '#722ed1', '#13c2c2'];

  const generateAIInsights = async () => {
    setIsAnalyzing(true);
    try {
      const { data } = await base44.functions.invoke('aiAssistant', {
        action: 'analyze_data',
        prompt: `Analyze this AI token usage data and provide insights on:
1. User behavior patterns (who uses it most, when, for what)
2. Cost optimization opportunities (which models/actions are most expensive)
3. Model performance (which models are most efficient)
4. Usage trends and predictions
5. Actionable recommendations

Data summary:
- Total tokens: ${stats.totalTokens.toLocaleString()}
- Total cost: $${stats.totalCost.toFixed(2)}
- Total requests: ${stats.totalRequests}
- Avg tokens/request: ${stats.avgTokensPerRequest}
- Time range: ${selectedTimeRange}
- Top users: ${JSON.stringify(topUsersData.slice(0, 5))}
- Model distribution: ${JSON.stringify(modelData)}
- Action types: ${JSON.stringify(actionData)}

Provide specific, actionable insights with numbers.`,
        context: {}
      });

      setAiInsights(data.response);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00A86B" }} />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="p-8">
        <NeuroCard className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#fa8c16" }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#666" }}>
            Access Restricted
          </h2>
          <p style={{ color: "#888" }}>
            This page is only accessible to administrators.
          </p>
          <Link to={createPageUrl("Dashboard")}>
            <NeuroButton variant="primary" className="mt-4">
              Return to Dashboard
            </NeuroButton>
          </Link>
        </NeuroCard>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00A86B" }} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="ampvibe-button-primary p-3 rounded-xl">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#666" }}>
                AI Token Analytics
              </h1>
              <p style={{ color: "#888" }}>
                AI-powered insights on ChatGPT usage, costs, and optimization
              </p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {['7days', '30days', '90days'].map(range => (
              <NeuroButton
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={selectedTimeRange === range ? 'active' : ''}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {range === '7days' ? 'Last 7 Days' : range === '30days' ? 'Last 30 Days' : 'Last 90 Days'}
              </NeuroButton>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <NeuroCard>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5" style={{ color: "#00A86B" }} />
              <p className="text-sm font-medium" style={{ color: "#888" }}>Total Tokens</p>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: "#666" }}>
              {stats.totalTokens.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: "#aaa" }}>
              {stats.avgTokensPerRequest} avg/request
            </p>
          </NeuroCard>

          <NeuroCard>
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5" style={{ color: "#fa8c16" }} />
              <p className="text-sm font-medium" style={{ color: "#888" }}>Total Cost</p>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: "#666" }}>
              ${stats.totalCost.toFixed(2)}
            </p>
            <p className="text-xs" style={{ color: "#aaa" }}>
              ${(stats.totalCost / stats.totalRequests).toFixed(4)} avg/request
            </p>
          </NeuroCard>

          <NeuroCard>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5" style={{ color: "#4a90e2" }} />
              <p className="text-sm font-medium" style={{ color: "#888" }}>Total Requests</p>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: "#666" }}>
              {stats.totalRequests}
            </p>
            <p className="text-xs" style={{ color: "#aaa" }}>
              {Object.keys(stats.byUser).length} unique users
            </p>
          </NeuroCard>

          <NeuroCard>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5" style={{ color: "#eb2f96" }} />
              <p className="text-sm font-medium" style={{ color: "#888" }}>Active Users</p>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: "#666" }}>
              {Object.keys(stats.byUser).length}
            </p>
            <p className="text-xs" style={{ color: "#aaa" }}>
              {Object.keys(stats.byModel).length} models used
            </p>
          </NeuroCard>
        </div>

        {/* AI Insights */}
        <NeuroCard className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="ampvibe-button-primary p-2 rounded-lg">
                <Brain className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                AI-Powered Insights
              </h2>
            </div>
            <NeuroButton variant="primary" onClick={generateAIInsights} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Insights
                </>
              )}
            </NeuroButton>
          </div>

          {aiInsights ? (
            <div className="ampvibe-inset p-6 rounded-xl whitespace-pre-wrap" style={{ color: "#666" }}>
              {aiInsights}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: "#aaa" }}>
              <Target className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.5 }} />
              <p>Click "Generate Insights" to get AI-powered analysis of your token usage data</p>
            </div>
          )}
        </NeuroCard>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Usage Trend */}
          <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#666" }}>
              Daily Token Usage Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 58, 138, 0.1)" />
                <XAxis dataKey="date" stroke="#888" style={{ fontSize: '12px' }} />
                <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(30, 58, 138, 0.2)', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="tokens" stroke="#00A86B" strokeWidth={2} name="Tokens" />
                <Line type="monotone" dataKey="requests" stroke="#4a90e2" strokeWidth={2} name="Requests" />
              </LineChart>
            </ResponsiveContainer>
          </NeuroCard>

          {/* Top Users */}
          <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#666" }}>
              Top 10 Users by Token Usage
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topUsersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 58, 138, 0.1)" />
                <XAxis dataKey="name" stroke="#888" style={{ fontSize: '12px' }} angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(30, 58, 138, 0.2)', borderRadius: '8px' }} />
                <Bar dataKey="tokens" fill="#00A86B" name="Tokens" />
              </BarChart>
            </ResponsiveContainer>
          </NeuroCard>

          {/* Model Distribution */}
          <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#666" }}>
              Model Usage Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {modelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(30, 58, 138, 0.2)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </NeuroCard>

          {/* Action Types */}
          <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#666" }}>
              Usage by Action Type
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={actionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 58, 138, 0.1)" />
                <XAxis type="number" stroke="#888" style={{ fontSize: '12px' }} />
                <YAxis type="category" dataKey="name" stroke="#888" style={{ fontSize: '12px' }} width={120} />
                <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(30, 58, 138, 0.2)', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#4a90e2" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </NeuroCard>
        </div>

        {/* Detailed Tables */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Users Detail */}
          <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#666" }}>
              User Breakdown
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(stats.byUser)
                .sort((a, b) => b[1].tokens - a[1].tokens)
                .map(([email, data]) => (
                  <div key={email} className="ampvibe-inset p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm" style={{ color: "#666" }}>{data.name}</p>
                      <span className="ampvibe-button px-2 py-1 text-xs font-bold">
                        {data.tokens.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs" style={{ color: "#aaa" }}>
                      <span>{data.requests} requests</span>
                      <span>${data.cost.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </NeuroCard>

          {/* Models Detail */}
          <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#666" }}>
              Model Performance
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.byModel)
                .sort((a, b) => b[1].tokens - a[1].tokens)
                .map(([model, data]) => (
                  <div key={model} className="ampvibe-inset p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm" style={{ color: "#666" }}>{model}</p>
                      <span className="ampvibe-button px-2 py-1 text-xs font-bold">
                        {data.tokens.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs" style={{ color: "#aaa" }}>
                      <span>{data.requests} requests • {Math.round(data.tokens / data.requests)} avg tokens</span>
                      <span>${data.cost.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </NeuroCard>
        </div>
      </div>
    </div>
  );
}