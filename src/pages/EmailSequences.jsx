import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Sparkles, Play, Pause, Edit2, Trash2, Clock, Users, Mail, TrendingUp, Zap, Calendar, Target, ArrowRight, RefreshCw } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function EmailSequences() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: sequences = [] } = useQuery({
    queryKey: ['sequences'],
    queryFn: () => base44.entities.Email_Sequence.list('-created_date')
  });

  const { data: sequenceEmails = [] } = useQuery({
    queryKey: ['sequence-emails'],
    queryFn: () => base44.entities.Sequence_Email.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Email_Sequence.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sequences']);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.Email_Sequence.update(id, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['sequences']);
    }
  });

  const getSequenceEmails = (sequenceId) => {
    return sequenceEmails.filter(e => e.sequence_id === sequenceId).sort((a, b) => a.step_number - b.step_number);
  };

  return (
    <div className="p-8" style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#111827" }}>Email Sequences</h1>
            <p style={{ color: "#6b7280" }}>Automate multi-touch email campaigns</p>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={() => setShowAIModal(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Sequence Builder
            </NeuroButton>
            <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("SequenceBuilder"))}>
              <Plus className="w-4 h-4 mr-2" />
              Create Sequence
            </NeuroButton>
          </div>
        </div>

        {/* Sequences List */}
        <div className="space-y-4">
          {sequences.length === 0 ? (
            <NeuroCard className="p-12 text-center">
              <Mail className="w-16 h-16 mx-auto mb-4" style={{ color: "#d1d5db" }} />
              <p className="text-lg font-medium mb-2" style={{ color: "#6b7280" }}>
                No email sequences yet
              </p>
              <p className="text-sm mb-6" style={{ color: "#9ca3af" }}>
                Create automated email sequences to nurture leads
              </p>
              <div className="flex gap-3 justify-center">
                <NeuroButton onClick={() => setShowAIModal(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Use AI Builder
                </NeuroButton>
                <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("SequenceBuilder"))}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Manually
                </NeuroButton>
              </div>
            </NeuroCard>
          ) : (
            sequences.map((sequence) => {
              const emails = getSequenceEmails(sequence.id);
              return (
                <NeuroCard key={sequence.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="ampvibe-inset p-3 rounded-xl">
                      <Mail className="w-6 h-6" style={{ color: sequence.is_active ? "#52c41a" : "#9ca3af" }} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold mb-1" style={{ color: "#111827" }}>
                            {sequence.sequence_name}
                          </h3>
                          {sequence.description && (
                            <p className="text-sm mb-2" style={{ color: "#6b7280" }}>
                              {sequence.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-sm">
                            <span className={`px-2 py-1 rounded ${sequence.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {sequence.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-gray-600">{emails.length} emails</span>
                            <span className="text-gray-600">{sequence.enrollment_trigger}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleActiveMutation.mutate({ id: sequence.id, isActive: sequence.is_active })}
                            className="ampvibe-button p-2"
                          >
                            {sequence.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => navigate(createPageUrl("SequenceBuilder") + `?id=${sequence.id}`)}
                            className="ampvibe-button p-2"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(sequence.id)}
                            className="ampvibe-button p-2 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Email Steps */}
                      {emails.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {emails.slice(0, 3).map((email, idx) => (
                            <div key={email.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border" style={{ borderColor: "#e5e7eb" }}>
                              <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: "#e6f7ff", color: "#0066cc" }}>
                                {email.step_number}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium" style={{ color: "#374151" }}>{email.subject_line}</p>
                                <p className="text-xs" style={{ color: "#9ca3af" }}>
                                  Send after {email.delay_days || 0}d {email.delay_hours || 0}h
                                </p>
                              </div>
                              <ArrowRight className="w-4 h-4" style={{ color: "#9ca3af" }} />
                            </div>
                          ))}
                          {emails.length > 3 && (
                            <p className="text-xs text-center" style={{ color: "#9ca3af" }}>
                              +{emails.length - 3} more emails
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </NeuroCard>
              );
            })
          )}
        </div>
      </div>

      {/* AI Sequence Builder Modal */}
      {showAIModal && (
        <AISequenceBuilder
          onClose={() => setShowAIModal(false)}
          onSuccess={() => {
            setShowAIModal(false);
            queryClient.invalidateQueries(['sequences']);
          }}
        />
      )}
    </div>
  );
}

function AISequenceBuilder({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedSequence, setGeneratedSequence] = useState(null);

  const [config, setConfig] = useState({
    goal: "Lead Nurturing",
    segment: "New Leads",
    tone: "Professional",
    sequence_length: "5",
    personalization_level: "Medium"
  });

  const generateSequence = async () => {
    setAiLoading(true);
    try {
      const prompt = `Generate a comprehensive multi-step email sequence for:

Goal: ${config.goal}
Target Segment: ${config.segment}
Tone: ${config.tone}
Number of Emails: ${config.sequence_length}
Personalization: ${config.personalization_level}

Create an effective email sequence that:
1. Addresses the target segment appropriately
2. Aligns with the campaign goal
3. Uses the specified tone consistently
4. Includes engaging subject lines
5. Has logical progression and timing
6. Incorporates personalization tokens
7. Includes clear CTAs for each email

For each email in the sequence, provide:
- step_number: Sequential number (1, 2, 3...)
- subject_line: Engaging subject (40-60 chars)
- email_content: Full email body (150-200 words)
- delay_days: Days to wait after previous email (0 for first)
- delay_hours: Additional hours delay
- send_timing: Best time to send (e.g., "Morning", "Afternoon")
- engagement_trigger: What engagement signals to look for
- personalization_tips: How to personalize this email

Also provide:
- sequence_name: Name for this sequence
- sequence_description: Brief description
- overall_strategy: High-level strategy explanation
- optimization_tips: 3 tips to improve performance

Format as JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            sequence_name: { type: "string" },
            sequence_description: { type: "string" },
            overall_strategy: { type: "string" },
            optimization_tips: { type: "array", items: { type: "string" } },
            emails: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step_number: { type: "number" },
                  subject_line: { type: "string" },
                  email_content: { type: "string" },
                  delay_days: { type: "number" },
                  delay_hours: { type: "number" },
                  send_timing: { type: "string" },
                  engagement_trigger: { type: "string" },
                  personalization_tips: { type: "string" }
                }
              }
            }
          }
        }
      });

      setGeneratedSequence(result);
      setStep(2);
    } catch (error) {
      alert('Failed to generate sequence: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const createSequence = async () => {
    try {
      // Create the sequence
      const sequence = await base44.entities.Email_Sequence.create({
        sequence_name: generatedSequence.sequence_name,
        description: generatedSequence.sequence_description,
        enrollment_trigger: "Manual",
        is_active: false
      });

      // Create sequence emails
      await Promise.all(generatedSequence.emails.map(email =>
        base44.entities.Sequence_Email.create({
          sequence_id: sequence.id,
          step_number: email.step_number,
          delay_days: email.delay_days || 0,
          delay_hours: email.delay_hours || 0,
          subject_line: email.subject_line,
          email_body: email.email_content
        })
      ));

      onSuccess();
    } catch (error) {
      alert('Failed to create sequence: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center gap-3">
            <div className="ampvibe-inset p-2 rounded-lg">
              <Sparkles className="w-6 h-6" style={{ color: "#722ed1" }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#111827" }}>AI Sequence Builder</h2>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                {step === 1 ? 'Configure your sequence' : 'Review and customize'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {step === 1 && (
            <div className="space-y-6">
              <NeuroSelect
                label="Campaign Goal"
                value={config.goal}
                onChange={(e) => setConfig({ ...config, goal: e.target.value })}
                options={[
                  { value: 'Lead Nurturing', label: 'Lead Nurturing' },
                  { value: 'Customer Onboarding', label: 'Customer Onboarding' },
                  { value: 'Re-engagement', label: 'Re-engagement' },
                  { value: 'Upsell/Cross-sell', label: 'Upsell/Cross-sell' },
                  { value: 'Event Promotion', label: 'Event Promotion' },
                  { value: 'Educational Series', label: 'Educational Series' }
                ]}
              />

              <NeuroSelect
                label="Target Segment"
                value={config.segment}
                onChange={(e) => setConfig({ ...config, segment: e.target.value })}
                options={[
                  { value: 'New Leads', label: 'New Leads' },
                  { value: 'Trial Users', label: 'Trial Users' },
                  { value: 'Active Customers', label: 'Active Customers' },
                  { value: 'Inactive Customers', label: 'Inactive Customers' },
                  { value: 'High-Value Prospects', label: 'High-Value Prospects' }
                ]}
              />

              <NeuroSelect
                label="Tone"
                value={config.tone}
                onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                options={[
                  { value: 'Professional', label: 'Professional' },
                  { value: 'Friendly', label: 'Friendly' },
                  { value: 'Casual', label: 'Casual' },
                  { value: 'Enthusiastic', label: 'Enthusiastic' }
                ]}
              />

              <NeuroSelect
                label="Sequence Length"
                value={config.sequence_length}
                onChange={(e) => setConfig({ ...config, sequence_length: e.target.value })}
                options={[
                  { value: '3', label: '3 emails (Short)' },
                  { value: '5', label: '5 emails (Medium)' },
                  { value: '7', label: '7 emails (Long)' }
                ]}
              />

              <NeuroSelect
                label="Personalization Level"
                value={config.personalization_level}
                onChange={(e) => setConfig({ ...config, personalization_level: e.target.value })}
                options={[
                  { value: 'Low', label: 'Low - Basic name personalization' },
                  { value: 'Medium', label: 'Medium - Include company & role' },
                  { value: 'High', label: 'High - Full behavioral personalization' }
                ]}
              />
            </div>
          )}

          {step === 2 && generatedSequence && (
            <div className="space-y-6">
              {/* Sequence Overview */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-bold mb-2" style={{ color: "#722ed1" }}>
                  {generatedSequence.sequence_name}
                </h3>
                <p className="text-sm mb-3" style={{ color: "#374151" }}>
                  {generatedSequence.sequence_description}
                </p>
                <p className="text-sm font-medium mb-2" style={{ color: "#722ed1" }}>Strategy:</p>
                <p className="text-sm" style={{ color: "#374151" }}>{generatedSequence.overall_strategy}</p>
              </div>

              {/* Email Steps */}
              <div className="space-y-4">
                <h4 className="font-bold" style={{ color: "#111827" }}>Email Sequence:</h4>
                {generatedSequence.emails.map((email, idx) => (
                  <div key={idx} className="p-4 border-2 rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold" style={{ background: "#e6f7ff", color: "#0066cc" }}>
                        {email.step_number}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold mb-1" style={{ color: "#111827" }}>{email.subject_line}</p>
                        <div className="flex items-center gap-3 text-xs" style={{ color: "#9ca3af" }}>
                          <span>📅 Send after: {email.delay_days}d {email.delay_hours}h</span>
                          <span>⏰ Best time: {email.send_timing}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded mb-3">
                      <p className="text-sm whitespace-pre-line" style={{ color: "#374151" }}>
                        {email.email_content}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="font-medium mb-1" style={{ color: "#0066cc" }}>Engagement Trigger:</p>
                        <p style={{ color: "#374151" }}>{email.engagement_trigger}</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <p className="font-medium mb-1" style={{ color: "#52c41a" }}>Personalization:</p>
                        <p style={{ color: "#374151" }}>{email.personalization_tips}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Optimization Tips */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-bold mb-2" style={{ color: "#52c41a" }}>Optimization Tips:</p>
                <ul className="space-y-1 text-sm">
                  {generatedSequence.optimization_tips.map((tip, idx) => (
                    <li key={idx} style={{ color: "#374151" }}>✓ {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between" style={{ borderColor: "#e5e7eb" }}>
          <NeuroButton onClick={onClose}>
            Cancel
          </NeuroButton>
          {step === 1 ? (
            <NeuroButton variant="primary" onClick={generateSequence} disabled={aiLoading}>
              {aiLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Sequence
                </>
              )}
            </NeuroButton>
          ) : (
            <NeuroButton variant="primary" onClick={createSequence}>
              Create Sequence
            </NeuroButton>
          )}
        </div>
      </div>
    </div>
  );
}