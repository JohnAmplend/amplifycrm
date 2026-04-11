import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Phone, CheckCircle, XCircle, Search, Settings as SettingsIcon, Key, RefreshCw, Download } from "lucide-react";
import RingCentralSetup from "../components/crm/RingCentralSetup";
import RingCentralDialer from "../components/crm/RingCentralDialer";
import CallAIInsights from "../components/crm/CallAIInsights";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function RingCentral() {
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [rcConfig, setRcConfig] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactSearch, setContactSearch] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      base44.entities.RingCentral_Config.filter({ user_email: u.email })
        .then(r => setRcConfig(r[0] || null))
        .catch(() => {});
    }).catch(() => {});
  }, []);

  const [callsVersion, setCallsVersion] = useState(0);

  const { data: calls = [], isLoading, refetch: refetchCalls } = useQuery({
    queryKey: ['ringcentral_calls'],
    queryFn: () => base44.entities.RingCentral_Call.list('-call_datetime')
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts_rc'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200)
  });

  const handleSync = async () => {
    setSyncing(true);
    await base44.functions.invoke("ringcentral/syncCallsWithRecordings", {}).catch(() => {});
    await refetchCalls();
    setSyncing(false);
  };

  const filteredCalls = calls.filter(call => {
    const matchesSearch =
      !searchTerm ||
      call.from_number?.includes(searchTerm) ||
      call.to_number?.includes(searchTerm);
    const matchesDirection = !filterDirection || call.direction === filterDirection;
    const matchesStatus = !filterStatus || call.call_status === filterStatus;
    return matchesSearch && matchesDirection && matchesStatus;
  });

  const getContactName = (contactId) => {
    const c = contacts.find(c => c.id === contactId);
    return c ? `${c.first_name} ${c.last_name}` : null;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>RingCentral</h1>
            <p style={{ color: "#888" }}>Calls, SMS, and recordings</p>
          </div>
          <div className="flex gap-2">
            <NeuroButton onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Calls"}
            </NeuroButton>
            <NeuroButton onClick={() => setShowSetup(s => !s)}>
              <Key className="w-4 h-4 mr-2" />
              {rcConfig?.is_connected ? "Manage Connection" : "Connect Account"}
            </NeuroButton>
          </div>
        </div>

        {/* Setup Panel */}
        {showSetup && (
          <NeuroCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#444" }}>My RingCentral Connection</h2>
                <p className="text-sm mt-0.5" style={{ color: "#888" }}>Each user connects their own RingCentral account via OAuth</p>
              </div>
              <button onClick={() => setShowSetup(false)} className="ampvibe-button p-2">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <RingCentralSetup
              user={currentUser}
              onConnected={() => {
                base44.entities.RingCentral_Config.filter({ user_email: currentUser?.email })
                  .then(r => setRcConfig(r[0] || null)).catch(() => {});
              }}
            />
          </NeuroCard>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <NeuroCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: "#aaa" }}>Connection</p>
                <div className="flex items-center gap-2">
                  {rcConfig?.is_connected
                    ? <><CheckCircle className="w-5 h-5 text-green-500" /><span className="font-bold text-green-600">Connected</span></>
                    : <><XCircle className="w-5 h-5 text-yellow-500" /><span className="font-bold text-yellow-600">Not Connected</span></>
                  }
                </div>
                {rcConfig?.extension_number && <p className="text-xs mt-1" style={{ color: "#888" }}>{rcConfig.extension_number}</p>}
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <Phone className="w-6 h-6" style={{ color: "#4a90e2" }} />
              </div>
            </div>
          </NeuroCard>

          <NeuroCard>
            <p className="text-sm mb-1" style={{ color: "#aaa" }}>Total Calls</p>
            <p className="text-3xl font-bold" style={{ color: "#666" }}>{calls.length}</p>
          </NeuroCard>

          <NeuroCard>
            <p className="text-sm mb-1" style={{ color: "#aaa" }}>With Recordings</p>
            <p className="text-3xl font-bold" style={{ color: "#666" }}>{calls.filter(c => c.recording_url).length}</p>
          </NeuroCard>
        </div>

        {/* Contacts + Dialer Panel — only when connected */}
        {rcConfig?.is_connected && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Contact Quick Access */}
            <NeuroCard className="lg:col-span-1">
              <h2 className="text-base font-bold mb-3" style={{ color: "#555" }}>Quick Dial Contacts</h2>
              <input
                type="text"
                placeholder="Search contacts..."
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                className="ampvibe-input w-full mb-3"
              />
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {contacts
                  .filter(c => (c.phone || c.mobile) && (
                    !contactSearch ||
                    `${c.first_name} ${c.last_name}`.toLowerCase().includes(contactSearch.toLowerCase()) ||
                    (c.phone || '').includes(contactSearch) ||
                    (c.mobile || '').includes(contactSearch)
                  ))
                  .slice(0, 50)
                  .map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContact(c)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                        selectedContact?.id === c.id ? 'ampvibe-button active' : 'ampvibe-button'
                      }`}
                    >
                      <p className="font-medium" style={{ color: "#444" }}>{c.first_name} {c.last_name}</p>
                      {c.phone && <p className="text-xs" style={{ color: "#888" }}>📞 {c.phone}</p>}
                      {c.mobile && c.mobile !== c.phone && <p className="text-xs" style={{ color: "#888" }}>📱 {c.mobile}</p>}
                    </button>
                  ))
                }
                {contacts.filter(c => c.phone || c.mobile).length === 0 && (
                  <p className="text-center text-xs py-6" style={{ color: "#bbb" }}>No contacts with phone numbers</p>
                )}
              </div>
            </NeuroCard>

            {/* Dialer */}
            <div className="lg:col-span-2">
              <RingCentralDialer
                contactId={selectedContact?.id}
                phoneNumber={selectedContact?.phone || selectedContact?.mobile || ""}
                contactName={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : undefined}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search by phone number..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="ampvibe-input w-full"
                style={{ paddingLeft: "3rem" }}
              />
            </div>
            <NeuroSelect
              placeholder="Filter by direction"
              value={filterDirection}
              onChange={e => setFilterDirection(e.target.value)}
              options={[{ value: "Inbound", label: "Inbound" }, { value: "Outbound", label: "Outbound" }]}
            />
            <NeuroSelect
              placeholder="Filter by status"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              options={[
                { value: "Completed", label: "Completed" },
                { value: "Missed", label: "Missed" },
                { value: "Voicemail", label: "Voicemail" },
                { value: "Busy", label: "Busy" }
              ]}
            />
          </div>
        </NeuroCard>

        {/* Call Logs */}
        <NeuroCard>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Call Logs</h2>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>Loading calls...</div>
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
                    {["Date/Time", "Direction", "From/To", "Contact", "Duration", "Status", "Recording"].map(h => (
                      <th key={h} className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.map(call => (
                    <tr
                      key={call.id}
                      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                      style={{ borderColor: "#d8d8d8" }}
                      onClick={() => navigate(createPageUrl("CallDetail") + `?id=${call.id}`)}
                    >
                      <td className="py-3 px-4 text-sm" style={{ color: "#666" }}>
                        {call.call_datetime ? new Date(call.call_datetime).toLocaleString() : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${call.direction === "Inbound" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {call.direction}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: "#888" }}>
                        {call.direction === "Inbound" ? call.from_number : call.to_number}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: "#666" }}>
                        {call.contact_id ? getContactName(call.contact_id) || "-" : <span style={{ color: "#aaa" }}>Unknown</span>}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: "#888" }}>
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          call.call_status === "Completed" ? "bg-green-100 text-green-700" :
                          call.call_status === "Missed" ? "bg-red-100 text-red-700" :
                          call.call_status === "Voicemail" ? "bg-orange-100 text-orange-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {call.call_status}
                        </span>
                      </td>
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        {call.recording_url ? (
                          <div className="space-y-1">
                            <audio controls className="h-8 w-40" src={call.recording_url} />
                            <CallAIInsights call={call} onUpdated={() => { setCallsVersion(v => v + 1); refetchCalls(); }} />
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: "#ccc" }}>—</span>
                        )}
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