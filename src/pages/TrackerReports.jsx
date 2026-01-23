import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, AlertCircle, Clock, Download, Filter, Plus, Share2, Save, X, Eye, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import { toast } from "../components/crm/useToast";

export default function TrackerReports() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [timeRange, setTimeRange] = useState("week"); // week, month, quarter, year
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [customReportForm, setCustomReportForm] = useState({
    report_name: "",
    description: "",
    metrics: ["total", "completed", "inProgress", "overdue", "avgCompletionTime"],
    charts: ["weeklyCompletion", "statusDistribution", "columnDistribution", "priorityDistribution"],
    time_range: "week",
    board_id: null
  });
  const [shareEmails, setShareEmails] = useState([]);
  const [shareEmail, setShareEmail] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: boards = [] } = useQuery({
    queryKey: ['tracker-boards'],
    queryFn: () => base44.entities.Tracker_Board.list('position')
  });

  const { data: columns = [] } = useQuery({
    queryKey: ['tracker-columns'],
    queryFn: () => base44.entities.Tracker_Column.list()
  });

  const { data: cards = [] } = useQuery({
    queryKey: ['tracker-cards'],
    queryFn: () => base44.entities.Tracker_Card.list()
  });

  const { data: customReports = [] } = useQuery({
    queryKey: ['custom-tracker-reports'],
    queryFn: async () => {
      const allReports = await base44.entities.Custom_Tracker_Report.list('-created_date');
      return allReports.filter(r => 
        r.created_by === currentUser?.email || 
        r.is_public || 
        (r.shared_with || []).includes(currentUser?.email)
      );
    },
    enabled: !!currentUser
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const createReportMutation = useMutation({
    mutationFn: (data) => base44.entities.Custom_Tracker_Report.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-tracker-reports']);
      toast.success('Custom report created successfully');
      setShowCustomReportModal(false);
      setCustomReportForm({
        report_name: "",
        description: "",
        metrics: ["total", "completed", "inProgress", "overdue", "avgCompletionTime"],
        charts: ["weeklyCompletion", "statusDistribution", "columnDistribution", "priorityDistribution"],
        time_range: "week",
        board_id: null
      });
    },
    onError: () => toast.error('Failed to create custom report')
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Custom_Tracker_Report.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-tracker-reports']);
      toast.success('Report shared successfully');
      setShowShareModal(false);
      setShareEmails([]);
      setShareEmail("");
      setIsPublic(false);
    },
    onError: () => toast.error('Failed to share report')
  });

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(now.getMonth() - 3);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start, end: now };
  };

  const { start, end } = getDateRange();

  // Filter cards by board and date range
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      if (selectedBoard && card.board_id !== selectedBoard) return false;
      
      const updatedDate = new Date(card.updated_date);
      return updatedDate >= start && updatedDate <= end;
    });
  }, [cards, selectedBoard, start, end]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const completed = filteredCards.filter(c => c.status === "Done").length;
    const overdue = filteredCards.filter(c => {
      if (!c.end_date || c.status === "Done") return false;
      return new Date(c.end_date) < new Date();
    }).length;
    
    // Calculate average completion time
    const completedCards = filteredCards.filter(c => c.status === "Done" && c.start_date && c.updated_date);
    const avgTime = completedCards.length > 0 
      ? completedCards.reduce((sum, c) => {
          const start = new Date(c.start_date);
          const end = new Date(c.updated_date);
          return sum + (end - start) / (1000 * 60 * 60 * 24);
        }, 0) / completedCards.length
      : 0;

    return {
      total: filteredCards.length,
      completed,
      inProgress: filteredCards.filter(c => c.status === "In progress").length,
      overdue,
      avgCompletionTime: avgTime.toFixed(1)
    };
  }, [filteredCards]);

  // Task distribution by column
  const columnDistribution = useMemo(() => {
    const distribution = {};
    columns.forEach(col => {
      const count = filteredCards.filter(c => c.column_id === col.id).length;
      if (count > 0) {
        distribution[col.title] = count;
      }
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredCards, columns]);

  // Task distribution by status
  const statusDistribution = useMemo(() => {
    const statuses = ["To do", "In progress", "Approved", "Done"];
    return statuses.map(status => ({
      name: status,
      value: filteredCards.filter(c => c.status === status).length
    })).filter(s => s.value > 0);
  }, [filteredCards]);

  // Task distribution by priority
  const priorityDistribution = useMemo(() => {
    const priorities = ["Highest", "High", "Medium", "Low"];
    return priorities.map(priority => ({
      name: priority,
      value: filteredCards.filter(c => c.priority === priority).length
    })).filter(p => p.value > 0);
  }, [filteredCards]);

  // Tasks completed per week
  const weeklyCompletion = useMemo(() => {
    const weeks = {};
    const completedCards = filteredCards.filter(c => c.status === "Done");
    
    completedCards.forEach(card => {
      const date = new Date(card.updated_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      weeks[key] = (weeks[key] || 0) + 1;
    });
    
    return Object.entries(weeks)
      .map(([date, count]) => ({ date: new Date(date).toLocaleDateString(), count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredCards]);

  const COLORS = ['#0ea5e9', '#06b6d4', '#0891b2', '#0e7490', '#155e75'];

  const handlePrint = () => {
    window.print();
  };

  const handleCreateCustomReport = () => {
    createReportMutation.mutate({
      report_name: customReportForm.report_name,
      description: customReportForm.description,
      config: {
        metrics: customReportForm.metrics,
        charts: customReportForm.charts,
        time_range: customReportForm.time_range,
        board_id: customReportForm.board_id
      },
      shared_with: [],
      is_public: false
    });
  };

  const handleLoadReport = (report) => {
    const config = report.config || {};
    if (config.time_range) setTimeRange(config.time_range);
    if (config.board_id) setSelectedBoard(config.board_id);
    setSelectedReport(report);
    toast.success(`Loaded report: ${report.report_name}`);
  };

  const handleShareReport = () => {
    if (!selectedReport) return;
    updateReportMutation.mutate({
      id: selectedReport.id,
      data: {
        shared_with: shareEmails,
        is_public: isPublic
      }
    });
  };

  const handleAddShareEmail = () => {
    if (shareEmail && !shareEmails.includes(shareEmail)) {
      setShareEmails([...shareEmails, shareEmail]);
      setShareEmail("");
    }
  };

  const handleRemoveShareEmail = (email) => {
    setShareEmails(shareEmails.filter(e => e !== email));
  };

  const toggleMetric = (metric) => {
    setCustomReportForm(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric]
    }));
  };

  const toggleChart = (chart) => {
    setCustomReportForm(prev => ({
      ...prev,
      charts: prev.charts.includes(chart)
        ? prev.charts.filter(c => c !== chart)
        : [...prev.charts, chart]
    }));
  };

  const shouldShowMetric = (metric) => {
    if (!selectedReport) return true;
    return selectedReport.config?.metrics?.includes(metric) ?? true;
  };

  const shouldShowChart = (chart) => {
    if (!selectedReport) return true;
    return selectedReport.config?.charts?.includes(chart) ?? true;
  };

  return (
    <div className="min-h-screen p-6" style={{
      background: 'linear-gradient(135deg, #F5F7FA 0%, #E6F0FA 100%)'
    }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#1E3A8A" }}>
              Tracker Reports
            </h1>
            {selectedReport && (
              <p className="text-sm mt-1" style={{ color: "#666" }}>
                Viewing: {selectedReport.report_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 ampvibe-button">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedBoard || "all"} onValueChange={(v) => setSelectedBoard(v === "all" ? null : v)}>
              <SelectTrigger className="w-40 ampvibe-button">
                <SelectValue placeholder="All Boards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Boards</SelectItem>
                {boards.map(board => (
                  <SelectItem key={board.id} value={board.id}>{board.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {customReports.length > 0 && (
              <Select value={selectedReport?.id || "none"} onValueChange={(v) => {
                if (v === "none") {
                  setSelectedReport(null);
                  toast.info('Viewing default report');
                } else {
                  const report = customReports.find(r => r.id === v);
                  if (report) handleLoadReport(report);
                }
              }}>
                <SelectTrigger className="w-48 ampvibe-button">
                  <SelectValue placeholder="Load Custom Report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default View</SelectItem>
                  {customReports.map(report => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.report_name}
                      {report.is_public && " 🌐"}
                      {report.shared_with?.includes(currentUser?.email) && " 👥"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <NeuroButton onClick={() => setShowCustomReportModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Report
            </NeuroButton>

            {selectedReport && selectedReport.created_by === currentUser?.email && (
              <NeuroButton onClick={() => {
                setShareEmails(selectedReport.shared_with || []);
                setIsPublic(selectedReport.is_public || false);
                setShowShareModal(true);
              }}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </NeuroButton>
            )}

            <NeuroButton onClick={handlePrint} variant="primary">
              <Download className="w-4 h-4 mr-2" />
              Print Report
            </NeuroButton>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {shouldShowMetric("total") && <NeuroCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
                <TrendingUp className="w-6 h-6" style={{ color: '#0ea5e9' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>{metrics.total}</p>
              </div>
            </div>
          </NeuroCard>}

          {shouldShowMetric("completed") && <NeuroCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ background: 'rgba(0, 168, 107, 0.1)' }}>
                <Calendar className="w-6 h-6" style={{ color: '#00A86B' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold" style={{ color: '#00A86B' }}>{metrics.completed}</p>
              </div>
            </div>
          </NeuroCard>}

          {shouldShowMetric("inProgress") && <NeuroCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
                <Clock className="w-6 h-6" style={{ color: '#eab308' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold" style={{ color: '#eab308' }}>{metrics.inProgress}</p>
              </div>
            </div>
          </NeuroCard>}

          {shouldShowMetric("overdue") && <NeuroCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertCircle className="w-6 h-6" style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{metrics.overdue}</p>
              </div>
            </div>
          </NeuroCard>}

          {shouldShowMetric("avgCompletionTime") && <NeuroCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
                <Clock className="w-6 h-6" style={{ color: '#0ea5e9' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>{metrics.avgCompletionTime}d</p>
              </div>
            </div>
          </NeuroCard>}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Completion Trend */}
          {shouldShowChart("weeklyCompletion") && <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
              Tasks Completed Per Week
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyCompletion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </NeuroCard>}

          {/* Status Distribution */}
          {shouldShowChart("statusDistribution") && <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
              Task Distribution by Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </NeuroCard>}

          {/* Column Distribution */}
          {shouldShowChart("columnDistribution") && <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
              Task Distribution by Column
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={columnDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0ea5e9" name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </NeuroCard>}

          {/* Priority Distribution */}
          {shouldShowChart("priorityDistribution") && <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
              Task Distribution by Priority
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#06b6d4" name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </NeuroCard>}
        </div>

        {/* Custom Report Modal */}
        {showCustomReportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <NeuroCard className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#1E3A8A" }}>
                  Create Custom Report
                </h2>
                <button onClick={() => setShowCustomReportModal(false)} className="ampvibe-button p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <NeuroInput
                  label="Report Name"
                  value={customReportForm.report_name}
                  onChange={(e) => setCustomReportForm({ ...customReportForm, report_name: e.target.value })}
                  required
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: "#666" }}>
                    Description
                  </label>
                  <textarea
                    value={customReportForm.description}
                    onChange={(e) => setCustomReportForm({ ...customReportForm, description: e.target.value })}
                    className="ampvibe-input w-full min-h-[80px]"
                    placeholder="Describe this report..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium" style={{ color: "#666" }}>
                    Select Metrics to Display
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "total", label: "Total Tasks" },
                      { id: "completed", label: "Completed" },
                      { id: "inProgress", label: "In Progress" },
                      { id: "overdue", label: "Overdue" },
                      { id: "avgCompletionTime", label: "Avg. Completion Time" }
                    ].map(metric => (
                      <label key={metric.id} className="ampvibe-button p-3 cursor-pointer flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={customReportForm.metrics.includes(metric.id)}
                          onChange={() => toggleMetric(metric.id)}
                        />
                        <span>{metric.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium" style={{ color: "#666" }}>
                    Select Charts to Display
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "weeklyCompletion", label: "Weekly Completion Trend" },
                      { id: "statusDistribution", label: "Status Distribution" },
                      { id: "columnDistribution", label: "Column Distribution" },
                      { id: "priorityDistribution", label: "Priority Distribution" }
                    ].map(chart => (
                      <label key={chart.id} className="ampvibe-button p-3 cursor-pointer flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={customReportForm.charts.includes(chart.id)}
                          onChange={() => toggleChart(chart.id)}
                        />
                        <span>{chart.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: "#666" }}>
                      Default Time Range
                    </label>
                    <select
                      value={customReportForm.time_range}
                      onChange={(e) => setCustomReportForm({ ...customReportForm, time_range: e.target.value })}
                      className="ampvibe-input w-full"
                    >
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last Month</option>
                      <option value="quarter">Last Quarter</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: "#666" }}>
                      Default Board
                    </label>
                    <select
                      value={customReportForm.board_id || ""}
                      onChange={(e) => setCustomReportForm({ ...customReportForm, board_id: e.target.value || null })}
                      className="ampvibe-input w-full"
                    >
                      <option value="">All Boards</option>
                      {boards.map(board => (
                        <option key={board.id} value={board.id}>{board.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <NeuroButton onClick={() => setShowCustomReportModal(false)}>
                    Cancel
                  </NeuroButton>
                  <NeuroButton 
                    variant="primary" 
                    onClick={handleCreateCustomReport}
                    disabled={!customReportForm.report_name || customReportForm.metrics.length === 0}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Create Report
                  </NeuroButton>
                </div>
              </div>
            </NeuroCard>
          </div>
        )}

        {/* Share Report Modal */}
        {showShareModal && selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <NeuroCard className="max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#1E3A8A" }}>
                  Share Report: {selectedReport.report_name}
                </h2>
                <button onClick={() => setShowShareModal(false)} className="ampvibe-button p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <label className="ampvibe-button p-4 cursor-pointer flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <Users className="w-5 h-5" />
                  <div>
                    <p className="font-medium" style={{ color: "#333" }}>Make this report public</p>
                    <p className="text-xs" style={{ color: "#888" }}>All users in your organization can view this report</p>
                  </div>
                </label>

                <div className="space-y-3">
                  <label className="block text-sm font-medium" style={{ color: "#666" }}>
                    Share with Specific Users
                  </label>
                  
                  <div className="flex gap-2">
                    <select
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      className="ampvibe-input flex-1"
                    >
                      <option value="">Select user...</option>
                      {users
                        .filter(u => u.email !== currentUser?.email && !shareEmails.includes(u.email))
                        .map(u => (
                          <option key={u.email} value={u.email}>
                            {u.full_name || u.email}
                          </option>
                        ))}
                    </select>
                    <NeuroButton onClick={handleAddShareEmail} disabled={!shareEmail}>
                      <Plus className="w-4 h-4" />
                    </NeuroButton>
                  </div>

                  {shareEmails.length > 0 && (
                    <div className="space-y-2">
                      {shareEmails.map(email => (
                        <div key={email} className="ampvibe-inset p-3 rounded-lg flex items-center justify-between">
                          <span className="text-sm" style={{ color: "#666" }}>
                            {users.find(u => u.email === email)?.full_name || email}
                          </span>
                          <button
                            onClick={() => handleRemoveShareEmail(email)}
                            className="ampvibe-button p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <NeuroButton onClick={() => setShowShareModal(false)}>
                    Cancel
                  </NeuroButton>
                  <NeuroButton variant="primary" onClick={handleShareReport}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Save Sharing Settings
                  </NeuroButton>
                </div>
              </div>
            </NeuroCard>
          </div>
        )}

        {/* Print Styles */}
        <style>{`
          @media print {
            body { background: white !important; }
            .ampvibe-card { box-shadow: none !important; border: 1px solid #e5e7eb; }
            button { display: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}