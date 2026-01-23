import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Download, Calendar, BarChart3, FileText, Users, Sparkles, TrendingUp, AlertTriangle, Target, Lightbulb, RefreshCw, MessageCircle, Brain, Search, Heart, ThumbsUp, ThumbsDown, Smile, Frown, Meh } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function FormSubmissions() {
  const navigate = useNavigate();
  const [formId, setFormId] = useState(null);
  const [activeTab, setActiveTab] = useState("performance");
  const [dateRange, setDateRange] = useState("last30days");
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState('comprehensive');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [fieldFilters, setFieldFilters] = useState({});

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

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: () => base44.entities.Form_Submission.filter({ form_id: formId }, '-created_date'),
    enabled: !!formId
  });

  // Apply filters
  const submissions = allSubmissions.filter(sub => {
    // Date range filter
    if (filterStartDate) {
      const subDate = new Date(sub.created_date);
      const startDate = new Date(filterStartDate);
      if (subDate < startDate) return false;
    }
    if (filterEndDate) {
      const subDate = new Date(sub.created_date);
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59);
      if (subDate > endDate) return false;
    }

    // Field filters
    for (const [fieldName, filterValue] of Object.entries(fieldFilters)) {
      if (filterValue && filterValue.trim()) {
        const fieldValue = sub.submission_data?.[fieldName];
        if (!fieldValue || !fieldValue.toString().toLowerCase().includes(filterValue.toLowerCase())) {
          return false;
        }
      }
    }

    return true;
  });

  const { data: fields = [] } = useQuery({
    queryKey: ['form-fields', formId],
    queryFn: () => base44.entities.Form_Field.filter({ form_id: formId }),
    enabled: !!formId
  });

  // Generate AI Insights - Enhanced with Sentiment & Intent
  const generateAIInsights = async (analysisType = 'comprehensive') => {
    if (submissions.length === 0) {
      alert('Need at least some submissions to generate insights');
      return;
    }

    setLoadingInsights(true);
    setSelectedAnalysis(analysisType);
    
    try {
      const submissionsData = submissions.map(s => ({
        date: new Date(s.created_date).toISOString(),
        data: s.submission_data,
        ip: s.ip_address
      }));

      const fieldsData = fields.map(f => ({
        name: f.field_name,
        label: f.field_label,
        type: f.field_type,
        required: f.is_required
      }));

      let prompt = '';
      let schema = {};

      if (analysisType === 'comprehensive') {
        prompt = `Analyze these form submissions and provide insights:

Form: ${form.form_name}
Total Submissions: ${submissions.length}
Fields: ${JSON.stringify(fieldsData)}
Submissions Data (sample of last 20): ${JSON.stringify(submissionsData.slice(0, 20))}

Please provide:
1. Top 3 performing fields (highest completion rates)
2. Fields with low completion rates (potential drop-off points)
3. Submission trends summary
4. 3 specific recommendations to improve conversion rate
5. Any patterns that might indicate fraudulent/spam submissions (duplicate IPs, suspicious patterns)
6. 3 A/B testing recommendations for form elements

Format as JSON with these keys: topFields, lowFields, trends, recommendations, fraudPatterns, abTestIdeas`;

        schema = {
          type: "object",
          properties: {
            topFields: { type: "array", items: { type: "object" } },
            lowFields: { type: "array", items: { type: "object" } },
            trends: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } },
            fraudPatterns: { type: "array", items: { type: "string" } },
            abTestIdeas: { type: "array", items: { type: "string" } }
          }
        };
      } else if (analysisType === 'sentiment') {
        prompt = `Analyze the sentiment and emotional tone of these form submissions:

Form: ${form.form_name}
Submissions Data (last 30): ${JSON.stringify(submissionsData.slice(0, 30))}

Analyze:
1. Overall sentiment distribution (positive/neutral/negative percentages)
2. Sentiment by field (which fields have most positive/negative responses)
3. Common emotional themes (excitement, frustration, confusion, satisfaction)
4. Sentiment trends over time
5. Actionable insights based on sentiment

Format as JSON with: sentimentDistribution, fieldSentiment, emotionalThemes, sentimentTrends, sentimentInsights`;

        schema = {
          type: "object",
          properties: {
            sentimentDistribution: { 
              type: "object",
              properties: {
                positive: { type: "number" },
                neutral: { type: "number" },
                negative: { type: "number" }
              }
            },
            fieldSentiment: { type: "array", items: { type: "object" } },
            emotionalThemes: { type: "array", items: { type: "string" } },
            sentimentTrends: { type: "string" },
            sentimentInsights: { type: "array", items: { type: "string" } }
          }
        };
      } else if (analysisType === 'intent') {
        prompt = `Analyze the user intent behind these form submissions:

Form: ${form.form_name}
Submissions Data (last 30): ${JSON.stringify(submissionsData.slice(0, 30))}

Identify:
1. Primary user intents (what are users trying to accomplish?)
2. Intent categories with percentages (e.g., Purchase Intent 40%, Support Request 30%, etc.)
3. Intent by field (which fields reveal user intent)
4. Buying signals detected (urgency indicators, budget mentions, timeline)
5. User journey stage (awareness, consideration, decision)
6. Action recommendations based on intent

Format as JSON with: primaryIntents, intentCategories, intentByField, buyingSignals, journeyStage, actionRecommendations`;

        schema = {
          type: "object",
          properties: {
            primaryIntents: { type: "array", items: { type: "string" } },
            intentCategories: { type: "array", items: { type: "object" } },
            intentByField: { type: "array", items: { type: "object" } },
            buyingSignals: { type: "array", items: { type: "string" } },
            journeyStage: { type: "object" },
            actionRecommendations: { type: "array", items: { type: "string" } }
          }
        };
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema
      });

      setAiInsights({ type: analysisType, data: result });
    } catch (error) {
      alert('Failed to generate AI insights: ' + error.message);
    } finally {
      setLoadingInsights(false);
    }
  };

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

  // Prepare chart data
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

  // Get field completion rates
  const getFieldCompletionRates = () => {
    return fields.map(field => {
      const completedCount = submissions.filter(s => 
        s.submission_data?.[field.field_name] && 
        s.submission_data[field.field_name].toString().trim() !== ''
      ).length;
      
      const rate = submissions.length > 0 
        ? (completedCount / submissions.length * 100).toFixed(1)
        : 0;
      
      return {
        field: field.field_label,
        rate: parseFloat(rate),
        count: completedCount
      };
    }).sort((a, b) => b.rate - a.rate);
  };

  const chartData = getChartData();
  const fieldCompletionRates = getFieldCompletionRates();

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      alert('No submissions to export');
      return;
    }

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

  const SENTIMENT_COLORS = {
    positive: '#52c41a',
    neutral: '#1890ff',
    negative: '#f5222d'
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f5f7fa' }}>
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
          {['performance', 'ai-insights', 'analyze', 'submissions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'ai-insights' && <Sparkles className="w-4 h-4" />}
              {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Performance Tab */}
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
                      <p className="text-sm mb-2" style={{ color: "#888" }}>Avg. Daily</p>
                      <p className="text-3xl font-bold" style={{ color: "#52c41a" }}>
                        {last30Days.length > 0 ? (last30Days.length / 30).toFixed(1) : '0'}
                      </p>
                    </div>
                    <div className="ampvibe-inset p-3 rounded-xl">
                      <TrendingUp className="w-6 h-6" style={{ color: "#52c41a" }} />
                    </div>
                  </div>
                </NeuroCard>
              </div>

              {/* Chart */}
              <NeuroCard className="p-6">
                <h3 className="text-lg font-bold mb-6" style={{ color: "#666" }}>Submission Trends</h3>
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

              {/* Field Performance */}
              <NeuroCard className="p-6">
                <h3 className="text-lg font-bold mb-6" style={{ color: "#666" }}>Field Completion Rates</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fieldCompletionRates}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="field" tick={{ fill: '#888' }} angle={-45} textAnchor="end" height={100} />
                      <YAxis tick={{ fill: '#888' }} />
                      <Tooltip />
                      <Bar dataKey="rate" fill="#00A86B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </NeuroCard>
            </div>
          )}

          {/* AI Insights Tab - ENHANCED */}
          {activeTab === 'ai-insights' && (
            <div className="space-y-6">
              {/* Analysis Type Selector */}
              <NeuroCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="ampvibe-inset p-3 rounded-xl">
                      <Sparkles className="w-6 h-6" style={{ color: "#722ed1" }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: "#666" }}>AI-Powered Insights</h2>
                      <p className="text-sm" style={{ color: "#888" }}>
                        Choose analysis type for intelligent recommendations
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analysis Type Buttons */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <button
                    onClick={() => generateAIInsights('comprehensive')}
                    disabled={loadingInsights}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedAnalysis === 'comprehensive' && aiInsights
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <Brain className="w-8 h-8 mb-3 mx-auto" style={{ color: "#0066cc" }} />
                    <h3 className="font-bold mb-2" style={{ color: "#111827" }}>Comprehensive Analysis</h3>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Complete form analysis with performance, fraud detection, and A/B testing ideas
                    </p>
                  </button>

                  <button
                    onClick={() => generateAIInsights('sentiment')}
                    disabled={loadingInsights}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedAnalysis === 'sentiment' && aiInsights
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <MessageCircle className="w-8 h-8 mb-3 mx-auto" style={{ color: "#52c41a" }} />
                    <h3 className="font-bold mb-2" style={{ color: "#111827" }}>Sentiment Analysis</h3>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Understand emotional tone and user satisfaction from submissions
                    </p>
                  </button>

                  <button
                    onClick={() => generateAIInsights('intent')}
                    disabled={loadingInsights}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedAnalysis === 'intent' && aiInsights
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <Search className="w-8 h-8 mb-3 mx-auto" style={{ color: "#722ed1" }} />
                    <h3 className="font-bold mb-2" style={{ color: "#111827" }}>Intent Detection</h3>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Identify user goals, buying signals, and journey stages
                    </p>
                  </button>
                </div>

                {loadingInsights && (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mr-3" style={{ color: "#0066cc" }} />
                    <span style={{ color: "#6b7280" }}>Analyzing {submissions.length} submissions...</span>
                  </div>
                )}
              </NeuroCard>

              {/* Comprehensive Analysis Results */}
              {aiInsights && aiInsights.type === 'comprehensive' && (
                <>
                  {/* Top Performing Fields */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-5 h-5" style={{ color: "#52c41a" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Top Performing Fields</h3>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.data.topFields?.map((field, idx) => (
                        <div key={idx} className="ampvibe-inset p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold" style={{ color: "#666" }}>{field.field || field.name}</p>
                            <span className="text-sm text-green-600 font-bold">{field.rate || field.completion_rate}%</span>
                          </div>
                          <p className="text-sm" style={{ color: "#888" }}>{field.reason || field.insight}</p>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>

                  {/* Low Completion Fields */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5" style={{ color: "#fa8c16" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Fields Needing Improvement</h3>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.data.lowFields?.map((field, idx) => (
                        <div key={idx} className="ampvibe-inset p-4 rounded-lg border-l-4 border-orange-400">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold" style={{ color: "#666" }}>{field.field || field.name}</p>
                            <span className="text-sm text-orange-600 font-bold">{field.rate || field.completion_rate}%</span>
                          </div>
                          <p className="text-sm" style={{ color: "#888" }}>{field.issue || field.reason}</p>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>

                  {/* Trends Summary */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <BarChart3 className="w-5 h-5" style={{ color: "#4a90e2" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Submission Trends</h3>
                    </div>
                    <p style={{ color: "#666", lineHeight: "1.6" }}>{aiInsights.data.trends}</p>
                  </NeuroCard>

                  {/* Recommendations */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-5 h-5" style={{ color: "#00A86B" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Conversion Improvement Recommendations</h3>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.data.recommendations?.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-3 ampvibe-inset p-4 rounded-lg">
                          <div className="ampvibe-button p-2 rounded-lg text-green-600 font-bold">
                            {idx + 1}
                          </div>
                          <p style={{ color: "#666" }}>{rec}</p>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>

                  {/* Fraud Detection */}
                  {aiInsights.data.fraudPatterns && aiInsights.data.fraudPatterns.length > 0 && (
                    <NeuroCard className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5" style={{ color: "#f5222d" }} />
                        <h3 className="text-lg font-bold" style={{ color: "#666" }}>Potential Fraud/Spam Patterns</h3>
                      </div>
                      <div className="space-y-3">
                        {aiInsights.data.fraudPatterns.map((pattern, idx) => (
                          <div key={idx} className="ampvibe-inset p-4 rounded-lg border-l-4 border-red-500">
                            <p style={{ color: "#666" }}>{pattern}</p>
                          </div>
                        ))}
                      </div>
                    </NeuroCard>
                  )}

                  {/* A/B Testing Ideas */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="w-5 h-5" style={{ color: "#fa8c16" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>A/B Testing Recommendations</h3>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.data.abTestIdeas?.map((idea, idx) => (
                        <div key={idx} className="flex items-start gap-3 ampvibe-inset p-4 rounded-lg">
                          <div className="ampvibe-button p-2 rounded-lg text-orange-600">
                            <Lightbulb className="w-4 h-4" />
                          </div>
                          <p style={{ color: "#666" }}>{idea}</p>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>
                </>
              )}

              {/* Sentiment Analysis Results */}
              {aiInsights && aiInsights.type === 'sentiment' && (
                <>
                  {/* Sentiment Distribution */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <MessageCircle className="w-5 h-5" style={{ color: "#52c41a" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Overall Sentiment Distribution</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-6 rounded-lg" style={{ background: '#f6ffed', border: '2px solid #52c41a' }}>
                        <Smile className="w-12 h-12 mx-auto mb-3" style={{ color: "#52c41a" }} />
                        <p className="text-3xl font-bold mb-1" style={{ color: "#52c41a" }}>
                          {aiInsights.data.sentimentDistribution?.positive || 0}%
                        </p>
                        <p className="text-sm font-medium" style={{ color: "#52c41a" }}>Positive</p>
                      </div>

                      <div className="text-center p-6 rounded-lg" style={{ background: '#e6f7ff', border: '2px solid #1890ff' }}>
                        <Meh className="w-12 h-12 mx-auto mb-3" style={{ color: "#1890ff" }} />
                        <p className="text-3xl font-bold mb-1" style={{ color: "#1890ff" }}>
                          {aiInsights.data.sentimentDistribution?.neutral || 0}%
                        </p>
                        <p className="text-sm font-medium" style={{ color: "#1890ff" }}>Neutral</p>
                      </div>

                      <div className="text-center p-6 rounded-lg" style={{ background: '#fff1f0', border: '2px solid #f5222d' }}>
                        <Frown className="w-12 h-12 mx-auto mb-3" style={{ color: "#f5222d" }} />
                        <p className="text-3xl font-bold mb-1" style={{ color: "#f5222d" }}>
                          {aiInsights.data.sentimentDistribution?.negative || 0}%
                        </p>
                        <p className="text-sm font-medium" style={{ color: "#f5222d" }}>Negative</p>
                      </div>
                    </div>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Positive', value: aiInsights.data.sentimentDistribution?.positive || 0 },
                              { name: 'Neutral', value: aiInsights.data.sentimentDistribution?.neutral || 0 },
                              { name: 'Negative', value: aiInsights.data.sentimentDistribution?.negative || 0 }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill={SENTIMENT_COLORS.positive} />
                            <Cell fill={SENTIMENT_COLORS.neutral} />
                            <Cell fill={SENTIMENT_COLORS.negative} />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </NeuroCard>

                  {/* Field Sentiment */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Heart className="w-5 h-5" style={{ color: "#eb2f96" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Sentiment by Field</h3>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.data.fieldSentiment?.map((field, idx) => (
                        <div key={idx} className="ampvibe-inset p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold" style={{ color: "#666" }}>{field.field}</p>
                            <div className="flex gap-2">
                              <span className="px-2 py-1 rounded text-xs" style={{ background: '#f6ffed', color: '#52c41a' }}>
                                <ThumbsUp className="w-3 h-3 inline mr-1" />
                                {field.positive}%
                              </span>
                              <span className="px-2 py-1 rounded text-xs" style={{ background: '#fff1f0', color: '#f5222d' }}>
                                <ThumbsDown className="w-3 h-3 inline mr-1" />
                                {field.negative}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm" style={{ color: "#888" }}>{field.insight}</p>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>

                  {/* Emotional Themes */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="w-5 h-5" style={{ color: "#722ed1" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Common Emotional Themes</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {aiInsights.data.emotionalThemes?.map((theme, idx) => (
                        <span key={idx} className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: '#f0f0f0', color: "#666" }}>
                          {theme}
                        </span>
                      ))}
                    </div>
                  </NeuroCard>

                  {/* Sentiment Trends */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-5 h-5" style={{ color: "#0066cc" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Sentiment Trends Over Time</h3>
                    </div>
                    <p style={{ color: "#666", lineHeight: "1.6" }}>{aiInsights.data.sentimentTrends}</p>
                  </NeuroCard>

                  {/* Actionable Insights */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-5 h-5" style={{ color: "#00a86b" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Actionable Sentiment Insights</h3>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.data.sentimentInsights?.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-3 ampvibe-inset p-4 rounded-lg">
                          <div className="ampvibe-button p-2 rounded-lg text-green-600 font-bold">
                            {idx + 1}
                          </div>
                          <p style={{ color: "#666" }}>{insight}</p>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>
                </>
              )}

              {/* Intent Detection Results */}
              {aiInsights && aiInsights.type === 'intent' && (
                <>
                  {/* Primary Intents */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Search className="w-5 h-5" style={{ color: "#722ed1" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Primary User Intents Detected</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {aiInsights.data.primaryIntents?.map((intent, idx) => (
                        <div key={idx} className="ampvibe-inset p-4 rounded-lg flex items-center gap-3">
                          <Target className="w-6 h-6" style={{ color: "#722ed1" }} />
                          <p className="font-medium" style={{ color: "#666" }}>{intent}</p>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>

                  {/* Intent Categories */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <BarChart3 className="w-5 h-5" style={{ color: "#0066cc" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Intent Distribution</h3>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.data.intentCategories?.map((category, idx) => (
                        <div key={idx} className="ampvibe-inset p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold" style={{ color: "#666" }}>{category.name || category.intent}</p>
                            <span className="text-lg font-bold" style={{ color: "#0066cc" }}>
                              {category.percentage || category.percent}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${category.percentage || category.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>

                  {/* Intent by Field */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-5 h-5" style={{ color: "#fa8c16" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Intent Indicators by Field</h3>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.data.intentByField?.map((field, idx) => (
                        <div key={idx} className="ampvibe-inset p-4 rounded-lg">
                          <p className="font-semibold mb-2" style={{ color: "#666" }}>{field.field}</p>
                          <p className="text-sm" style={{ color: "#888" }}>{field.reveals || field.insight}</p>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>

                  {/* Buying Signals */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <DollarSign className="w-5 h-5" style={{ color: "#52c41a" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Buying Signals Detected</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {aiInsights.data.buyingSignals?.map((signal, idx) => (
                        <div key={idx} className="ampvibe-inset p-4 rounded-lg border-l-4 border-green-500">
                          <p style={{ color: "#666" }}>{signal}</p>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>

                  {/* Journey Stage */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-5 h-5" style={{ color: "#1890ff" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>User Journey Stage Analysis</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(aiInsights.data.journeyStage || {}).map(([stage, percentage]) => (
                        <div key={stage} className="text-center p-4 rounded-lg ampvibe-inset">
                          <p className="text-2xl font-bold mb-2" style={{ color: "#0066cc" }}>{percentage}%</p>
                          <p className="text-sm font-medium capitalize" style={{ color: "#666" }}>{stage}</p>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>

                  {/* Action Recommendations */}
                  <NeuroCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="w-5 h-5" style={{ color: "#fa8c16" }} />
                      <h3 className="text-lg font-bold" style={{ color: "#666" }}>Intent-Based Action Recommendations</h3>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.data.actionRecommendations?.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-3 ampvibe-inset p-4 rounded-lg">
                          <div className="ampvibe-button p-2 rounded-lg text-orange-600 font-bold">
                            {idx + 1}
                          </div>
                          <p style={{ color: "#666" }}>{rec}</p>
                        </div>
                      ))}
                    </div>
                  </NeuroCard>
                </>
              )}

              {/* Empty State */}
              {!aiInsights && !loadingInsights && (
                <NeuroCard className="p-12 text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: "#d1d5db" }} />
                  <p className="text-lg font-medium mb-2" style={{ color: "#888" }}>
                    No insights generated yet
                  </p>
                  <p className="text-sm mb-6" style={{ color: "#aaa" }}>
                    Choose an analysis type above to generate AI-powered insights
                  </p>
                </NeuroCard>
              )}
            </div>
          )}

          {/* Analyze Tab */}
          {activeTab === 'analyze' && (
            <NeuroCard className="p-6">
              <h3 className="text-lg font-bold mb-6" style={{ color: "#666" }}>Detailed Field Analysis</h3>
              
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

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <>
              {/* Filters */}
              <NeuroCard className="p-6 mb-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: "#666" }}>Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="ampvibe-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="ampvibe-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setFilterStartDate('');
                        setFilterEndDate('');
                        setFieldFilters({});
                      }}
                      className="ampvibe-button px-4 py-2 text-sm w-full"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
                
                {/* Field Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fields.slice(0, 6).map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                        {field.field_label}
                      </label>
                      <input
                        type="text"
                        value={fieldFilters[field.field_name] || ''}
                        onChange={(e) => setFieldFilters({ ...fieldFilters, [field.field_name]: e.target.value })}
                        placeholder={`Filter by ${field.field_label.toLowerCase()}`}
                        className="ampvibe-input w-full px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-sm" style={{ color: "#888" }}>
                  Showing {submissions.length} of {allSubmissions.length} submissions
                </div>
              </NeuroCard>

              <NeuroCard>
                {submissions.length === 0 ? (
                <div className="text-center py-12" style={{ color: "#aaa" }}>
                  <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: "#ddd" }} />
                  <p className="text-lg mb-2">
                    {allSubmissions.length === 0 ? 'No submissions yet' : 'No submissions match your filters'}
                  </p>
                  <p className="text-sm">
                    {allSubmissions.length === 0 ? 'Share your form to start collecting responses' : 'Try adjusting your filters'}
                  </p>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}