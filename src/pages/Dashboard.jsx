import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, Building2, DollarSign, UserPlus, Plus, ArrowRight } from "lucide-react";
import StatCard from "../components/crm/StatCard";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function Dashboard() {
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
          />
          <StatCard
            icon={Building2}
            title="Total Companies"
            value={companies.length}
            subtitle={`${companies.filter(c => c.lifecycle_stage === 'Customer').length} customers`}
            color="#52c41a"
          />
          <StatCard
            icon={DollarSign}
            title="Pipeline Value"
            value={`$${(totalDealValue / 1000).toFixed(1)}k`}
            subtitle={`${deals.length} active deals`}
            color="#fa8c16"
          />
          <StatCard
            icon={UserPlus}
            title="Active Leads"
            value={leads.filter(l => !l.converted_contact_id).length}
            subtitle={`${leads.filter(l => l.lead_status === 'Qualified').length} qualified`}
            color="#eb2f96"
          />
        </div>

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