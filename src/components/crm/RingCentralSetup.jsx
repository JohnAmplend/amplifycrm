import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Key, CheckCircle, XCircle, Save, ExternalLink, Eye, EyeOff, RefreshCw, Info } from "lucide-react";
import NeuroButton from "./NeuroButton";
import NeuroCard from "./NeuroCard";

export default function RingCentralSetup({ user }) {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    client_id: "",
    client_secret: "",
    jwt_token: "",
    account_id: "",
    extension_id: ""
  });
  const [showSecret, setShowSecret] = useState(false);
  const [showJwt, setShowJwt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.RingCentral_Config.filter({ user_email: user.email })
      .then(results => {
        if (results[0]) {
          setConfig(results[0]);
          setForm({
            client_id: results[0].client_id || "",
            client_secret: results[0].client_secret || "",
            jwt_token: results[0].jwt_token || "",
            account_id: results[0].account_id || "",
            extension_id: results[0].extension_id || ""
          });
        }
      });
  }, [user?.email]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const data = { ...form, user_email: user.email };
    if (config?.id) {
      await base44.entities.RingCentral_Config.update(config.id, data);
    } else {
      const created = await base44.entities.RingCentral_Config.create(data);
      setConfig(created);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("ringcentral/testConnection", {
        jwt_token: form.jwt_token,
        client_id: form.client_id,
        client_secret: form.client_secret
      });
      if (res.data?.success) {
        setTestResult({ ok: true, msg: `Connected! Account: ${res.data.account || "verified"}` });
        if (config?.id) {
          await base44.entities.RingCentral_Config.update(config.id, { is_connected: true });
          setConfig(c => ({ ...c, is_connected: true }));
        }
      } else {
        setTestResult({ ok: false, msg: res.data?.error || "Connection failed" });
      }
    } catch (e) {
      setTestResult({ ok: false, msg: e.message });
    }
    setTesting(false);
  };

  const isConfigured = form.jwt_token || (form.client_id && form.client_secret);

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl ${config?.is_connected ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
        {config?.is_connected
          ? <CheckCircle className="w-5 h-5 text-green-600" />
          : <XCircle className="w-5 h-5 text-yellow-500" />
        }
        <div>
          <p className="font-semibold text-sm" style={{ color: config?.is_connected ? "#166534" : "#92400e" }}>
            {config?.is_connected ? "RingCentral Connected" : "RingCentral Not Connected"}
          </p>
          {config?.last_synced_at && (
            <p className="text-xs" style={{ color: "#888" }}>Last synced: {new Date(config.last_synced_at).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-xl border-l-4" style={{ background: "rgba(74,144,226,0.05)", borderColor: "#4a90e2" }}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#4a90e2" }} />
          <div className="text-sm" style={{ color: "#555" }}>
            <p className="font-semibold mb-1">How to get your credentials:</p>
            <ol className="list-decimal ml-4 space-y-1 text-xs" style={{ color: "#666" }}>
              <li>Go to <a href="https://developers.ringcentral.com" target="_blank" rel="noreferrer" className="underline" style={{ color: "#4a90e2" }}>RingCentral Developer Console</a></li>
              <li>Create or open your app → copy the <strong>Client ID</strong> and <strong>Client Secret</strong></li>
              <li>Go to <strong>Credentials → JWT</strong> to generate your <strong>JWT Token</strong></li>
              <li>Paste them below and click <strong>Test Connection</strong></li>
            </ol>
            <a href="https://developers.ringcentral.com/guide/authentication/jwt" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs" style={{ color: "#4a90e2" }}>
              <ExternalLink className="w-3 h-3" /> JWT Authentication Guide
            </a>
          </div>
        </div>
      </div>

      {/* Credential Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#444" }}>Client ID</label>
          <input
            className="ampvibe-input w-full"
            placeholder="Your RingCentral App Client ID"
            value={form.client_id}
            onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#444" }}>Client Secret</label>
          <div className="relative">
            <input
              className="ampvibe-input w-full pr-10"
              type={showSecret ? "text" : "password"}
              placeholder="Your RingCentral App Client Secret"
              value={form.client_secret}
              onChange={e => setForm(f => ({ ...f, client_secret: e.target.value }))}
            />
            <button onClick={() => setShowSecret(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showSecret ? <EyeOff className="w-4 h-4" style={{ color: "#aaa" }} /> : <Eye className="w-4 h-4" style={{ color: "#aaa" }} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#444" }}>JWT Token <span className="text-xs font-normal" style={{ color: "#888" }}>(recommended for server auth)</span></label>
          <div className="relative">
            <input
              className="ampvibe-input w-full pr-10"
              type={showJwt ? "text" : "password"}
              placeholder="Your RingCentral JWT Token"
              value={form.jwt_token}
              onChange={e => setForm(f => ({ ...f, jwt_token: e.target.value }))}
            />
            <button onClick={() => setShowJwt(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showJwt ? <EyeOff className="w-4 h-4" style={{ color: "#aaa" }} /> : <Eye className="w-4 h-4" style={{ color: "#aaa" }} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#444" }}>Account ID <span className="text-xs font-normal" style={{ color: "#888" }}>(optional)</span></label>
            <input
              className="ampvibe-input w-full"
              placeholder="~ (default)"
              value={form.account_id}
              onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#444" }}>Extension ID <span className="text-xs font-normal" style={{ color: "#888" }}>(optional)</span></label>
            <input
              className="ampvibe-input w-full"
              placeholder="~ (default)"
              value={form.extension_id}
              onChange={e => setForm(f => ({ ...f, extension_id: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${testResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {testResult.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {testResult.msg}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <NeuroButton
          onClick={handleTest}
          disabled={testing || !isConfigured}
        >
          {testing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
          Test Connection
        </NeuroButton>
        <NeuroButton
          variant="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Credentials"}
        </NeuroButton>
      </div>
    </div>
  );
}