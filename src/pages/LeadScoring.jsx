import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, TrendingUp, Target, Zap, Mail, Phone, Calendar, DollarSign, Award } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function LeadScoring() {
  const queryClient = useQueryClient();
  const [scoringRules, setScoringRules] = useState([]);
  const [showAddRule, setShowAddRule] = useState(false);

  // Fetch existing scoring rules from custom settings
  const { data: settings } = useQuery({
    queryKey: ['lead-scoring-settings'],
    queryFn: async () => {
      // Store in a custom object or user settings
      const user = await base44.auth.me();
      return user.custom_data?.lead_scoring_rules || [];
    }
  });

  useEffect(() => {
    if (settings) {
      setScoringRules(settings);
    }
  }, [settings]);

  const saveRulesMutation = useMutation({
    mutationFn: async (rules) => {
      const user = await base44.auth.me();
      await base44.auth.updateMe({
        custom_data: {
          ...user.custom_data,
          lead_scoring_rules: rules
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lead-scoring-settings']);
      alert('Lead scoring rules saved successfully!');
    }
  });

  const handleSaveRules = () => {
    saveRulesMutation.mutate(scoringRules);
  };

  const addRule = (category) => {
    const newRule = {
      id: 'rule-' + Date.now(),
      category,
      condition_type: 'property_equals',
      property: '',
      operator: 'equals',
      value: '',
      points: 0,
      enabled: true
    };
    setScoringRules([...scoringRules, newRule]);
    setShowAddRule(false);
  };

  const updateRule = (id, updates) => {
    setScoringRules(scoringRules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const deleteRule = (id) => {
    setScoringRules(scoringRules.filter(rule => rule.id !== id));
  };

  const ruleCategories = [
    { value: 'demographic', label: 'Demographic Information', icon: Target, color: '#4a90e2' },
    { value: 'engagement', label: 'Email Engagement', icon: Mail, color: '#00a86b' },
    { value: 'website', label: 'Website Activity', icon: TrendingUp, color: '#fa8c16' },
    { value: 'form', label: 'Form Submissions', icon: Zap, color: '#722ed1' },
    { value: 'deal', label: 'Deal Activity', icon: DollarSign, color: '#eb2f96' }
  ];

  const getRulesByCategory = (category) => {
    return scoringRules.filter(rule => rule.category === category);
  };

  const getTotalPossibleScore = () => {
    return scoringRules.reduce((sum, rule) => sum + (rule.enabled ? Math.abs(rule.points) : 0), 0);
  };

  return (
    <div className="p-8" style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#111827" }}>Lead Scoring</h1>
            <p style={{ color: "#6b7280" }}>Define rules to automatically score leads based on their attributes and behavior</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="ampvibe-inset px-4 py-2 rounded-lg">
              <p className="text-xs" style={{ color: "#9ca3af" }}>Total Possible Score</p>
              <p className="text-2xl font-bold" style={{ color: "#0066cc" }}>{getTotalPossibleScore()}</p>
            </div>
            <NeuroButton variant="primary" onClick={handleSaveRules} disabled={saveRulesMutation.isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {saveRulesMutation.isLoading ? 'Saving...' : 'Save Rules'}
            </NeuroButton>
          </div>
        </div>

        {/* Score Ranges Guide */}
        <NeuroCard className="p-6 mb-6">
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "#111827" }}>
            <Award className="w-5 h-5" style={{ color: "#0066cc" }} />
            Score Ranges & Classifications
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg" style={{ background: '#fee' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: '#dc2626' }}>0-24</p>
              <p className="text-sm font-medium" style={{ color: '#dc2626' }}>Cold Lead</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ background: '#fef3c7' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: '#d97706' }}>25-49</p>
              <p className="text-sm font-medium" style={{ color: '#d97706' }}>Warm Lead</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ background: '#dbeafe' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: '#2563eb' }}>50-74</p>
              <p className="text-sm font-medium" style={{ color: '#2563eb' }}>Hot Lead</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ background: '#dcfce7' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: '#16a34a' }}>75+</p>
              <p className="text-sm font-medium" style={{ color: '#16a34a' }}>Sales Ready</p>
            </div>
          </div>
        </NeuroCard>

        {/* Add Rule Button */}
        {!showAddRule && (
          <div className="mb-6">
            <NeuroButton onClick={() => setShowAddRule(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Scoring Rule
            </NeuroButton>
          </div>
        )}

        {/* Add Rule Selection */}
        {showAddRule && (
          <NeuroCard className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: "#111827" }}>Select Rule Category</h3>
              <button onClick={() => setShowAddRule(false)} className="text-gray-500 hover:text-gray-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {ruleCategories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => addRule(category.value)}
                  className="p-4 border-2 rounded-lg hover:border-blue-500 transition-colors text-left"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <category.icon className="w-6 h-6 mb-2" style={{ color: category.color }} />
                  <p className="font-medium" style={{ color: "#374151" }}>{category.label}</p>
                </button>
              ))}
            </div>
          </NeuroCard>
        )}

        {/* Scoring Rules by Category */}
        {ruleCategories.map((category) => {
          const categoryRules = getRulesByCategory(category.value);
          if (categoryRules.length === 0) return null;

          return (
            <NeuroCard key={category.value} className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <category.icon className="w-5 h-5" style={{ color: category.color }} />
                <h3 className="font-bold" style={{ color: "#111827" }}>{category.label}</h3>
                <span className="text-sm px-2 py-1 rounded" style={{ background: `${category.color}22`, color: category.color }}>
                  {categoryRules.length} {categoryRules.length === 1 ? 'rule' : 'rules'}
                </span>
              </div>

              <div className="space-y-4">
                {categoryRules.map((rule) => (
                  <div key={rule.id} className="flex items-start gap-3 p-4 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                      className="mt-1 w-4 h-4"
                      style={{ accentColor: "#0066cc" }}
                    />

                    <div className="flex-1 grid grid-cols-4 gap-3">
                      {/* Property */}
                      <select
                        value={rule.property}
                        onChange={(e) => updateRule(rule.id, { property: e.target.value })}
                        className="ampvibe-input text-sm"
                      >
                        <option value="">Select property...</option>
                        {category.value === 'demographic' && (
                          <>
                            <option value="job_title">Job Title</option>
                            <option value="company_name">Company Name</option>
                            <option value="lifecycle_stage">Lifecycle Stage</option>
                            <option value="lead_status">Lead Status</option>
                            <option value="industry">Industry</option>
                            <option value="annual_revenue">Annual Revenue</option>
                          </>
                        )}
                        {category.value === 'engagement' && (
                          <>
                            <option value="emails_opened">Emails Opened</option>
                            <option value="emails_clicked">Emails Clicked</option>
                            <option value="email_bounced">Email Bounced</option>
                            <option value="unsubscribed">Unsubscribed</option>
                          </>
                        )}
                        {category.value === 'website' && (
                          <>
                            <option value="page_views">Page Views</option>
                            <option value="time_on_site">Time on Site</option>
                            <option value="pages_visited">Pages Visited</option>
                            <option value="referrer_source">Referrer Source</option>
                          </>
                        )}
                        {category.value === 'form' && (
                          <>
                            <option value="form_submitted">Form Submitted</option>
                            <option value="form_name">Form Name</option>
                            <option value="submission_count">Total Submissions</option>
                          </>
                        )}
                        {category.value === 'deal' && (
                          <>
                            <option value="deal_created">Deal Created</option>
                            <option value="deal_stage">Deal Stage</option>
                            <option value="deal_amount">Deal Amount</option>
                          </>
                        )}
                      </select>

                      {/* Operator */}
                      <select
                        value={rule.operator}
                        onChange={(e) => updateRule(rule.id, { operator: e.target.value })}
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

                      {/* Value */}
                      {!['exists', 'not_exists'].includes(rule.operator) && (
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          placeholder="Value"
                          className="ampvibe-input text-sm"
                        />
                      )}

                      {/* Points */}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={rule.points}
                          onChange={(e) => updateRule(rule.id, { points: parseInt(e.target.value) || 0 })}
                          placeholder="Points"
                          className="ampvibe-input text-sm w-24"
                        />
                        <span className="text-xs" style={{ color: "#6b7280" }}>points</span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 rounded hover:bg-red-50"
                      style={{ color: "#dc2626" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </NeuroCard>
          );
        })}

        {scoringRules.length === 0 && !showAddRule && (
          <NeuroCard className="p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4" style={{ color: "#d1d5db" }} />
            <p className="text-lg font-medium mb-2" style={{ color: "#6b7280" }}>
              No scoring rules yet
            </p>
            <p className="text-sm mb-6" style={{ color: "#9ca3af" }}>
              Create your first rule to start scoring leads automatically
            </p>
            <NeuroButton variant="primary" onClick={() => setShowAddRule(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Rule
            </NeuroButton>
          </NeuroCard>
        )}

        {/* How It Works */}
        <NeuroCard className="p-6">
          <h3 className="font-bold mb-4" style={{ color: "#111827" }}>How Lead Scoring Works</h3>
          <div className="space-y-3 text-sm" style={{ color: "#6b7280" }}>
            <p>
              <strong>1. Define Rules:</strong> Create rules based on demographic information, engagement, website activity, forms, and deals.
            </p>
            <p>
              <strong>2. Assign Points:</strong> Set positive or negative points for each rule. Positive points increase the score, negative points decrease it.
            </p>
            <p>
              <strong>3. Automatic Calculation:</strong> Lead scores are automatically calculated when contacts are created or updated.
            </p>
            <p>
              <strong>4. Segmentation:</strong> Use scores to segment your leads and prioritize sales follow-up.
            </p>
          </div>
        </NeuroCard>
      </div>
    </div>
  );
}