import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Phone, Play, FileText, UserPlus } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function CallDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [callId, setCallId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setCallId(urlParams.get('id'));
  }, []);

  const { data: call, isLoading } = useQuery({
    queryKey: ['call', callId],
    queryFn: () => base44.entities.RingCentral_Call.filter({ id: callId }),
    enabled: !!callId,
    select: (data) => data[0]
  });

  const { data: contact } = useQuery({
    queryKey: ['contact', call?.contact_id],
    queryFn: () => base44.entities.Contact.filter({ id: call.contact_id }),
    enabled: !!call?.contact_id,
    select: (data) => data[0]
  });

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      alert('Activity created successfully');
    }
  });

  const handleCreateActivity = () => {
    if (!call) return;

    const activityData = {
      activity_type: 'Call',
      subject: `${call.direction} call ${call.direction === 'Inbound' ? 'from' : 'to'} ${call.direction === 'Inbound' ? call.from_number : call.to_number}`,
      description: `Duration: ${Math.floor(call.duration_seconds / 60)}:${(call.duration_seconds % 60).toString().padStart(2, '0')}\nStatus: ${call.call_status}`,
      activity_date: call.call_datetime,
      duration_minutes: Math.ceil(call.duration_seconds / 60),
      status: 'Completed',
      contact_id: call.contact_id
    };

    createActivityMutation.mutate(activityData);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Call not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeuroButton onClick={() => navigate(createPageUrl("RingCentral"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                Call Details
              </h1>
              <p style={{ color: "#888" }}>
                {new Date(call.call_datetime).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={handleCreateActivity}>
              <FileText className="w-4 h-4 mr-2" />
              Create Activity
            </NeuroButton>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <NeuroCard>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                Call Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Call ID</p>
                  <p style={{ color: "#666" }}>{call.call_id}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Direction</p>
                  <span className={`neuro-button px-2 py-1 text-sm ${
                    call.direction === 'Inbound' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {call.direction}
                  </span>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>From Number</p>
                  <p style={{ color: "#666" }}>{call.from_number}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>To Number</p>
                  <p style={{ color: "#666" }}>{call.to_number}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Duration</p>
                  <p className="font-bold" style={{ color: "#666" }}>
                    {formatDuration(call.duration_seconds)}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Status</p>
                  <span className={`neuro-button px-2 py-1 text-sm ${
                    call.call_status === 'Completed' ? 'text-green-600' :
                    call.call_status === 'Missed' ? 'text-red-600' :
                    call.call_status === 'Voicemail' ? 'text-orange-600' : ''
                  }`}>
                    {call.call_status}
                  </span>
                </div>
              </div>
            </NeuroCard>

            {call.recording_url && (
              <NeuroCard>
                <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                  Recording
                </h2>
                <div className="neuro-inset p-4 rounded-lg">
                  <audio controls className="w-full">
                    <source src={call.recording_url} type="audio/mpeg" />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              </NeuroCard>
            )}

            {call.transcript && (
              <NeuroCard>
                <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                  Transcript
                  {call.transcript_status && (
                    <span className={`ml-2 neuro-button px-2 py-1 text-xs ${
                      call.transcript_status === 'Completed' ? 'text-green-600' :
                      call.transcript_status === 'Processing' ? 'text-blue-600' :
                      'text-red-600'
                    }`}>
                      {call.transcript_status}
                    </span>
                  )}
                </h2>
                <div className="neuro-inset p-4 rounded-lg">
                  <p className="whitespace-pre-wrap" style={{ color: "#666" }}>
                    {call.transcript}
                  </p>
                </div>
              </NeuroCard>
            )}
          </div>

          <div className="space-y-6">
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>Associated Contact</h3>
              {contact ? (
                <div
                  onClick={() => navigate(createPageUrl("ContactDetail") + `?id=${contact.id}`)}
                  className="neuro-inset p-4 rounded-lg cursor-pointer"
                >
                  <p className="font-bold mb-1" style={{ color: "#666" }}>
                    {contact.first_name} {contact.last_name}
                  </p>
                  <p className="text-sm" style={{ color: "#888" }}>{contact.email}</p>
                  <p className="text-sm" style={{ color: "#888" }}>{contact.phone}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="mb-4" style={{ color: "#aaa" }}>No contact linked</p>
                  <NeuroButton>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Contact
                  </NeuroButton>
                </div>
              )}
            </NeuroCard>
          </div>
        </div>
      </div>
    </div>
  );
}