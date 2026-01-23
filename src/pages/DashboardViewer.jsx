import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Edit2, Plus, X, FileText } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import { toast } from "../components/crm/useToast";

export default function DashboardViewer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dashboardId, setDashboardId] = useState(null);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState("");

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

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Reports.list('-created_date')
  });

  const { data: customTrackerReports = [] } = useQuery({
    queryKey: ['custom-tracker-reports'],
    queryFn: () => base44.entities.Custom_Tracker_Report.list('-created_date')
  });

  const addReportMutation = useMutation({
    mutationFn: (data) => base44.entities.Dashboard_Widgets.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['widgets', dashboardId]);
      toast.success('Report added to dashboard');
      setShowAddReportModal(false);
      setSelectedReport("");
    },
    onError: () => toast.error('Failed to add report')
  });

  const handleAddReport = () => {
    if (!selectedReport) return;
    
    const [type, id] = selectedReport.split('|');
    const reportData = type === 'report' 
      ? reports.find(r => r.id === id)
      : customTrackerReports.find(r => r.id === id);
    
    if (!reportData) return;

    addReportMutation.mutate({
      dashboard_id: dashboardId,
      widget_type: type === 'report' ? 'Report' : 'Tracker Report',
      widget_title: reportData.report_name || reportData.name,
      configuration: {
        report_type: type,
        report_id: id
      },
      position_x: 0,
      position_y: widgets.length,
      width: 2,
      height: 2
    });
  };

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
            <NeuroButton onClick={() => setShowAddReportModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Report
            </NeuroButton>
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

      {/* Add Report Modal */}
      {showAddReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <NeuroCard className="max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#1E3A8A" }}>
                Add Existing Report
              </h2>
              <button onClick={() => setShowAddReportModal(false)} className="ampvibe-button p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#666" }}>
                  Select Report
                </label>
                <select
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  className="ampvibe-input w-full"
                >
                  <option value="">Choose a report...</option>
                  {reports.length > 0 && (
                    <optgroup label="Custom Reports">
                      {reports.map(report => (
                        <option key={report.id} value={`report|${report.id}`}>
                          {report.report_name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {customTrackerReports.length > 0 && (
                    <optgroup label="Tracker Reports">
                      {customTrackerReports.map(report => (
                        <option key={report.id} value={`tracker|${report.id}`}>
                          {report.report_name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {selectedReport && (
                <div className="ampvibe-inset p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5" style={{ color: "#00A86B" }} />
                    <p className="font-medium text-sm" style={{ color: "#666" }}>
                      Selected: {selectedReport.split('|')[0] === 'report' 
                        ? reports.find(r => r.id === selectedReport.split('|')[1])?.report_name
                        : customTrackerReports.find(r => r.id === selectedReport.split('|')[1])?.report_name}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "#888" }}>
                    This report will be added as a widget to your dashboard
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <NeuroButton onClick={() => setShowAddReportModal(false)}>
                  Cancel
                </NeuroButton>
                <NeuroButton 
                  variant="primary" 
                  onClick={handleAddReport}
                  disabled={!selectedReport}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Report
                </NeuroButton>
              </div>
            </div>
          </NeuroCard>
        </div>
      )}
    </div>
  );
}