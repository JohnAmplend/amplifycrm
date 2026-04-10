import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Phone, CheckCircle, XCircle, Search, Settings as SettingsIcon, Copy, ExternalLink, Key, Webhook, ChevronDown, ChevronUp, Info } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function RingCentral() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const webhookUrl = `${window.location.origin.replace('443', '').replace(':80', '')}/functions/webhook`;
  const functionBaseUrl = "https://api.base44.com/api/apps/YOUR_APP_ID/functions";

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [settings, setSettings] = useState({
    auto_create_contacts: true,
    auto_create_activities: true,
    default_owner: ""
  });

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['ringcentral_calls'],
    queryFn: () => base44.entities.RingCentral_Call.list('-call_datetime')
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const filteredCalls = calls.filter(call => {
    const matchesSearch = 
      call.from_number?.includes(searchTerm) ||
      call.to_number?.includes(searchTerm) ||
      contacts.find(c => c.id === call.contact_id)?.first_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDirection = !filterDirection || call.direction === filterDirection;
    const matchesStatus = !filterStatus || call.call_status === filterStatus;
    
    return matchesSearch && matchesDirection && matchesStatus;
  });

  const getContactName = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : null;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              RingCentral Integration
            </h1>
            <p style={{ color: "#888" }}>Manage call logs and settings</p>
          </div>
            <div className="flex gap-2">
            <NeuroButton onClick={() => setShowSetup(!showSetup)}>
              <Key className="w-4 h-4 mr-2" />
              Integration Setup
            </NeuroButton>
            <NeuroButton onClick={() => setShowSettings(!showSettings)}>
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </NeuroButton>
          </div>
        </div>

        {/* Integration Setup Panel */}
        {showSetup && (
          <NeuroCard className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#444" }}>RingCentral Integration Setup</h2>
                <p className="text-sm mt-1" style={{ color: "#888" }}>Follow these steps to connect RingCentral to your CRM</p>
              </div>
              <button onClick={() => setShowSetup(false)} className="ampvibe-button p-2"><XCircle className="w-5 h-5" /></button>
            </div>

            {/* Step 1 */}
            <div className="mb-6 p-4 rounded-xl border-l-4" style={{ background: "rgba(74, 144, 226, 0.05)", borderColor: "#4a90e2" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "#4a90e2" }}>1</span>
                <h3 className="font-bold" style={{ color: "#444" }}>Set API Credentials (Environment Variables)</h3>
              </div>
              <p className="text-sm mb-3" style={{ color: "#666" }}>Go to <strong>Dashboard → Settings → Environment Variables</strong> and ensure these are set:</p>
              <div className="space-y-2">
                {[
                  { key: "RINGCENTRAL_CLIENT_ID", desc: "Your RingCentral App Client ID" },
                  { key: "RINGCENTRAL_CLIENT_SECRET", desc: "Your RingCentral App Client Secret" },
                  { key: "RINGCENTRAL_JWT_TOKEN", desc: "JWT token for server-to-server auth (from RingCentral Developer Console)" }
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.03)" }}>
                    <Key className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#4a90e2" }} />
                    <div>
                      <code className="text-sm font-bold" style={{ color: "#333" }}>{key}</code>
                      <p className="text-xs mt-0.5" style={{ color: "#888" }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href="https://developers.ringcentral.com/guide/authentication/jwt" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm mt-3" style={{ color: "#4a90e2" }}>
                <ExternalLink className="w-3 h-3" /> How to get JWT Token from RingCentral
              </a>
            </div>

            {/* Step 2 */}
            <div className="mb-6 p-4 rounded-xl border-l-4" style={{ background: "rgba(0, 168, 107, 0.05)", borderColor: "#00A86B" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "#00A86B" }}>2</span>
                <h3 className="font-bold" style={{ color: "#444" }}>Configure Webhook in RingCentral</h3>
              </div>
              <p className="text-sm mb-3" style={{ color: "#666" }}>In your <strong>RingCentral Developer Console → Your App → Webhooks</strong>, add this URL:</p>
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.04)" }}>
                <code className="flex-1 text-sm break-all" style={{ color: "#333" }}>
                  https://api.base44.com/api/apps/<span style={{color:"#00A86B"}}>YOUR_APP_ID</span>/functions/ringcentral-webhook
                </code>
                <button
                  onClick={() => handleCopy("https://api.base44.com/api/apps/YOUR_APP_ID/functions/ringcentral-webhook")}
                  className="ampvibe-button p-2 flex-shrink-0"
                  title="Copy URL"
                >
                  {copiedUrl ? <CheckCircle className="w-4 h-4" style={{ color: "#00A86B" }} /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-3 p-3 rounded-lg" style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)" }}>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#f5a623" }} />
                  <p className="text-xs" style={{ color: "#666" }}>
                    Replace <strong>YOUR_APP_ID</strong> with your actual Base44 App ID found in Dashboard → Settings → App Info. Subscribe to event filters: <strong>telephony/sessions</strong> and <strong>telephony/callRecordings</strong>.
                  </p>
                </div>
              </div>
              <a href="https://developers.ringcentral.com/guide/notifications/webhooks" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm mt-3" style={{ color: "#00A86B" }}>
                <ExternalLink className="w-3 h-3" /> RingCentral Webhook Setup Guide
              </a>
            </div>

            {/* Step 3 */}
            <div className="mb-6 p-4 rounded-xl border-l-4" style={{ background: "rgba(130, 80, 255, 0.05)", borderColor: "#8250ff" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "#8250ff" }}>3</span>
                <h3 className="font-bold" style={{ color: "#444" }}>Sync Call Logs via API</h3>
              </div>
              <p className="text-sm mb-3" style={{ color: "#666" }}>Use the <strong>Recording Sync</strong> page to manually pull call history from RingCentral into the CRM. This uses the JWT token to authenticate directly with the RingCentral REST API.</p>
              <a href="/RingCentralRecordingSync"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "#8250ff" }}>
                Go to Recording Sync →
              </a>
            </div>

            {/* How data flows */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <h3 className="font-bold mb-2" style={{ color: "#444" }}>How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" style={{ color: "#666" }}>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold" style={{ color: "#4a90e2" }}>📞 Webhook (Real-time)</span>
                  <span>RingCentral pushes call events to your function. Calls are logged automatically as they happen.</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold" style={{ color: "#00A86B" }}>🎙 Recording Download</span>
                  <span>After a call ends, the recording is fetched and uploaded to Base44 storage.</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold" style={{ color: "#8250ff" }}>🔄 API Sync</span>
                  <span>Manually pull historical call logs using your JWT token via the Recording Sync page.</span>
                </div>
              </div>
            </div>
          </NeuroCard>
        )}

        {showSettings && (
          <NeuroCard className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              Integration Settings
            </h2>
            <div className="space-y-4">
              <div className="neuro-inset p-4 rounded-lg">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.auto_create_contacts}
                    onChange={(e) => setSettings({ ...settings, auto_create_contacts: e.target.checked })}
                    className="neuro-button w-5 h-5"
                  />
                  <div>
                    <p className="font-medium" style={{ color: "#666" }}>Auto-create contacts from incoming calls</p>
                    <p className="text-sm" style={{ color: "#aaa" }}>Automatically create a new contact when receiving calls from unknown numbers</p>
                  </div>
                </label>
              </div>

              <div className="neuro-inset p-4 rounded-lg">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.auto_create_activities}
                    onChange={(e) => setSettings({ ...settings, auto_create_activities: e.target.checked })}
                    className="neuro-button w-5 h-5"
                  />
                  <div>
                    <p className="font-medium" style={{ color: "#666" }}>Auto-create activities from calls</p>
                    <p className="text-sm" style={{ color: "#aaa" }}>Automatically log each call as an activity</p>
                  </div>
                </label>
              </div>

              <div className="neuro-inset p-4 rounded-lg">
                <p className="font-medium mb-2" style={{ color: "#666" }}>Webhook URL</p>
                <div className="neuro-input">
                  <code className="text-sm" style={{ color: "#666" }}>
                    https://your-app.base44.com/functions/ringcentral-webhook
                  </code>
                </div>
                <p className="text-sm mt-2" style={{ color: "#aaa" }}>
                  Configure this URL in your RingCentral webhook settings
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <NeuroButton onClick={() => setShowSettings(false)}>
                  Close
                </NeuroButton>
                <NeuroButton variant="primary">
                  Save Settings
                </NeuroButton>
              </div>
            </div>
          </NeuroCard>
        )}

        {/* Connection Status */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <NeuroCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: "#aaa" }}>Status</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" style={{ color: "#52c41a" }} />
                  <p className="font-bold" style={{ color: "#52c41a" }}>Connected</p>
                </div>
              </div>
              <div className="neuro-inset p-3 rounded-xl">
                <Phone className="w-6 h-6" style={{ color: "#4a90e2" }} />
              </div>
            </div>
          </NeuroCard>

          <NeuroCard>
            <div>
              <p className="text-sm mb-1" style={{ color: "#aaa" }}>Total Calls</p>
              <p className="text-3xl font-bold" style={{ color: "#666" }}>
                {calls.length}
              </p>
            </div>
          </NeuroCard>

          <NeuroCard>
            <div>
              <p className="text-sm mb-1" style={{ color: "#aaa" }}>Matched Contacts</p>
              <p className="text-3xl font-bold" style={{ color: "#666" }}>
                {calls.filter(c => c.contact_id).length}
              </p>
            </div>
          </NeuroCard>
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neuro-input w-full pl-12"
              />
            </div>
            <NeuroSelect
              placeholder="Filter by direction"
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
              options={[
                { value: 'Inbound', label: 'Inbound' },
                { value: 'Outbound', label: 'Outbound' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'Completed', label: 'Completed' },
                { value: 'Missed', label: 'Missed' },
                { value: 'Voicemail', label: 'Voicemail' },
                { value: 'Busy', label: 'Busy' }
              ]}
            />
          </div>
        </NeuroCard>

        {/* Call Logs */}
        <NeuroCard>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            Call Logs
          </h2>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading calls...
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p style={{ color: "#aaa" }}>No calls found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Date/Time</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Direction</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>From/To</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Contact</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Duration</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.map((call) => (
                    <tr
                      key={call.id}
                      onClick={() => navigate(createPageUrl("CallDetail") + `?id=${call.id}`)}
                      className="border-b cursor-pointer hover:bg-gray-100 transition-colors"
                      style={{ borderColor: "#d8d8d8" }}
                    >
                      <td className="py-3 px-4" style={{ color: "#666" }}>
                        {new Date(call.call_datetime).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`neuro-button px-2 py-1 text-xs ${
                          call.direction === 'Inbound' ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {call.direction}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>
                        {call.direction === 'Inbound' ? call.from_number : call.to_number}
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>
                        {call.contact_id ? (
                          <span className="font-medium" style={{ color: "#666" }}>
                            {getContactName(call.contact_id)}
                          </span>
                        ) : (
                          <span style={{ color: "#aaa" }}>Unknown</span>
                        )}
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`neuro-button px-2 py-1 text-xs ${
                          call.call_status === 'Completed' ? 'text-green-600' :
                          call.call_status === 'Missed' ? 'text-red-600' :
                          call.call_status === 'Voicemail' ? 'text-orange-600' : ''
                        }`}>
                          {call.call_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}