import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Play, Plus, X } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function ReportBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [reportData, setReportData] = useState({
    report_name: "",
    report_description: "",
    report_type: "Contacts",
    chart_type: "Table",
    columns_to_show: [],
    filters: {},
    group_by: "",
    aggregation_type: "Count",
    sort_by: "",
    date_range: "This Month",
    is_shared: false
  });

  const [selectedColumns, setSelectedColumns] = useState([]);

  const reportTypes = [
    { value: "Contacts", label: "Contacts" },
    { value: "Companies", label: "Companies" },
    { value: "Deals", label: "Deals" },
    { value: "Activities", label: "Activities" },
    { value: "Tickets", label: "Tickets" },
    { value: "Email Performance", label: "Email Performance" }
  ];

  const chartTypes = [
    { value: "Table", label: "Table" },
    { value: "Bar Chart", label: "Bar Chart" },
    { value: "Line Chart", label: "Line Chart" },
    { value: "Pie Chart", label: "Pie Chart" },
    { value: "Funnel", label: "Funnel" },
    { value: "KPI Cards", label: "KPI Cards" }
  ];

  const dateRanges = [
    { value: "Today", label: "Today" },
    { value: "This Week", label: "This Week" },
    { value: "This Month", label: "This Month" },
    { value: "This Quarter", label: "This Quarter" },
    { value: "This Year", label: "This Year" },
    { value: "Custom", label: "Custom Range" }
  ];

  const aggregationTypes = [
    { value: "Count", label: "Count" },
    { value: "Sum", label: "Sum" },
    { value: "Average", label: "Average" },
    { value: "Min", label: "Minimum" },
    { value: "Max", label: "Maximum" }
  ];

  const availableColumns = {
    Contacts: [
      "first_name", "last_name", "email", "phone", "job_title", 
      "company_id", "lifecycle_stage", "lead_status", "created_date"
    ],
    Companies: [
      "company_name", "domain", "industry", "phone", "city", 
      "state", "number_of_employees", "annual_revenue", "lifecycle_stage", "created_date"
    ],
    Deals: [
      "deal_name", "deal_amount", "close_date", "deal_stage", 
      "probability", "deal_type", "priority", "created_date"
    ],
    Activities: [
      "activity_type", "subject", "activity_date", "duration_minutes", 
      "status", "created_date"
    ],
    Tickets: [
      "ticket_number", "subject", "status", "priority", "ticket_type", 
      "category", "assigned_to", "created_date", "resolved_date"
    ],
    "Email Performance": [
      "subject_line", "sent_date", "delivered_date", "opened_date", 
      "clicked_date", "status"
    ]
  };

  const createReportMutation = useMutation({
    mutationFn: (data) => base44.entities.Reports.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      navigate(createPageUrl("Reports"));
    }
  });

  const handleAddColumn = (column) => {
    if (!selectedColumns.includes(column)) {
      const newColumns = [...selectedColumns, column];
      setSelectedColumns(newColumns);
      setReportData({ ...reportData, columns_to_show: newColumns });
    }
  };

  const handleRemoveColumn = (column) => {
    const newColumns = selectedColumns.filter(c => c !== column);
    setSelectedColumns(newColumns);
    setReportData({ ...reportData, columns_to_show: newColumns });
  };

  const handleSave = () => {
    if (!reportData.report_name) {
      alert("Please enter a report name");
      return;
    }

    if (selectedColumns.length === 0) {
      alert("Please select at least one column");
      return;
    }

    createReportMutation.mutate(reportData);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeuroButton onClick={() => navigate(createPageUrl("Reports"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                Create Report
              </h1>
              <p style={{ color: "#888" }}>Build custom reports and analytics</p>
            </div>
          </div>
          <div className="flex gap-3">
            <NeuroButton>
              <Play className="w-4 h-4 mr-2" />
              Preview
            </NeuroButton>
            <NeuroButton variant="primary" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Report
            </NeuroButton>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <NeuroCard>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                Report Details
              </h2>
              <div className="space-y-4">
                <NeuroInput
                  label="Report Name"
                  value={reportData.report_name}
                  onChange={(e) => setReportData({ ...reportData, report_name: e.target.value })}
                  placeholder="e.g., Monthly Sales Report"
                  required
                />
                <NeuroInput
                  label="Description"
                  value={reportData.report_description}
                  onChange={(e) => setReportData({ ...reportData, report_description: e.target.value })}
                  placeholder="Brief description of this report"
                />
              </div>
            </NeuroCard>

            {/* Data Source */}
            <NeuroCard>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                Data Source
              </h2>
              <NeuroSelect
                label="Report Type"
                value={reportData.report_type}
                onChange={(e) => {
                  setReportData({ ...reportData, report_type: e.target.value });
                  setSelectedColumns([]);
                }}
                options={reportTypes}
                required
              />
            </NeuroCard>

            {/* Columns */}
            <NeuroCard>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                Select Columns
              </h2>
              
              {/* Selected Columns */}
              {selectedColumns.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm mb-2" style={{ color: "#888" }}>Selected Columns:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedColumns.map((column) => (
                      <div key={column} className="ampvibe-inset px-3 py-2 rounded-lg flex items-center gap-2">
                        <span className="text-sm" style={{ color: "#666" }}>{column}</span>
                        <button onClick={() => handleRemoveColumn(column)} className="ampvibe-button p-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Columns */}
              <div>
                <p className="text-sm mb-2" style={{ color: "#888" }}>Available Columns:</p>
                <div className="grid grid-cols-2 gap-2">
                  {availableColumns[reportData.report_type]?.map((column) => (
                    <button
                      key={column}
                      onClick={() => handleAddColumn(column)}
                      className={`ampvibe-button px-3 py-2 text-sm text-left ${
                        selectedColumns.includes(column) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={selectedColumns.includes(column)}
                    >
                      <Plus className="w-3 h-3 inline mr-2" />
                      {column}
                    </button>
                  ))}
                </div>
              </div>
            </NeuroCard>

            {/* Visualization */}
            <NeuroCard>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                Visualization
              </h2>
              <NeuroSelect
                label="Chart Type"
                value={reportData.chart_type}
                onChange={(e) => setReportData({ ...reportData, chart_type: e.target.value })}
                options={chartTypes}
                required
              />
            </NeuroCard>
          </div>

          {/* Right Panel - Filters & Options */}
          <div className="space-y-6">
            {/* Date Range */}
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                Date Range
              </h3>
              <NeuroSelect
                value={reportData.date_range}
                onChange={(e) => setReportData({ ...reportData, date_range: e.target.value })}
                options={dateRanges}
              />
            </NeuroCard>

            {/* Grouping */}
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                Group By
              </h3>
              <NeuroSelect
                placeholder="Select field to group by"
                value={reportData.group_by}
                onChange={(e) => setReportData({ ...reportData, group_by: e.target.value })}
                options={selectedColumns.map(c => ({ value: c, label: c }))}
              />
            </NeuroCard>

            {/* Aggregation */}
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                Aggregation
              </h3>
              <NeuroSelect
                value={reportData.aggregation_type}
                onChange={(e) => setReportData({ ...reportData, aggregation_type: e.target.value })}
                options={aggregationTypes}
              />
            </NeuroCard>

            {/* Sort */}
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                Sort By
              </h3>
              <NeuroSelect
                placeholder="Select field to sort by"
                value={reportData.sort_by}
                onChange={(e) => setReportData({ ...reportData, sort_by: e.target.value })}
                options={selectedColumns.map(c => ({ value: c, label: c }))}
              />
            </NeuroCard>

            {/* Sharing */}
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                Sharing
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportData.is_shared}
                  onChange={(e) => setReportData({ ...reportData, is_shared: e.target.checked })}
                  className="ampvibe-button w-5 h-5"
                />
                <span className="text-sm" style={{ color: "#666" }}>Share with all users</span>
              </label>
            </NeuroCard>
          </div>
        </div>
      </div>
    </div>
  );
}