import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Phone, MessageSquare, Send, PhoneCall, PhoneOff, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function RingCentralDialer({ contactId, phoneNumber, contactName }) {
  const [tab, setTab] = useState("call");
  const [toNumber, setToNumber] = useState(phoneNumber || "");
  const [smsText, setSmsText] = useState("");
  const [callStatus, setCallStatus] = useState(null); // null | calling | connected | failed
  const [callError, setCallError] = useState(null);
  const [smsError, setSmsError] = useState(null);
  const [smsSending, setSmsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (contactId) loadMessages();
  }, [contactId]);

  useEffect(() => {
    if (phoneNumber) setToNumber(phoneNumber);
  }, [phoneNumber]);

  const loadMessages = async () => {
    setLoadingMessages(true);
    const msgs = await base44.entities.RC_Message.filter({ contact_id: contactId }, '-timestamp', 50).catch(() => []);
    setMessages(msgs);
    setLoadingMessages(false);
  };

  const handleCall = async () => {
    if (!toNumber) return;
    setCallStatus("calling");
    setCallError(null);
    try {
      const res = await base44.functions.invoke("ringcentral/makeCall", {
        to_number: toNumber,
        contact_id: contactId || null
      });
      if (res.data?.success) {
        setCallStatus("connected");
        setTimeout(() => setCallStatus(null), 4000);
      } else {
        const errMsg = res.data?.rc_error?.message || res.data?.error || 'Unknown error';
        const errCode = res.data?.rc_error?.errorCode || res.data?.rc_error?.code || '';
        setCallError(errCode ? `${errMsg} (${errCode})` : errMsg);
        setCallStatus("failed");
        setTimeout(() => { setCallStatus(null); setCallError(null); }, 6000);
      }
    } catch (e) {
      setCallError(e.message || 'Request failed');
      setCallStatus("failed");
      setTimeout(() => { setCallStatus(null); setCallError(null); }, 6000);
    }
  };

  const handleSendSMS = async () => {
    if (!toNumber || !smsText.trim()) return;
    setSmsSending(true);
    setSmsError(null);
    try {
      const res = await base44.functions.invoke("ringcentral/sendSMS", {
        to_number: toNumber,
        content: smsText.trim(),
        contact_id: contactId || null
      });
      if (res?.data?.success) {
        setSmsText("");
        await loadMessages();
      } else {
        const errMsg = res?.data?.rc_error?.message || res?.data?.error || 'SMS failed';
        const errCode = res?.data?.rc_error?.errorCode || res?.data?.rc_error?.code || '';
        setSmsError(errCode ? `${errMsg} (${errCode})` : errMsg);
      }
    } catch (e) {
      setSmsError(e.message || 'Request failed');
    }
    setSmsSending(false);
  };

  const callStatusConfig = {
    calling: { color: "#fa8c16", icon: <Loader2 className="w-4 h-4 animate-spin" />, label: "Ringing..." },
    connected: { color: "#52c41a", icon: <PhoneCall className="w-4 h-4" />, label: "Call initiated!" },
    failed: { color: "#ef4444", icon: <PhoneOff className="w-4 h-4" />, label: callError ? `Failed: ${callError}` : "Call failed" }
  };

  return (
    <div className="ampvibe-card">
      <button
        className="flex items-center justify-between w-full px-4 py-3"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" style={{ color: "#4a90e2" }} />
          <span className="font-semibold text-sm" style={{ color: "#444" }}>
            RingCentral {contactName ? `— ${contactName}` : ""}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" style={{ color: "#aaa" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#aaa" }} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Tabs */}
          <div className="flex gap-1">
            {["call", "sms"].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "ampvibe-button-primary" : "ampvibe-button"}`}
              >
                {t === "call" ? <><Phone className="w-3.5 h-3.5 inline mr-1" />Call</> : <><MessageSquare className="w-3.5 h-3.5 inline mr-1" />SMS</>}
              </button>
            ))}
          </div>

          {/* Phone Number Input */}
          <input
            className="ampvibe-input w-full"
            placeholder="Phone number"
            value={toNumber}
            onChange={e => setToNumber(e.target.value)}
          />

          {/* Call Tab */}
          {tab === "call" && (
            <div className="space-y-2">
              {callStatus && (
                <div className="flex items-center gap-2 p-2 rounded-lg text-sm" style={{ background: callStatusConfig[callStatus].color + "15", color: callStatusConfig[callStatus].color }}>
                  {callStatusConfig[callStatus].icon}
                  {callStatusConfig[callStatus].label}
                </div>
              )}
              <NeuroButton
                variant="primary"
                onClick={handleCall}
                disabled={!toNumber || callStatus === "calling"}
                className="w-full flex items-center justify-center gap-2"
              >
                {callStatus === "calling"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Calling...</>
                  : <><Phone className="w-4 h-4" /> Call Now</>
                }
              </NeuroButton>
            </div>
          )}

          {/* SMS Tab */}
          {tab === "sms" && (
            <div className="space-y-2">
              {/* Message History */}
              {contactId && (
                <div className="rounded-lg p-2 max-h-48 overflow-y-auto space-y-2" style={{ background: "rgba(0,0,0,0.03)" }}>
                  {loadingMessages ? (
                    <div className="text-center py-4 text-xs" style={{ color: "#aaa" }}>Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-4 text-xs" style={{ color: "#aaa" }}>No messages yet</div>
                  ) : messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div
                        className="max-w-xs px-3 py-2 rounded-xl text-sm"
                        style={{
                          background: msg.direction === "outbound" ? "linear-gradient(135deg, #00A86B, #00C87A)" : "white",
                          color: msg.direction === "outbound" ? "white" : "#333",
                          border: msg.direction === "inbound" ? "1px solid rgba(0,0,0,0.08)" : "none"
                        }}
                      >
                        <p>{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Compose */}
              <div className="flex gap-2">
                <textarea
                  className="ampvibe-input flex-1 resize-none"
                  rows={2}
                  placeholder="Type a message..."
                  value={smsText}
                  onChange={e => setSmsText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendSMS(); } }}
                />
                {smsError && (
                  <div className="text-xs p-2 rounded-lg" style={{ background: "#fff1f0", color: "#ef4444", border: "1px solid #ffa39e" }}>
                    ⚠ {smsError}
                  </div>
                )}
                <NeuroButton
                  variant="primary"
                  onClick={handleSendSMS}
                  disabled={!toNumber || !smsText.trim() || smsSending}
                >
                  {smsSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </NeuroButton>
                </div>
                </div>
          )}
        </div>
      )}
    </div>
  );
}