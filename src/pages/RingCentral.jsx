import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Phone, CheckCircle, XCircle, Search, Settings as SettingsIcon, Key } from "lucide-react";
import RingCentralSetup from "../components/crm/RingCentralSetup";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function RingCentral() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

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
                <h2 className="text-xl font-bold" style={{ color: "#444" }}>My RingCentral Connection</h2>
                <p className="text-sm mt-1" style={{ color: "#888" }}>Connect your personal RingCentral account to start syncing calls</p>
              </div>
              <button onClick={() => setShowSetup(false)} className="ampvibe-button p-2"><XCircle className="w-5 h-5" /></button>
            </div>
            <RingCentralSetup user={currentUser} />
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