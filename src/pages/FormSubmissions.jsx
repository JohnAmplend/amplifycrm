import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Download, Calendar, BarChart3, FileText, Users } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FormSubmissions() {
  const navigate = useNavigate();
  const [formId, setFormId] = useState(null);
  const [activeTab, setActiveTab] = useState("performance"); // performance, analyze, submissions
  const [dateRange, setDateRange] = useState("last30days");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('form');
    if (id) {
      setFormId(id);
    }
  }, []);

  const { data: form } = useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      const forms = await base44.entities.Form.filter({ id: formId });
      return forms[0];
    },
    enabled: !!formId
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: () => base44.entities.Form_Submission.filter({ form_id: formId }, '-created_date'),
    enabled: !!formId
  });

  const { data: fields = [] } = useQuery({
    queryKey: ['form-fields', formId],
    queryFn: () => base44.entities.Form_Field.filter({ form_id: formId }),
    enabled: !!formId
  });

  // Calculate statistics
  const last30Days = submissions.filter(s => {
    const created = new Date(s.created_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return created > thirtyDaysAgo;
  });

  const last7Days = submissions.filter(s => {
    const created = new Date(s.created_date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return created > sevenDaysAgo;
  });

  // Prepare chart data (submissions over time)
  const getChartData = () => {
    const data = [];
    const days = dateRange === 'last7days' ? 7 : 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const count = submissions.filter(s => {
        const subDate = new Date(s.created_date);
        return subDate.toDateString() === date.toDateString();
      }).length;
      
      data.push({
        date: dateStr,
        submissions: count
      });
    }
    
    return data;
  };

  const chartData = getChartData();

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      alert('No submissions to export');
      return;
    }

    // Get all unique field names from submissions
    const fieldNames = new Set();
    submissions.forEach(sub => {
      if (sub.submission_data) {
        Object.keys(sub.submission_data).forEach(key => fieldNames.add(key));
      }
    });

    const headers = ['Submission Date', 'IP Address', ...Array.from(fieldNames)];
    const rows = submissions.map(sub => {
      const row = [
        new Date(sub.created_date).toLocaleString(),
        sub.ip_address || ''
      ];
      
      fieldNames.forEach(field => {
        row.push(sub.submission_data?.[field] || '');
      });
      
      return row;
    });

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form?.form_name || 'form'}-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!form) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Loading form...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f5f8fa' }}>
      {/* Top Bar */}
      <div className="ampvibe-card border-b" style={{ borderColor: "#e0e0e0" }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl("Forms"))}
              className="ampvibe-button p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#333" }}>
                {form.form_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  form.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {form.is_active ? 'Published' : 'Draft'}
                </span>
                <span className="text-xs" style={{ color: "#888" }}>
                  Created {new Date(form.created_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="ampvibe-input px-3 py-2 text-sm"
            >
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="last90days">Last 90 days</option>
            </select>
            <NeuroButton onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </NeuroButton>
            <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("FormBuilder") + `?id=${formId}`)}>
              Edit Form
            </NeuroButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 border-t" style={{ borderColor: "#e0e0e0" }}>
          {['performance', 'analyze', 'submissions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <NeuroCard className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm mb-2" style={{ color: "#888" }}>Total Submissions</p>
                      <p className="text-3xl font-bold" style={{ color: "#4a90e2" }}>
                        {submissions.length}
                      </p>
                    </div>
                    <div className="ampvibe-inset p-3 rounded-xl">
                      <FileText className="w-6 h-6" style={{ color: "#4a90e2" }} />
                    </div>
                  </div>
                </NeuroCard>

                <NeuroCard className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm mb-2" style={{ color: "#888" }}>Last 30 Days</p>
                      <p className="text-3xl font-bold" style={{ color: "#00A86B" }}>
                        {last30Days.length}
                      </p>
                    </div>
                    <div className="ampvibe-inset p-3 rounded-xl">
                      <Calendar className="w-6 h-6" style={{ color: "#00A86B" }} />
                    </div>
                  </div>
                </NeuroCard>

                <NeuroCard className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm mb-2" style={{ color: "#888" }}>Last 7 Days</p>
                      <p className="text-3xl font-bold" style={{ color: "#fa8c16" }}>
                        {last7Days.length}
                      </p>
                    </div>
                    <div className="ampvibe-inset p-3 rounded-xl">
                      <BarChart3 className="w-6 h-6" style={{ color: "#fa8c16" }} />
                    </div>
                  </div>
                </NeuroCard>

                <NeuroCard className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm mb-2" style={{ color: "#888" }}>Conversion Rate</p>
                      <p className="text-3xl font-bold" style={{ color: "#52c41a" }}>
                        {form.submissions_count > 0 ? '100%' : '0%'}
                      </p>
                    </div>
                    <div className="ampvibe-inset p-3 rounded-xl">
                      <Users className="w-6 h-6" style={{ color: "#52c41a" }} />
                    </div>
                  </div>
                </NeuroCard>
              </div>

              {/* Chart */}
              <NeuroCard className="p-6">
                <h3 className="text-lg font-bold mb-6" style={{ color: "#666" }}>Overall Responses</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="date" tick={{ fill: '#888' }} />
                      <YAxis tick={{ fill: '#888' }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="submissions"
                        stroke="#4a90e2"
                        strokeWidth={2}
                        dot={{ fill: '#4a90e2' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </NeuroCard>
            </div>
          )}

          {activeTab === 'analyze' && (
            <NeuroCard className="p-6">
              <h3 className="text-lg font-bold mb-6" style={{ color: "#666" }}>Form Analysis</h3>
              
              {fields.length === 0 ? (
                <div className="text-center py-12" style={{ color: "#aaa" }}>
                  No fields to analyze
                </div>
              ) : (
                <div className="space-y-6">
                  {fields.map((field) => {
                    const fieldValues = submissions
                      .map(s => s.submission_data?.[field.field_name])
                      .filter(Boolean);
                    
                    const uniqueValues = [...new Set(fieldValues)];
                    const fillRate = submissions.length > 0
                      ? ((fieldValues.length / submissions.length) * 100).toFixed(1)
                      : 0;

                    return (
                      <div key={field.id} className="ampvibe-inset p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold" style={{ color: "#666" }}>
                            {field.field_label}
                          </h4>
                          <span className="text-sm" style={{ color: "#888" }}>
                            {fillRate}% filled
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p style={{ color: "#aaa" }}>Total Responses</p>
                            <p className="font-semibold" style={{ color: "#666" }}>
                              {fieldValues.length}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: "#aaa" }}>Unique Values</p>
                            <p className="font-semibold" style={{ color: "#666" }}>
                              {uniqueValues.length}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: "#aaa" }}>Fill Rate</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${fillRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </NeuroCard>
          )}

          {activeTab === 'submissions' && (
            <NeuroCard>
              {submissions.length === 0 ? (
                <div className="text-center py-12" style={{ color: "#aaa" }}>
                  <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: "#ddd" }} />
                  <p className="text-lg mb-2">No submissions yet</p>
                  <p className="text-sm">Share your form to start collecting responses</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>
                          Date
                        </th>
                        {fields.slice(0, 5).map((field) => (
                          <th key={field.id} className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>
                            {field.field_label}
                          </th>
                        ))}
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission) => (
                        <tr
                          key={submission.id}
                          className="border-b hover:bg-gray-50 transition-colors"
                          style={{ borderColor: "#d8d8d8" }}
                        >
                          <td className="py-3 px-4" style={{ color: "#666" }}>
                            {new Date(submission.created_date).toLocaleDateString()}
                          </td>
                          {fields.slice(0, 5).map((field) => (
                            <td key={field.id} className="py-3 px-4" style={{ color: "#888" }}>
                              {submission.submission_data?.[field.field_name] || '—'}
                            </td>
                          ))}
                          <td className="py-3 px-4 text-sm" style={{ color: "#aaa" }}>
                            {submission.ip_address || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </NeuroCard>
          )}
        </div>
      </div>
    </div>
  );
}