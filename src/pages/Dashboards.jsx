import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Sparkles, Layout, Edit2, Trash2, Eye, TrendingUp, AlertTriangle, Zap, MessageSquare, RefreshCw } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";

export default function Dashboards() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAIModal, setShowAIModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: dashboards = [] } = useQuery({
    queryKey: ['dashboards'],
    queryFn: () => base44.entities.Dashboards.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Dashboards.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboards']);
    }
  });

  return (
    <div className="p-8" style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#111827" }}>Dashboards</h1>
            <p style={{ color: "#6b7280" }}>Monitor your CRM performance at a glance</p>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={() => setShowAIModal(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Dashboard Builder
            </NeuroButton>
            <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("DashboardBuilder"))}>
              <Plus className="w-4 h-4 mr-2" />
              Create Dashboard
            </NeuroButton>
          </div>
        </div>

        {/* Dashboards Grid */}
        <div className="grid grid-cols-3 gap-4">
          {dashboards.map((dashboard) => (
            <NeuroCard key={dashboard.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(createPageUrl("DashboardViewer") + `?id=${dashboard.id}`)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="ampvibe-inset p-2 rounded-lg">
                    <Layout className="w-6 h-6" style={{ color: "#0066cc" }} />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: "#111827" }}>{dashboard.dashboard_name}</h3>
                    {dashboard.is_default && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">Default</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button className="ampvibe-button p-2">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(dashboard.id)} className="ampvibe-button p-2 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                {dashboard.dashboard_description}
              </p>
              <div className="flex items-center justify-between text-xs" style={{ color: "#9ca3af" }}>
                <span>{dashboard.is_shared ? 'Shared' : 'Private'}</span>
                <span>Created {new Date(dashboard.created_date).toLocaleDateString()}</span>
              </div>
            </NeuroCard>
          ))}
        </div>

        {dashboards.length === 0 && (
          <NeuroCard className="p-12 text-center">
            <Layout className="w-16 h-16 mx-auto mb-4" style={{ color: "#d1d5db" }} />
            <p className="text-lg font-medium mb-2" style={{ color: "#6b7280" }}>
              No dashboards yet
            </p>
            <p className="text-sm mb-6" style={{ color: "#9ca3af" }}>
              Create custom dashboards to visualize your data
            </p>
            <div className="flex gap-3 justify-center">
              <NeuroButton onClick={() => setShowAIModal(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Builder
              </NeuroButton>
              <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("DashboardBuilder"))}>
                <Plus className="w-4 h-4 mr-2" />
                Create Manually
              </NeuroButton>
            </div>
          </NeuroCard>
        )}
      </div>

      {/* AI Dashboard Builder Modal */}
      {showAIModal && (
        <AIDashboardBuilder
          onClose={() => setShowAIModal(false)}
          onSuccess={() => {
            setShowAIModal(false);
            queryClient.invalidateQueries(['dashboards']);
          }}
          userRole={currentUser?.role}
        />
      )}
    </div>
  );
}

function AIDashboardBuilder({ onClose, onSuccess, userRole }) {
  const [step, setStep] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedDashboard, setGeneratedDashboard] = useState(null);
  const [naturalQuery, setNaturalQuery] = useState("");
  const [queryResult, setQueryResult] = useState(null);

  const [config, setConfig] = useState({
    role: userRole || "Sales Manager",
    industry: "Technology",
    focus_areas: "Sales Pipeline",
    time_range: "Last 30 Days"
  });

  const generateDashboard = async () => {
    setAiLoading(true);
    try {
      const prompt = `Generate an optimized dashboard configuration for:

User Role: ${config.role}
Industry: ${config.industry}
Focus Areas: ${config.focus_areas}
Time Range: ${config.time_range}

Analyze CRM best practices for this role and industry to create a dashboard that includes:

1. Key Metrics (KPIs) - most important numbers to track
2. Charts & Visualizations - trend analysis and comparisons
3. Insights & Alerts - predictive insights and anomaly detection
4. Quick Actions - contextual actions based on data

For the dashboard, provide:
- dashboard_name: Descriptive name
- dashboard_description: What this dashboard shows
- layout_strategy: How widgets should be arranged
- refresh_frequency: How often to update data

For each widget (provide 6-8 widgets):
- widget_title: Clear, actionable title
- widget_type: "KPI", "Chart", "Table", "Insight", "Alert"
- data_source: What data to display
- chart_type: "line", "bar", "pie", "number", etc.
- size: "small", "medium", "large"
- position: Suggested position (row, column)
- insight_type: For insights - "predictive", "anomaly", "recommendation"
- alert_conditions: For alerts - when to trigger
- priority: "high", "medium", "low"

Also provide:
- predictive_insights: 3 AI-generated insights about the data
- anomalies_detected: 2-3 potential anomalies to watch
- optimization_recommendations: 3 recommendations to improve performance

Format as JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            dashboard_name: { type: "string" },
            dashboard_description: { type: "string" },
            layout_strategy: { type: "string" },
            refresh_frequency: { type: "string" },
            widgets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  widget_title: { type: "string" },
                  widget_type: { type: "string" },
                  data_source: { type: "string" },
                  chart_type: { type: "string" },
                  size: { type: "string" },
                  position: { type: "object" },
                  insight_type: { type: "string" },
                  alert_conditions: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            predictive_insights: { type: "array", items: { type: "string" } },
            anomalies_detected: { type: "array", items: { type: "string" } },
            optimization_recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGeneratedDashboard(result);
      setStep(2);
    } catch (error) {
      alert('Failed to generate dashboard: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const askNaturalQuery = async () => {
    if (!naturalQuery.trim()) return;

    setAiLoading(true);
    try {
      const prompt = `User asked: "${naturalQuery}"

Based on this question about their CRM data, generate:
1. A clear interpretation of what they're asking
2. The type of visualization needed (chart, table, number)
3. Data they need to see
4. A recommendation on next steps

Format as JSON with:
- interpretation: What the user wants to know
- visualization_type: Best way to show this data
- chart_config: Configuration for the chart
- data_description: What data to fetch
- next_steps: Recommended actions
- insight: Key insight about this metric`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            interpretation: { type: "string" },
            visualization_type: { type: "string" },
            chart_config: { type: "object" },
            data_description: { type: "string" },
            next_steps: { type: "array", items: { type: "string" } },
            insight: { type: "string" }
          }
        }
      });

      setQueryResult(result);
    } catch (error) {
      alert('Failed to process query: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const createDashboard = async () => {
    try {
      const dashboard = await base44.entities.Dashboards.create({
        dashboard_name: generatedDashboard.dashboard_name,
        dashboard_description: generatedDashboard.dashboard_description,
        layout: {
          strategy: generatedDashboard.layout_strategy,
          refresh_frequency: generatedDashboard.refresh_frequency
        },
        is_shared: false,
        is_default: false
      });

      // Create widgets
      await Promise.all(generatedDashboard.widgets.map(widget =>
        base44.entities.Dashboard_Widgets.create({
          dashboard_id: dashboard.id,
          widget_type: widget.widget_type,
          widget_title: widget.widget_title,
          configuration: {
            data_source: widget.data_source,
            chart_type: widget.chart_type,
            size: widget.size,
            insight_type: widget.insight_type,
            alert_conditions: widget.alert_conditions,
            priority: widget.priority
          },
          position_x: widget.position.column || 0,
          position_y: widget.position.row || 0,
          width: widget.size === 'large' ? 2 : 1,
          height: widget.size === 'large' ? 2 : 1
        })
      ));

      onSuccess();
    } catch (error) {
      alert('Failed to create dashboard: ' + error.message);
    }
  };

  const getWidgetIcon = (type) => {
    const icons = { KPI: TrendingUp, Chart: Layout, Insight: Sparkles, Alert: AlertTriangle };
    return icons[type] || Layout;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="ampvibe-inset p-2 rounded-lg">
                <Sparkles className="w-6 h-6" style={{ color: "#722ed1" }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#111827" }}>AI Dashboard Builder</h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  {step === 1 ? 'Configure your dashboard' : 'Review and customize'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="ampvibe-button p-2">
              <Eye className="w-5 h-5" />
            </button>
          </div>

          {/* Natural Language Query */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5" style={{ color: "#0066cc" }} />
              <p className="font-medium" style={{ color: "#0066cc" }}>Ask about your data</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={naturalQuery}
                onChange={(e) => setNaturalQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && askNaturalQuery()}
                placeholder="e.g., 'Show me my top performing sales reps this quarter'"
                className="ampvibe-input flex-1"
              />
              <NeuroButton onClick={askNaturalQuery} disabled={aiLoading}>
                {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Ask'}
              </NeuroButton>
            </div>
            {queryResult && (
              <div className="mt-3 p-3 bg-white rounded">
                <p className="text-sm font-medium mb-2" style={{ color: "#374151" }}>
                  {queryResult.interpretation}
                </p>
                <p className="text-xs mb-2" style={{ color: "#6b7280" }}>
                  Visualization: {queryResult.visualization_type}
                </p>
                <p className="text-sm font-medium mb-1" style={{ color: "#0066cc" }}>Insight:</p>
                <p className="text-sm" style={{ color: "#374151" }}>{queryResult.insight}</p>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {step === 1 && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <NeuroInput
                  label="User Role"
                  value={config.role}
                  onChange={(e) => setConfig({ ...config, role: e.target.value })}
                  placeholder="e.g., Sales Manager"
                />
                <NeuroInput
                  label="Industry"
                  value={config.industry}
                  onChange={(e) => setConfig({ ...config, industry: e.target.value })}
                  placeholder="e.g., Technology"
                />
                <NeuroInput
                  label="Focus Areas"
                  value={config.focus_areas}
                  onChange={(e) => setConfig({ ...config, focus_areas: e.target.value })}
                  placeholder="e.g., Sales Pipeline, Lead Gen"
                />
                <NeuroInput
                  label="Time Range"
                  value={config.time_range}
                  onChange={(e) => setConfig({ ...config, time_range: e.target.value })}
                  placeholder="e.g., Last 30 Days"
                />
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="font-bold mb-3" style={{ color: "#722ed1" }}>What AI will create:</p>
                <ul className="space-y-2 text-sm" style={{ color: "#374151" }}>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 mt-0.5" style={{ color: "#722ed1" }} />
                    <span>Role-specific KPI widgets tailored to {config.role}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 mt-0.5" style={{ color: "#722ed1" }} />
                    <span>Predictive insights and trend analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: "#722ed1" }} />
                    <span>Anomaly detection and smart alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Layout className="w-4 h-4 mt-0.5" style={{ color: "#722ed1" }} />
                    <span>Optimized layout based on {config.industry} best practices</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === 2 && generatedDashboard && (
            <div className="space-y-6">
              {/* Dashboard Overview */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-bold mb-2" style={{ color: "#722ed1" }}>
                  {generatedDashboard.dashboard_name}
                </h3>
                <p className="text-sm mb-2" style={{ color: "#374151" }}>
                  {generatedDashboard.dashboard_description}
                </p>
                <div className="flex items-center gap-4 text-xs" style={{ color: "#6b7280" }}>
                  <span>Strategy: {generatedDashboard.layout_strategy}</span>
                  <span>Refresh: {generatedDashboard.refresh_frequency}</span>
                </div>
              </div>

              {/* Widgets Grid */}
              <div>
                <h4 className="font-bold mb-3" style={{ color: "#111827" }}>Dashboard Widgets:</h4>
                <div className="grid grid-cols-2 gap-4">
                  {generatedDashboard.widgets.map((widget, idx) => {
                    const Icon = getWidgetIcon(widget.widget_type);
                    return (
                      <div key={idx} className={`p-4 border-2 rounded-lg ${widget.priority === 'high' ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                        <div className="flex items-start gap-2 mb-2">
                          <Icon className="w-5 h-5" style={{ color: widget.priority === 'high' ? '#dc2626' : '#0066cc' }} />
                          <div className="flex-1">
                            <p className="font-bold text-sm" style={{ color: "#111827" }}>{widget.widget_title}</p>
                            <p className="text-xs" style={{ color: "#6b7280" }}>{widget.widget_type} • {widget.size}</p>
                          </div>
                        </div>
                        <p className="text-xs mb-2" style={{ color: "#374151" }}>{widget.data_source}</p>
                        {widget.insight_type && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                            {widget.insight_type}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Insights */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-bold mb-2 text-sm" style={{ color: "#0066cc" }}>Predictive Insights:</p>
                  <ul className="space-y-1 text-xs">
                    {generatedDashboard.predictive_insights.map((insight, idx) => (
                      <li key={idx} style={{ color: "#374151" }}>• {insight}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="font-bold mb-2 text-sm" style={{ color: "#fa8c16" }}>Anomalies Detected:</p>
                  <ul className="space-y-1 text-xs">
                    {generatedDashboard.anomalies_detected.map((anomaly, idx) => (
                      <li key={idx} style={{ color: "#374151" }}>⚠️ {anomaly}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-bold mb-2 text-sm" style={{ color: "#52c41a" }}>Recommendations:</p>
                  <ul className="space-y-1 text-xs">
                    {generatedDashboard.optimization_recommendations.map((rec, idx) => (
                      <li key={idx} style={{ color: "#374151" }}>✓ {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between" style={{ borderColor: "#e5e7eb" }}>
          <NeuroButton onClick={onClose}>
            Cancel
          </NeuroButton>
          {step === 1 ? (
            <NeuroButton variant="primary" onClick={generateDashboard} disabled={aiLoading}>
              {aiLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Dashboard
                </>
              )}
            </NeuroButton>
          ) : (
            <NeuroButton variant="primary" onClick={createDashboard}>
              Create Dashboard
            </NeuroButton>
          )}
        </div>
      </div>
    </div>
  );
}