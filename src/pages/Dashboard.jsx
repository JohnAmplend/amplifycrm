import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, Building2, DollarSign, UserPlus, Plus, ArrowRight, Sparkles, TrendingUp, DollarSignIcon } from "lucide-react";
import StatCard from "../components/crm/StatCard";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list()
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list()
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 5)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  // Fetch token usage data - only for admin users
  const { data: tokenUsage = [] } = useQuery({
    queryKey: ['token-usage'],
    queryFn: () => base44.entities.Token_Usage.list('-created_date', 100),
    enabled: user?.role === 'admin'
  });

  const totalDealValue = deals.reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
  const todaysTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString() && task.status !== 'Completed';
  });

  const dealsByStage = deals.reduce((acc, deal) => {
    acc[deal.deal_stage] = (acc[deal.deal_stage] || 0) + 1;
    return acc;
  }, {});

  // Calculate token usage statistics
  const tokenStats = {
    totalTokens: tokenUsage.reduce((sum, usage) => sum + (usage.total_tokens || 0), 0),
    totalCost: tokenUsage.reduce((sum, usage) => sum + (usage.estimated_cost || 0), 0),
    todayTokens: tokenUsage
      .filter(usage => new Date(usage.created_date).toDateString() === new Date().toDateString())
      .reduce((sum, usage) => sum + (usage.total_tokens || 0), 0),
    todayCost: tokenUsage
      .filter(usage => new Date(usage.created_date).toDateString() === new Date().toDateString())
      .reduce((sum, usage) => sum + (usage.estimated_cost || 0), 0),
    thisMonthTokens: tokenUsage
      .filter(usage => {
        const date = new Date(usage.created_date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, usage) => sum + (usage.total_tokens || 0), 0),
    thisMonthCost: tokenUsage
      .filter(usage => {
        const date = new Date(usage.created_date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, usage) => sum + (usage.estimated_cost || 0), 0),
    byUser: tokenUsage.reduce((acc, usage) => {
      const email = usage.user_email;
      if (!acc[email]) {
        acc[email] = {
          name: usage.user_name || email,
          tokens: 0,
          cost: 0,
          requests: 0
        };
      }
      acc[email].tokens += usage.total_tokens || 0;
      acc[email].cost += usage.estimated_cost || 0;
      acc[email].requests += 1;
      return acc;
    }, {}),
    byModel: tokenUsage.reduce((acc, usage) => {
      const model = usage.model || 'unknown';
      if (!acc[model]) {
        acc[model] = { tokens: 0, cost: 0, requests: 0 };
      }
      acc[model].tokens += usage.total_tokens || 0;
      acc[model].cost += usage.estimated_cost || 0;
      acc[model].requests += 1;
      return acc;
    }, {})
  };

  const topUsers = Object.entries(tokenStats.byUser)
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .slice(0, 5);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
            Dashboard
          </h1>
          <p style={{ color: "#888" }}>Welcome to AmplifyCRM</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total Contacts"
            value={contacts.length}
            subtitle={`${contacts.filter(c => c.lifecycle_stage === 'Customer').length} customers`}
            color="#4a90e2"
            linkTo={createPageUrl("Contacts")}
          />
          <StatCard
            icon={Building2}
            title="Total Companies"
            value={companies.length}
            subtitle={`${companies.filter(c => c.lifecycle_stage === 'Customer').length} customers`}
            color="#52c41a"
            linkTo={createPageUrl("Companies")}
          />
          <StatCard
            icon={DollarSign}
            title="Pipeline Value"
            value={`$${(totalDealValue / 1000).toFixed(1)}k`}
            subtitle={`${deals.length} active deals`}
            color="#fa8c16"
            linkTo={createPageUrl("Deals")}
          />
          <StatCard
            icon={UserPlus}
            title="Active Leads"
            value={leads.filter(l => !l.converted_contact_id).length}
            subtitle={`${leads.filter(l => l.lead_status === 'Qualified').length} qualified`}
            color="#eb2f96"
            linkTo={createPageUrl("Leads")}
          />
        </div>

        {/* AI Token Usage - Admin Only */}
        {user?.role === 'admin' && tokenUsage.length > 0 && (
          <div className="mb-8">
            <NeuroCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="ampvibe-button-primary p-3 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                    AI Usage Analytics
                  </h2>
                  <p className="text-sm" style={{ color: "#888" }}>
                    Track ChatGPT API usage across your organization
                  </p>
                </div>
              </div>

              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="ampvibe-inset p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" style={{ color: "#00A86B" }} />
                    <p className="text-xs font-medium" style={{ color: "#888" }}>Today</p>
                  </div>
                  <p className="text-2xl font-bold mb-1" style={{ color: "#666" }}>
                    {tokenStats.todayTokens.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: "#aaa" }}>
                    ${tokenStats.todayCost.toFixed(4)}
                  </p>
                </div>

                <div className="ampvibe-inset p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" style={{ color: "#4a90e2" }} />
                    <p className="text-xs font-medium" style={{ color: "#888" }}>This Month</p>
                  </div>
                  <p className="text-2xl font-bold mb-1" style={{ color: "#666" }}>
                    {tokenStats.thisMonthTokens.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: "#aaa" }}>
                    ${tokenStats.thisMonthCost.toFixed(4)}
                  </p>
                </div>

                <div className="ampvibe-inset p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" style={{ color: "#fa8c16" }} />
                    <p className="text-xs font-medium" style={{ color: "#888" }}>Total Tokens</p>
                  </div>
                  <p className="text-2xl font-bold mb-1" style={{ color: "#666" }}>
                    {tokenStats.totalTokens.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: "#aaa" }}>
                    All time usage
                  </p>
                </div>

                <div className="ampvibe-inset p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4" style={{ color: "#eb2f96" }} />
                    <p className="text-xs font-medium" style={{ color: "#888" }}>Total Cost</p>
                  </div>
                  <p className="text-2xl font-bold mb-1" style={{ color: "#666" }}>
                    ${tokenStats.totalCost.toFixed(2)}
                  </p>
                  <p className="text-xs" style={{ color: "#aaa" }}>
                    Estimated spend
                  </p>
                </div>
              </div>

              {/* Top Users & Models */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Users */}
                <div>
                  <h3 className="text-sm font-bold mb-3" style={{ color: "#666" }}>
                    Top Users by Token Usage
                  </h3>
                  <div className="space-y-2">
                    {topUsers.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: "#aaa" }}>
                        No usage data yet
                      </p>
                    ) : (
                      topUsers.map(([email, stats]) => (
                        <div key={email} className="ampvibe-inset p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm" style={{ color: "#666" }}>
                              {stats.name}
                            </p>
                            <span className="ampvibe-button px-2 py-1 text-xs font-bold">
                              {stats.tokens.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs" style={{ color: "#aaa" }}>
                            <span>{stats.requests} requests</span>
                            <span>${stats.cost.toFixed(4)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Models */}
                <div>
                  <h3 className="text-sm font-bold mb-3" style={{ color: "#666" }}>
                    Usage by Model
                  </h3>
                  <div className="space-y-2">
                    {Object.keys(tokenStats.byModel).length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: "#aaa" }}>
                        No usage data yet
                      </p>
                    ) : (
                      Object.entries(tokenStats.byModel).map(([model, stats]) => (
                        <div key={model} className="ampvibe-inset p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm" style={{ color: "#666" }}>
                              {model}
                            </p>
                            <span className="ampvibe-button px-2 py-1 text-xs font-bold">
                              {stats.tokens.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs" style={{ color: "#aaa" }}>
                            <span>{stats.requests} requests</span>
                            <span>${stats.cost.toFixed(4)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Usage */}
              <div className="mt-6">
                <h3 className="text-sm font-bold mb-3" style={{ color: "#666" }}>
                  Recent API Calls
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tokenUsage.slice(0, 10).map((usage) => (
                    <div key={usage.id} className="ampvibe-inset p-3 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm" style={{ color: "#666" }}>
                              {usage.user_name || usage.user_email}
                            </p>
                            <span className="ampvibe-button px-2 py-0.5 text-xs">
                              {usage.action_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs" style={{ color: "#aaa" }}>
                            <span>{usage.model}</span>
                            <span>•</span>
                            <span>{usage.total_tokens.toLocaleString()} tokens</span>
                            <span>•</span>
                            <span>${usage.estimated_cost.toFixed(6)}</span>
                            <span>•</span>
                            <span>{new Date(usage.created_date).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </NeuroCard>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <NeuroCard>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to={createPageUrl("Contacts") + "?action=new"}>
                <NeuroButton className="w-full flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Contact
                </NeuroButton>
              </Link>
              <Link to={createPageUrl("Companies") + "?action=new"}>
                <NeuroButton className="w-full flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Company
                </NeuroButton>
              </Link>
              <Link to={createPageUrl("Deals") + "?action=new"}>
                <NeuroButton className="w-full flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Deal
                </NeuroButton>
              </Link>
              <Link to={createPageUrl("Leads") + "?action=new"}>
                <NeuroButton className="w-full flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Lead
                </NeuroButton>
              </Link>
            </div>
          </NeuroCard>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <NeuroCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                Recent Activities
              </h2>
              <Link to={createPageUrl("Activities")}>
                <NeuroButton size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </NeuroButton>
              </Link>
            </div>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-center py-8" style={{ color: "#aaa" }}>
                  No activities yet
                </p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="neuro-inset p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium mb-1" style={{ color: "#666" }}>
                          {activity.subject}
                        </p>
                        <p className="text-sm mb-2" style={{ color: "#999" }}>
                          {activity.description?.substring(0, 80)}...
                        </p>
                        <div className="flex items-center gap-2 text-xs" style={{ color: "#aaa" }}>
                          <span className="neuro-button px-2 py-1 text-xs">
                            {activity.activity_type}
                          </span>
                          <span>
                            {new Date(activity.activity_date || activity.created_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </NeuroCard>

          {/* Tasks Due Today */}
          <NeuroCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                Tasks Due Today
              </h2>
              <Link to={createPageUrl("Tasks")}>
                <NeuroButton size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </NeuroButton>
              </Link>
            </div>
            <div className="space-y-3">
              {todaysTasks.length === 0 ? (
                <p className="text-center py-8" style={{ color: "#aaa" }}>
                  No tasks due today
                </p>
              ) : (
                todaysTasks.map((task) => (
                  <div key={task.id} className="neuro-inset p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium mb-1" style={{ color: "#666" }}>
                          {task.task_name}
                        </p>
                        {task.description && (
                          <p className="text-sm mb-2" style={{ color: "#999" }}>
                            {task.description.substring(0, 60)}...
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs" style={{ color: "#aaa" }}>
                          <span className={`neuro-button px-2 py-1 text-xs ${
                            task.priority === 'High' ? 'text-red-600' :
                            task.priority === 'Medium' ? 'text-orange-600' : ''
                          }`}>
                            {task.priority}
                          </span>
                          <span>{task.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </NeuroCard>

          {/* Deal Pipeline Summary */}
          <NeuroCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                Deal Pipeline
              </h2>
              <Link to={createPageUrl("Deals")}>
                <NeuroButton size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </NeuroButton>
              </Link>
            </div>
            <div className="space-y-3">
              {Object.keys(dealsByStage).length === 0 ? (
                <p className="text-center py-8" style={{ color: "#aaa" }}>
                  No deals in pipeline
                </p>
              ) : (
                Object.entries(dealsByStage).map(([stage, count]) => (
                  <div key={stage} className="neuro-inset p-3 rounded-lg flex items-center justify-between">
                    <span className="font-medium" style={{ color: "#666" }}>
                      {stage}
                    </span>
                    <span className="neuro-button px-3 py-1 text-sm font-bold" style={{ color: "#4a90e2" }}>
                      {count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </NeuroCard>
        </div>
      </div>
    </div>
  );
}