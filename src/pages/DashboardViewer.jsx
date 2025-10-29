import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Edit2 } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function DashboardViewer() {
  const navigate = useNavigate();
  const [dashboardId, setDashboardId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setDashboardId(urlParams.get('id'));
  }, []);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: () => base44.entities.Dashboards.filter({ id: dashboardId }),
    enabled: !!dashboardId,
    select: (data) => data[0]
  });

  const { data: widgets = [], isLoading: widgetsLoading } = useQuery({
    queryKey: ['widgets', dashboardId],
    queryFn: () => base44.entities.Dashboard_Widgets.filter({ dashboard_id: dashboardId }),
    enabled: !!dashboardId
  });

  if (dashboardLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Dashboard not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeuroButton onClick={() => navigate(createPageUrl("Dashboards"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                {dashboard.dashboard_name}
              </h1>
              {dashboard.dashboard_description && (
                <p style={{ color: "#888" }}>{dashboard.dashboard_description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            {dashboard.is_default && (
              <span className="ampvibe-button px-3 py-2 text-green-600">
                Default Dashboard
              </span>
            )}
            {dashboard.is_shared && (
              <span className="ampvibe-button px-3 py-2 text-blue-600">
                Shared
              </span>
            )}
          </div>
        </div>

        {/* Widgets Grid */}
        {widgetsLoading ? (
          <NeuroCard>
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading widgets...
            </div>
          </NeuroCard>
        ) : widgets.length === 0 ? (
          <NeuroCard>
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: "#aaa" }}>
                No widgets configured for this dashboard
              </p>
              <p className="text-sm" style={{ color: "#aaa" }}>
                Widgets can be added when creating or editing a dashboard
              </p>
            </div>
          </NeuroCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgets.map((widget) => (
              <NeuroCard key={widget.id}>
                <div className="mb-4">
                  <h3 className="font-bold text-lg" style={{ color: "#666" }}>
                    {widget.widget_title}
                  </h3>
                  <p className="text-sm" style={{ color: "#888" }}>
                    {widget.widget_type}
                  </p>
                </div>
                <div className="ampvibe-inset p-6 rounded-lg text-center">
                  <p style={{ color: "#aaa" }}>
                    Widget data visualization will appear here
                  </p>
                  {widget.report_id && (
                    <p className="text-xs mt-2" style={{ color: "#aaa" }}>
                      Report ID: {widget.report_id}
                    </p>
                  )}
                </div>
              </NeuroCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}