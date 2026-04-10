import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  MessageSquare,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Activity
} from "lucide-react";

const CREDIT_TYPES = [
  {
    key: "message_credits",
    label: "Message Credits",
    description: "Credits used for AI-powered messages, email generation, and chat responses.",
    icon: MessageSquare,
    color: "#1E3A8A",
    bgColor: "rgba(30,58,138,0.1)"
  },
  {
    key: "integration_credits",
    label: "Integration Credits",
    description: "Credits used for external API calls, data enrichment, and integrations.",
    icon: Zap,
    color: "#00A86B",
    bgColor: "rgba(0,168,107,0.1)"
  }
];

export default function CreditsMonitor() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [tokenUsage, setTokenUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me();
    setUser(u);

    const [settingsData, usageData] = await Promise.all([
      base44.entities.Credit_Settings.list(),
      base44.entities.Token_Usage.list("-created_date", 500)
    ]);

    // Map settings by credit_type
    const settingsMap = {};
    for (const s of settingsData) {
      settingsMap[s.credit_type] = s;
    }

    // Initialize missing settings
    for (const ct of CREDIT_TYPES) {
      if (!settingsMap[ct.key]) {
        const created = await base44.entities.Credit_Settings.create({
          credit_type: ct.key,
          is_enabled: true,
          monthly_limit: 0,
          alert_threshold: 80,
          current_usage: 0
        });
        settingsMap[ct.key] = created;
      }
    }

    setSettings(settingsMap);
    setTokenUsage(usageData);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleCredit = async (creditType) => {
    const current = settings[creditType];
    if (!current) return;
    setSaving(prev => ({ ...prev, [creditType]: true }));
    const updated = await base44.entities.Credit_Settings.update(current.id, {
      is_enabled: !current.is_enabled
    });
    setSettings(prev => ({ ...prev, [creditType]: updated }));
    setSaving(prev => ({ ...prev, [creditType]: false }));
  };

  const updateSetting = async (creditType, field, value) => {
    const current = settings[creditType];
    if (!current) return;
    setSaving(prev => ({ ...prev, [`${creditType}_${field}`]: true }));
    const updated = await base44.entities.Credit_Settings.update(current.id, {
      [field]: value
    });
    setSettings(prev => ({ ...prev, [creditType]: updated }));
    setSaving(prev => ({ ...prev, [`${creditType}_${field}`]: false }));
  };

  // Calculate usage stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const messageUsageThisMonth = tokenUsage.filter(t => {
    const d = new Date(t.created_date);
    return d >= monthStart;
  });
  const totalTokensThisMonth = messageUsageThisMonth.reduce((s, t) => s + (t.total_tokens || 0), 0);
  const totalCostThisMonth = messageUsageThisMonth.reduce((s, t) => s + (t.estimated_cost || 0), 0);

  const usageByUser = {};
  for (const t of messageUsageThisMonth) {
    if (!usageByUser[t.user_email]) usageByUser[t.user_email] = { tokens: 0, cost: 0, name: t.user_name };
    usageByUser[t.user_email].tokens += t.total_tokens || 0;
    usageByUser[t.user_email].cost += t.estimated_cost || 0;
  }
  const topUsers = Object.entries(usageByUser)
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .slice(0, 5);

  const usageByAction = {};
  for (const t of messageUsageThisMonth) {
    const key = t.action_type || "Unknown";
    if (!usageByAction[key]) usageByAction[key] = 0;
    usageByAction[key] += t.total_tokens || 0;
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3" style={{ borderColor: "#00A86B" }}></div>
          <p className="text-sm" style={{ color: "#888" }}>Loading credits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E3A8A" }}>Credits Monitor</h1>
          <p className="text-sm mt-1" style={{ color: "#888" }}>Monitor and control your message and integration credit usage</p>
        </div>
        <button
          onClick={handleRefresh}
          className="ampvibe-button px-4 py-2 flex items-center gap-2"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="ampvibe-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(30,58,138,0.1)" }}>
              <Activity className="w-5 h-5" style={{ color: "#1E3A8A" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#888" }}>Tokens This Month</p>
              <p className="text-xl font-bold" style={{ color: "#1E3A8A" }}>{totalTokensThisMonth.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="ampvibe-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,168,107,0.1)" }}>
              <TrendingUp className="w-5 h-5" style={{ color: "#00A86B" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#888" }}>Estimated Cost</p>
              <p className="text-xl font-bold" style={{ color: "#00A86B" }}>${totalCostThisMonth.toFixed(4)}</p>
            </div>
          </div>
        </div>
        <div className="ampvibe-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(234,179,8,0.1)" }}>
              <MessageSquare className="w-5 h-5" style={{ color: "#ca8a04" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#888" }}>AI Requests</p>
              <p className="text-xl font-bold" style={{ color: "#ca8a04" }}>{messageUsageThisMonth.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Toggle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CREDIT_TYPES.map(ct => {
          const s = settings[ct.key] || {};
          const isEnabled = s.is_enabled !== false;
          const isSaving = saving[ct.key];

          return (
            <div key={ct.key} className="ampvibe-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: ct.bgColor }}>
                    <ct.icon className="w-6 h-6" style={{ color: ct.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base" style={{ color: "#333" }}>{ct.label}</h3>
                    <p className="text-xs mt-0.5" style={{ color: "#888" }}>{ct.description}</p>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleCredit(ct.key)}
                  disabled={isSaving}
                  className="relative flex-shrink-0 ml-4"
                  title={isEnabled ? "Click to disable" : "Click to enable"}
                >
                  <div
                    className="w-14 h-7 rounded-full transition-all duration-300 flex items-center px-1"
                    style={{
                      background: isEnabled ? "linear-gradient(135deg, #00A86B, #00C87A)" : "#d1d5db",
                      boxShadow: isEnabled ? "0 2px 8px rgba(0,168,107,0.4)" : "none"
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300"
                      style={{ transform: isEnabled ? "translateX(28px)" : "translateX(0)" }}
                    />
                  </div>
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-4">
                {isEnabled ? (
                  <CheckCircle className="w-4 h-4" style={{ color: "#00A86B" }} />
                ) : (
                  <XCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
                )}
                <span className="text-sm font-medium" style={{ color: isEnabled ? "#00A86B" : "#ef4444" }}>
                  {isEnabled ? "Enabled" : "Disabled"}
                </span>
                {isSaving && <span className="text-xs" style={{ color: "#888" }}>(saving...)</span>}
              </div>

              {/* Settings */}
              <div className="space-y-3 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: "#666" }}>
                    Monthly Limit (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="ampvibe-input text-sm py-1 px-2 w-28 text-right"
                    defaultValue={s.monthly_limit || 0}
                    onBlur={(e) => updateSetting(ct.key, "monthly_limit", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: "#666" }}>
                    Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="ampvibe-input text-sm py-1 px-2 w-28 text-right"
                    defaultValue={s.alert_threshold || 80}
                    onBlur={(e) => updateSetting(ct.key, "alert_threshold", parseInt(e.target.value) || 80)}
                  />
                </div>
                {s.monthly_limit > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: "#888" }}>
                      <span>Usage</span>
                      <span>{(s.current_usage || 0).toLocaleString()} / {s.monthly_limit.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: "#e5e7eb" }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((s.current_usage || 0) / s.monthly_limit) * 100)}%`,
                          background: ((s.current_usage || 0) / s.monthly_limit) > (s.alert_threshold / 100)
                            ? "#ef4444"
                            : "#00A86B"
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage Breakdown */}
      {messageUsageThisMonth.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Users */}
          <div className="ampvibe-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "#1E3A8A" }}>
              <Settings className="w-4 h-4" /> Top Users This Month
            </h3>
            <div className="space-y-3">
              {topUsers.map(([email, data]) => (
                <div key={email} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-sm font-medium truncate" style={{ color: "#333" }}>{data.name || email}</p>
                    <p className="text-xs truncate" style={{ color: "#888" }}>{email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: "#1E3A8A" }}>{(data.tokens || 0).toLocaleString()}</p>
                    <p className="text-xs" style={{ color: "#888" }}>tokens</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage by Action */}
          <div className="ampvibe-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "#1E3A8A" }}>
              <Activity className="w-4 h-4" /> Usage by Action
            </h3>
            <div className="space-y-3">
              {Object.entries(usageByAction)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([action, tokens]) => {
                  const pct = totalTokensThisMonth > 0 ? (tokens / totalTokensThisMonth) * 100 : 0;
                  return (
                    <div key={action}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "#666" }}>{action}</span>
                        <span style={{ color: "#333" }} className="font-medium">{tokens.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "#e5e7eb" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: "#00A86B" }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {messageUsageThisMonth.length === 0 && (
        <div className="ampvibe-card p-12 text-center">
          <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: "#d1d5db" }} />
          <p className="font-medium" style={{ color: "#888" }}>No usage data this month</p>
          <p className="text-sm mt-1" style={{ color: "#bbb" }}>Usage analytics will appear here once AI features are used.</p>
        </div>
      )}
    </div>
  );
}