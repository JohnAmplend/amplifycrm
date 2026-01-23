import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Save, Play, Plus, X, Filter, BarChart3, PieChart, LineChart as LineIcon, Table, Download, Settings } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CustomReportBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(1); // 1: Entity, 2: Filters, 3: Fields, 4: Visualization

  const [reportConfig, setReportConfig] = useState({
    report_name: "",
    report_description: "",
    entity_type: "Contact",
    filters: [],
    fields_to_display: [],
    chart_type: "Table",
    grouping_field: "",
    aggregation_type: "Count",
    aggregation_field: "",
    sort_by: "",
    sort_direction: "Descending",
    date_range_type: "Last 30 Days",
    is_shared: false
  });

  const [previewData, setPreviewData] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Entity field configurations
  const entityFields = {
    Contact: ['first_name', 'last_name', 'email', 'phone', 'job_title', 'company_id', 'lifecycle_stage', 'lead_status', 'city', 'country', 'lead_source', 'created_date'],
    Company: ['company_name', 'domain', 'industry', 'phone', 'city', 'country', 'number_of_employees', 'annual_revenue', 'lifecycle_stage', 'created_date'],
    Deal: ['deal_name', 'deal_amount', 'deal_stage', 'close_date', 'probability', 'deal_type', 'priority', 'contact_id', 'company_id', 'created_date'],
    Lead: ['first_name', 'last_name', 'email', 'phone', 'company_name', 'lead_source', 'lead_status', 'lead_score', 'created_date'],
    Email_Campaign: ['campaign_name', 'subject_line', 'status', 'total_sent', 'total_opened', 'total_clicked', 'send_date', 'created_date'],
    Form: ['form_name', 'form_type', 'is_active', 'submissions_count', 'created_date'],
    Form_Submission: ['form_id', 'contact_id', 'ip_address', 'created_date'],
    Ticket: ['subject', 'status', 'priority', 'ticket_type', 'assigned_to', 'created_date', 'resolved_date'],
    Task: ['task_name', 'status', 'priority', 'due_date', 'assigned_to', 'created_date'],
    Activity: ['activity_type', 'subject', 'activity_date', 'status', 'created_date']
  };

  const saveMutation = useMutation({
    mutationFn: (config) => base44.entities.Custom_Report.create(config),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['custom-reports']);
      alert('Report saved successfully!');
      navigate(createPageUrl("CustomReportViewer") + `?id=${data.id}`);
    }
  });

  const generatePreview = async () => {
    setLoadingPreview(true);
    try {
      // Fetch data based on entity type
      let data = [];
      switch (reportConfig.entity_type) {
        case 'Contact':
          data = await base44.entities.Contact.list('-created_date', 200);
          break;
        case 'Company':
          data = await base44.entities.Company.list('-created_date', 200);
          break;
        case 'Deal':
          data = await base44.entities.Deal.list('-created_date', 200);
          break;
        case 'Lead':
          data = await base44.entities.Lead.list('-created_date', 200);
          break;
        case 'Email_Campaign':
          data = await base44.entities.Email_Campaign.list('-created_date', 200);
          break;
        case 'Form':
          data = await base44.entities.Form.list('-created_date', 200);
          break;
        case 'Form_Submission':
          data = await base44.entities.Form_Submission.list('-created_date', 200);
          break;
        case 'Ticket':
          data = await base44.entities.Ticket.list('-created_date', 200);
          break;
        case 'Task':
          data = await base44.entities.Task.list('-created_date', 200);
          break;
        case 'Activity':
          data = await base44.entities.Activity.list('-created_date', 200);
          break;
      }

      data = data || [];

      // Apply filters
      reportConfig.filters.forEach(filter => {
        data = data.filter(item => {
          const value = item[filter.field];
          switch (filter.operator) {
            case 'equals':
              return value === filter.value;
            case 'not_equals':
              return value !== filter.value;
            case 'contains':
              return value?.toString().includes(filter.value);
            case 'greater_than':
              return parseFloat(value) > parseFloat(filter.value);
            case 'less_than':
              return parseFloat(value) < parseFloat(filter.value);
            case 'exists':
              return value != null;
            case 'not_exists':
              return value == null;
            default:
              return true;
          }
        });
      });

      // Apply date range
      if (reportConfig.date_range_type !== 'All Time') {
        const now = new Date();
        let cutoffDate;

        switch (reportConfig.date_range_type) {
          case 'Today':
            cutoffDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'This Week':
            cutoffDate = new Date(now.setDate(now.getDate() - now.getDay()));
            break;
          case 'This Month':
            cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'Last 7 Days':
            cutoffDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'Last 30 Days':
            cutoffDate = new Date(now.setDate(now.getDate() - 30));
            break;
          case 'Last 90 Days':
            cutoffDate = new Date(now.setDate(now.getDate() - 90));
            break;
        }

        if (cutoffDate) {
          data = data.filter(item => new Date(item.created_date) >= cutoffDate);
        }
      }

      // Process data based on chart type
      if (reportConfig.chart_type !== 'Table' && reportConfig.grouping_field) {
        const grouped = {};
        data.forEach(item => {
          const key = item[reportConfig.grouping_field] || 'Unknown';
          if (!grouped[key]) {
            grouped[key] = { name: key, count: 0, value: 0 };
          }
          grouped[key].count++;
          if (reportConfig.aggregation_field && reportConfig.aggregation_type === 'Sum') {
            grouped[key].value += parseFloat(item[reportConfig.aggregation_field]) || 0;
          }
        });
        setPreviewData(Object.values(grouped).slice(0, 10));
      } else {
        // For table, just use raw data
        setPreviewData(data.slice(0, 50));
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert('Failed to generate preview: ' + error.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const addFilter = () => {
    setReportConfig({
      ...reportConfig,
      filters: [...reportConfig.filters, { field: '', operator: 'equals', value: '' }]
    });
  };

  const updateFilter = (index, updates) => {
    const newFilters = [...reportConfig.filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setReportConfig({ ...reportConfig, filters: newFilters });
  };

  const removeFilter = (index) => {
    setReportConfig({
      ...reportConfig,
      filters: reportConfig.filters.filter((_, i) => i !== index)
    });
  };

  const COLORS = ['#0066cc', '#00a86b', '#fa8c16', '#722ed1', '#eb2f96', '#52c41a'];

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f5f7fa' }}>
      {/* Top Bar */}
      <div className="bg-white border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#111827" }}>Custom Report Builder</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              Step {activeStep} of 4
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NeuroButton onClick={generatePreview} disabled={loadingPreview}>
              <Play className="w-4 h-4 mr-2" />
              {loadingPreview ? 'Loading...' : 'Preview'}
            </NeuroButton>
            <NeuroButton variant="primary" onClick={() => saveMutation.mutate(reportConfig)} disabled={!reportConfig.report_name}>
              <Save className="w-4 h-4 mr-2" />
              Save Report
            </NeuroButton>
          </div>
        </div>

        {/* Steps */}
        <div className="flex px-6 py-4 border-t" style={{ borderColor: "#e5e7eb" }}>
          {['Entity', 'Filters', 'Fields', 'Visualization'].map((label, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index + 1)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeStep === index + 1
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-6 p-8 h-full">
          {/* Left: Configuration */}
          <div className="space-y-6">
            {/* Step 1: Entity Selection */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <NeuroCard className="p-6">
                  <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Report Details</h3>
                  <div className="space-y-4">
                    <NeuroInput
                      label="Report Name"
                      value={reportConfig.report_name}
                      onChange={(e) => setReportConfig({ ...reportConfig, report_name: e.target.value })}
                      placeholder="e.g., High-Value Deals Pipeline"
                      required
                    />
                    <NeuroInput
                      label="Description"
                      value={reportConfig.report_description}
                      onChange={(e) => setReportConfig({ ...reportConfig, report_description: e.target.value })}
                      placeholder="What does this report show?"
                    />
                  </div>
                </NeuroCard>

                <NeuroCard className="p-6">
                  <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Select Data Source</h3>
                  <NeuroSelect
                    label="Entity Type"
                    value={reportConfig.entity_type}
                    onChange={(e) => setReportConfig({ ...reportConfig, entity_type: e.target.value })}
                    options={[
                      { value: 'Contact', label: 'Contacts' },
                      { value: 'Company', label: 'Companies' },
                      { value: 'Deal', label: 'Deals' },
                      { value: 'Lead', label: 'Leads' },
                      { value: 'Email_Campaign', label: 'Email Campaigns' },
                      { value: 'Form', label: 'Forms' },
                      { value: 'Form_Submission', label: 'Form Submissions' },
                      { value: 'Ticket', label: 'Tickets' },
                      { value: 'Task', label: 'Tasks' },
                      { value: 'Activity', label: 'Activities' }
                    ]}
                  />
                </NeuroCard>

                <NeuroCard className="p-6">
                  <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Date Range</h3>
                  <NeuroSelect
                    label="Date Range"
                    value={reportConfig.date_range_type}
                    onChange={(e) => setReportConfig({ ...reportConfig, date_range_type: e.target.value })}
                    options={[
                      { value: 'All Time', label: 'All Time' },
                      { value: 'Today', label: 'Today' },
                      { value: 'This Week', label: 'This Week' },
                      { value: 'This Month', label: 'This Month' },
                      { value: 'Last 7 Days', label: 'Last 7 Days' },
                      { value: 'Last 30 Days', label: 'Last 30 Days' },
                      { value: 'Last 90 Days', label: 'Last 90 Days' }
                    ]}
                  />
                </NeuroCard>
              </div>
            )}

            {/* Step 2: Filters */}
            {activeStep === 2 && (
              <NeuroCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold" style={{ color: "#111827" }}>Filters & Conditions</h3>
                  <NeuroButton size="sm" onClick={addFilter}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Filter
                  </NeuroButton>
                </div>

                {reportConfig.filters.length === 0 ? (
                  <div className="text-center py-12" style={{ color: "#9ca3af" }}>
                    <Filter className="w-12 h-12 mx-auto mb-3" style={{ color: "#d1d5db" }} />
                    <p>No filters added</p>
                    <p className="text-sm">Click "Add Filter" to start filtering data</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportConfig.filters.map((filter, index) => (
                      <div key={index} className="flex gap-2 p-3 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <select
                            value={filter.field}
                            onChange={(e) => updateFilter(index, { field: e.target.value })}
                            className="ampvibe-input text-sm"
                          >
                            <option value="">Select field...</option>
                            {entityFields[reportConfig.entity_type]?.map(field => (
                              <option key={field} value={field}>{field}</option>
                            ))}
                          </select>

                          <select
                            value={filter.operator}
                            onChange={(e) => updateFilter(index, { operator: e.target.value })}
                            className="ampvibe-input text-sm"
                          >
                            <option value="equals">Equals</option>
                            <option value="not_equals">Not Equals</option>
                            <option value="contains">Contains</option>
                            <option value="greater_than">Greater Than</option>
                            <option value="less_than">Less Than</option>
                            <option value="exists">Exists</option>
                            <option value="not_exists">Not Exists</option>
                          </select>

                          {!['exists', 'not_exists'].includes(filter.operator) && (
                            <input
                              type="text"
                              value={filter.value}
                              onChange={(e) => updateFilter(index, { value: e.target.value })}
                              placeholder="Value"
                              className="ampvibe-input text-sm"
                            />
                          )}
                        </div>
                        <button
                          onClick={() => removeFilter(index)}
                          className="p-2 rounded hover:bg-red-50"
                          style={{ color: "#dc2626" }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </NeuroCard>
            )}

            {/* Step 3: Fields */}
            {activeStep === 3 && (
              <NeuroCard className="p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Select Fields to Display</h3>
                <div className="space-y-2">
                  {entityFields[reportConfig.entity_type]?.map(field => (
                    <label key={field} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={reportConfig.fields_to_display.includes(field)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReportConfig({
                              ...reportConfig,
                              fields_to_display: [...reportConfig.fields_to_display, field]
                            });
                          } else {
                            setReportConfig({
                              ...reportConfig,
                              fields_to_display: reportConfig.fields_to_display.filter(f => f !== field)
                            });
                          }
                        }}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: "#0066cc" }}
                      />
                      <span className="text-sm" style={{ color: "#374151" }}>{field}</span>
                    </label>
                  ))}
                </div>
              </NeuroCard>
            )}

            {/* Step 4: Visualization */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <NeuroCard className="p-6">
                  <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Chart Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'Table', label: 'Table', icon: Table },
                      { value: 'Bar Chart', label: 'Bar Chart', icon: BarChart3 },
                      { value: 'Line Chart', label: 'Line Chart', icon: LineIcon },
                      { value: 'Pie Chart', label: 'Pie Chart', icon: PieChart }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setReportConfig({ ...reportConfig, chart_type: option.value })}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          reportConfig.chart_type === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <option.icon className="w-6 h-6 mx-auto mb-2" style={{ color: "#0066cc" }} />
                        <p className="text-sm font-medium" style={{ color: "#374151" }}>{option.label}</p>
                      </button>
                    ))}
                  </div>
                </NeuroCard>

                {reportConfig.chart_type !== 'Table' && (
                  <NeuroCard className="p-6">
                    <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Aggregation</h3>
                    <div className="space-y-4">
                      <NeuroSelect
                        label="Group By"
                        value={reportConfig.grouping_field}
                        onChange={(e) => setReportConfig({ ...reportConfig, grouping_field: e.target.value })}
                        options={entityFields[reportConfig.entity_type]?.map(f => ({ value: f, label: f })) || []}
                      />
                      <NeuroSelect
                        label="Aggregation"
                        value={reportConfig.aggregation_type}
                        onChange={(e) => setReportConfig({ ...reportConfig, aggregation_type: e.target.value })}
                        options={[
                          { value: 'Count', label: 'Count' },
                          { value: 'Sum', label: 'Sum' },
                          { value: 'Average', label: 'Average' }
                        ]}
                      />
                      {reportConfig.aggregation_type !== 'Count' && (
                        <NeuroSelect
                          label="Aggregation Field"
                          value={reportConfig.aggregation_field}
                          onChange={(e) => setReportConfig({ ...reportConfig, aggregation_field: e.target.value })}
                          options={entityFields[reportConfig.entity_type]?.map(f => ({ value: f, label: f })) || []}
                        />
                      )}
                    </div>
                  </NeuroCard>
                )}
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="sticky top-0">
            <NeuroCard className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: "#111827" }}>Preview</h3>
                {previewData.length > 0 && (
                  <span className="text-sm px-3 py-1 rounded-full" style={{ background: '#e6f7ff', color: "#0066cc" }}>
                    {previewData.length} records
                  </span>
                )}
              </div>

              {previewData.length === 0 ? (
                <div className="flex items-center justify-center h-96" style={{ color: "#9ca3af" }}>
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-3" style={{ color: "#d1d5db" }} />
                    <p>Click "Preview" to see your report</p>
                  </div>
                </div>
              ) : (
                <div className="h-96">
                  {reportConfig.chart_type === 'Table' ? (
                    <div className="overflow-auto h-full">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                            {reportConfig.fields_to_display.slice(0, 5).map(field => (
                              <th key={field} className="text-left p-2 font-semibold" style={{ color: "#374151" }}>
                                {field}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                              {reportConfig.fields_to_display.slice(0, 5).map(field => (
                                <td key={field} className="p-2" style={{ color: "#6b7280" }}>
                                  {row[field]?.toString() || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : reportConfig.chart_type === 'Bar Chart' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={previewData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey={reportConfig.aggregation_type === 'Count' ? 'count' : 'value'} fill="#0066cc" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : reportConfig.chart_type === 'Line Chart' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={previewData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey={reportConfig.aggregation_type === 'Count' ? 'count' : 'value'} stroke="#0066cc" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={previewData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey={reportConfig.aggregation_type === 'Count' ? 'count' : 'value'}
                        >
                          {previewData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </NeuroCard>
          </div>
        </div>
      </div>
    </div>
  );
}