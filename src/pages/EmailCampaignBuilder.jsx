import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Send, Sparkles, Wand2, RefreshCw, Copy, Target, Mail, Users, Calendar, TestTube2 } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function EmailCampaignBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [campaignId, setCampaignId] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiTask, setAiTask] = useState('generate'); // generate, suggest, rewrite, abtest
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const [campaignData, setCampaignData] = useState({
    campaign_name: "",
    subject_line: "",
    email_body: "",
    from_name: "",
    from_email: "",
    reply_to_email: "",
    campaign_type: "One-Time Blast",
    status: "Draft",
    contact_list_id: ""
  });

  const [aiPrompt, setAiPrompt] = useState({
    segment: "All Contacts",
    goal: "Increase Engagement",
    tone: "Professional",
    contentToRewrite: ""
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setCampaignId(id);
    }
  }, []);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const campaigns = await base44.entities.Email_Campaign.filter({ id: campaignId });
      if (campaigns[0]) {
        setCampaignData(campaigns[0]);
      }
      return campaigns[0];
    },
    enabled: !!campaignId
  });

  const { data: lists = [] } = useQuery({
    queryKey: ['contact-lists'],
    queryFn: () => base44.entities.Contact_List.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (campaignId) {
        return base44.entities.Email_Campaign.update(campaignId, data);
      }
      return base44.entities.Email_Campaign.create(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['campaigns']);
      if (!campaignId) {
        setCampaignId(data.id);
      }
      alert('Campaign saved successfully!');
    }
  });

  // AI Content Generation
  const generateAIContent = async () => {
    setAiLoading(true);
    setAiResult(null);

    try {
      let prompt = '';
      let schema = {};

      if (aiTask === 'generate') {
        prompt = `Generate a personalized email campaign content for:
        
Segment: ${aiPrompt.segment}
Campaign Goal: ${aiPrompt.goal}
Tone: ${aiPrompt.tone}
Company: AmplifyCRM

Create an engaging email body that:
1. Addresses the target segment naturally
2. Aligns with the campaign goal
3. Uses the specified tone
4. Includes a clear call-to-action
5. Is 150-250 words

Format as JSON with:
- email_body: The full HTML email content
- cta_text: The call-to-action button text
- recommendations: 3 tips to improve the email`;

        schema = {
          type: "object",
          properties: {
            email_body: { type: "string" },
            cta_text: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        };
      } else if (aiTask === 'suggest') {
        prompt = `Generate 5 engaging subject line variations for an email campaign with:
        
Goal: ${aiPrompt.goal}
Tone: ${aiPrompt.tone}
Target Segment: ${aiPrompt.segment}

Create subject lines that:
1. Are attention-grabbing but not spammy
2. Match the tone
3. Encourage opens
4. Are 40-60 characters
5. Use power words when appropriate

Format as JSON with:
- subject_lines: Array of 5 subject line objects, each with:
  - text: The subject line
  - reason: Why this would work (1 sentence)
  - estimated_open_rate: Percentage (25-45)`;

        schema = {
          type: "object",
          properties: {
            subject_lines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  reason: { type: "string" },
                  estimated_open_rate: { type: "number" }
                }
              }
            }
          }
        };
      } else if (aiTask === 'rewrite') {
        prompt = `Rewrite this email content to improve clarity and ${aiPrompt.tone.toLowerCase()} tone:

Original Content:
${aiPrompt.contentToRewrite}

Requirements:
1. Maintain the core message
2. Use ${aiPrompt.tone.toLowerCase()} tone
3. Improve clarity and readability
4. Fix any grammar or style issues
5. Make it more engaging

Format as JSON with:
- rewritten_content: The improved email content
- changes_made: Array of 3-5 specific improvements
- readability_score: Score out of 100`;

        schema = {
          type: "object",
          properties: {
            rewritten_content: { type: "string" },
            changes_made: { type: "array", items: { type: "string" } },
            readability_score: { type: "number" }
          }
        };
      } else if (aiTask === 'abtest') {
        prompt = `Generate 3 distinct variations of email content for A/B testing:

Base Content: ${campaignData.email_body || 'Professional email about our CRM platform'}
Goal: ${aiPrompt.goal}
Segment: ${aiPrompt.segment}

Create 3 variations that test:
1. Variation A: Different value proposition emphasis
2. Variation B: Different emotional appeal
3. Variation C: Different call-to-action approach

Format as JSON with:
- variations: Array of 3 objects, each with:
  - name: Variation name (A, B, C)
  - content: The full email content
  - test_hypothesis: What this tests (1 sentence)
  - expected_winner: Why this might win (1 sentence)`;

        schema = {
          type: "object",
          properties: {
            variations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  content: { type: "string" },
                  test_hypothesis: { type: "string" },
                  expected_winner: { type: "string" }
                }
              }
            }
          }
        };
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema
      });

      setAiResult(result);
    } catch (error) {
      alert('Failed to generate AI content: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIContent = (content) => {
    if (aiTask === 'generate') {
      setCampaignData({ ...campaignData, email_body: content });
      setShowAIAssistant(false);
    } else if (aiTask === 'suggest') {
      setCampaignData({ ...campaignData, subject_line: content });
      setShowAIAssistant(false);
    } else if (aiTask === 'rewrite') {
      setCampaignData({ ...campaignData, email_body: content });
      setShowAIAssistant(false);
    } else if (aiTask === 'abtest') {
      // For A/B test, we'd create multiple campaigns
      setShowAIAssistant(false);
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f5f7fa' }}>
      {/* Top Bar */}
      <div className="bg-white border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(createPageUrl("Campaigns"))} className="ampvibe-button p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#111827" }}>
                {campaignId ? 'Edit Campaign' : 'Create Campaign'}
              </h1>
              <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                {campaignData.campaign_name || 'New Email Campaign'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NeuroButton onClick={() => setShowAIAssistant(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Assistant
            </NeuroButton>
            <NeuroButton onClick={() => saveMutation.mutate(campaignData)}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </NeuroButton>
            <NeuroButton variant="primary" onClick={() => saveMutation.mutate({ ...campaignData, status: 'Scheduled' })}>
              <Send className="w-4 h-4 mr-2" />
              Schedule
            </NeuroButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 border-t" style={{ borderColor: "#e5e7eb" }}>
          {['details', 'content', 'recipients'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <NeuroCard className="p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Campaign Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <NeuroInput
                    label="Campaign Name"
                    value={campaignData.campaign_name}
                    onChange={(e) => setCampaignData({ ...campaignData, campaign_name: e.target.value })}
                    placeholder="e.g., Monthly Newsletter"
                    required
                  />
                  <NeuroSelect
                    label="Campaign Type"
                    value={campaignData.campaign_type}
                    onChange={(e) => setCampaignData({ ...campaignData, campaign_type: e.target.value })}
                    options={[
                      { value: 'One-Time Blast', label: 'One-Time Blast' },
                      { value: 'Sequence', label: 'Sequence' },
                      { value: 'A/B Test', label: 'A/B Test' }
                    ]}
                  />
                </div>
              </NeuroCard>

              <NeuroCard className="p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Sender Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <NeuroInput
                    label="From Name"
                    value={campaignData.from_name}
                    onChange={(e) => setCampaignData({ ...campaignData, from_name: e.target.value })}
                    placeholder="Your Company"
                  />
                  <NeuroInput
                    label="From Email"
                    type="email"
                    value={campaignData.from_email}
                    onChange={(e) => setCampaignData({ ...campaignData, from_email: e.target.value })}
                    placeholder="hello@company.com"
                  />
                  <NeuroInput
                    label="Reply-To Email"
                    type="email"
                    value={campaignData.reply_to_email}
                    onChange={(e) => setCampaignData({ ...campaignData, reply_to_email: e.target.value })}
                    placeholder="support@company.com"
                  />
                </div>
              </NeuroCard>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <NeuroCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold" style={{ color: "#111827" }}>Subject Line</h3>
                  <NeuroButton size="sm" onClick={() => { setAiTask('suggest'); setShowAIAssistant(true); }}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    AI Suggestions
                  </NeuroButton>
                </div>
                <NeuroInput
                  value={campaignData.subject_line}
                  onChange={(e) => setCampaignData({ ...campaignData, subject_line: e.target.value })}
                  placeholder="Enter your email subject line..."
                />
              </NeuroCard>

              <NeuroCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold" style={{ color: "#111827" }}>Email Content</h3>
                  <div className="flex gap-2">
                    <NeuroButton size="sm" onClick={() => { setAiTask('generate'); setShowAIAssistant(true); }}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </NeuroButton>
                    <NeuroButton size="sm" onClick={() => { setAiTask('rewrite'); setAiPrompt({ ...aiPrompt, contentToRewrite: campaignData.email_body }); setShowAIAssistant(true); }}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Rewrite
                    </NeuroButton>
                    <NeuroButton size="sm" onClick={() => { setAiTask('abtest'); setShowAIAssistant(true); }}>
                      <TestTube2 className="w-4 h-4 mr-2" />
                      A/B Variants
                    </NeuroButton>
                  </div>
                </div>
                <ReactQuill
                  value={campaignData.email_body}
                  onChange={(value) => setCampaignData({ ...campaignData, email_body: value })}
                  className="h-96 mb-12"
                  theme="snow"
                />
              </NeuroCard>
            </div>
          )}

          {activeTab === 'recipients' && (
            <NeuroCard className="p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: "#111827" }}>Select Recipients</h3>
              <NeuroSelect
                label="Contact List"
                value={campaignData.contact_list_id}
                onChange={(e) => setCampaignData({ ...campaignData, contact_list_id: e.target.value })}
                options={lists.map(l => ({ value: l.id, label: `${l.list_name} (${l.total_contacts || 0} contacts)` }))}
              />
            </NeuroCard>
          )}
        </div>
      </div>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="ampvibe-inset p-2 rounded-lg">
                    <Sparkles className="w-6 h-6" style={{ color: "#722ed1" }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "#111827" }}>AI Email Assistant</h2>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      {aiTask === 'generate' && 'Generate personalized email content'}
                      {aiTask === 'suggest' && 'Get subject line suggestions'}
                      {aiTask === 'rewrite' && 'Improve your email content'}
                      {aiTask === 'abtest' && 'Generate A/B test variations'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowAIAssistant(false)} className="ampvibe-button p-2">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Task Selector */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[
                  { id: 'generate', label: 'Generate Content', icon: Sparkles },
                  { id: 'suggest', label: 'Subject Lines', icon: Mail },
                  { id: 'rewrite', label: 'Rewrite', icon: RefreshCw },
                  { id: 'abtest', label: 'A/B Variants', icon: TestTube2 }
                ].map((task) => (
                  <button
                    key={task.id}
                    onClick={() => { setAiTask(task.id); setAiResult(null); }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      aiTask === task.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <task.icon className="w-5 h-5 mx-auto mb-1" style={{ color: aiTask === task.id ? "#722ed1" : "#9ca3af" }} />
                    <p className="text-xs font-medium" style={{ color: "#374151" }}>{task.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
              {/* Configuration */}
              <div className="space-y-4 mb-6">
                {aiTask !== 'rewrite' && (
                  <>
                    <NeuroSelect
                      label="Target Segment"
                      value={aiPrompt.segment}
                      onChange={(e) => setAiPrompt({ ...aiPrompt, segment: e.target.value })}
                      options={[
                        { value: 'All Contacts', label: 'All Contacts' },
                        { value: 'New Leads', label: 'New Leads' },
                        { value: 'Active Customers', label: 'Active Customers' },
                        { value: 'Churned Customers', label: 'Churned Customers' },
                        { value: 'High-Value Prospects', label: 'High-Value Prospects' }
                      ]}
                    />
                    <NeuroSelect
                      label="Campaign Goal"
                      value={aiPrompt.goal}
                      onChange={(e) => setAiPrompt({ ...aiPrompt, goal: e.target.value })}
                      options={[
                        { value: 'Increase Engagement', label: 'Increase Engagement' },
                        { value: 'Drive Sales', label: 'Drive Sales' },
                        { value: 'Nurture Leads', label: 'Nurture Leads' },
                        { value: 'Announce Product', label: 'Announce Product' },
                        { value: 'Request Feedback', label: 'Request Feedback' },
                        { value: 'Re-engage Inactive', label: 'Re-engage Inactive' }
                      ]}
                    />
                  </>
                )}
                <NeuroSelect
                  label="Tone"
                  value={aiPrompt.tone}
                  onChange={(e) => setAiPrompt({ ...aiPrompt, tone: e.target.value })}
                  options={[
                    { value: 'Professional', label: 'Professional' },
                    { value: 'Friendly', label: 'Friendly' },
                    { value: 'Casual', label: 'Casual' },
                    { value: 'Formal', label: 'Formal' },
                    { value: 'Enthusiastic', label: 'Enthusiastic' },
                    { value: 'Urgent', label: 'Urgent' }
                  ]}
                />
              </div>

              {/* Generate Button */}
              <NeuroButton
                variant="primary"
                onClick={generateAIContent}
                disabled={aiLoading}
                className="w-full mb-6"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </NeuroButton>

              {/* Results */}
              {aiResult && (
                <div className="space-y-4">
                  {/* Generate Results */}
                  {aiTask === 'generate' && (
                    <>
                      <div className="p-4 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold" style={{ color: "#111827" }}>Generated Content</h4>
                          <NeuroButton size="sm" onClick={() => applyAIContent(aiResult.email_body)}>
                            <Copy className="w-4 h-4 mr-1" />
                            Use This
                          </NeuroButton>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: aiResult.email_body }} className="prose max-w-none" />
                      </div>

                      {aiResult.cta_text && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium mb-1" style={{ color: "#0066cc" }}>Suggested CTA:</p>
                          <p className="font-bold" style={{ color: "#111827" }}>{aiResult.cta_text}</p>
                        </div>
                      )}

                      {aiResult.recommendations && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-sm font-bold mb-2" style={{ color: "#722ed1" }}>Recommendations:</p>
                          <ul className="space-y-1 text-sm">
                            {aiResult.recommendations.map((rec, idx) => (
                              <li key={idx} style={{ color: "#374151" }}>• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  {/* Subject Line Suggestions */}
                  {aiTask === 'suggest' && aiResult.subject_lines && (
                    <div className="space-y-3">
                      {aiResult.subject_lines.map((line, idx) => (
                        <div key={idx} className="p-4 border rounded-lg hover:border-purple-300 transition-colors" style={{ borderColor: "#e5e7eb" }}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-bold mb-1" style={{ color: "#111827" }}>{line.text}</p>
                              <p className="text-sm mb-2" style={{ color: "#6b7280" }}>{line.reason}</p>
                              <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#e6f7ff', color: "#0066cc" }}>
                                Est. Open Rate: {line.estimated_open_rate}%
                              </span>
                            </div>
                            <NeuroButton size="sm" onClick={() => applyAIContent(line.text)}>
                              Use
                            </NeuroButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rewrite Results */}
                  {aiTask === 'rewrite' && (
                    <>
                      <div className="p-4 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold" style={{ color: "#111827" }}>Improved Version</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm px-3 py-1 rounded-full" style={{ background: '#f6ffed', color: "#52c41a" }}>
                              Readability: {aiResult.readability_score}/100
                            </span>
                            <NeuroButton size="sm" onClick={() => applyAIContent(aiResult.rewritten_content)}>
                              <Copy className="w-4 h-4 mr-1" />
                              Use This
                            </NeuroButton>
                          </div>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: aiResult.rewritten_content }} className="prose max-w-none" />
                      </div>

                      {aiResult.changes_made && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-bold mb-2" style={{ color: "#52c41a" }}>Changes Made:</p>
                          <ul className="space-y-1 text-sm">
                            {aiResult.changes_made.map((change, idx) => (
                              <li key={idx} style={{ color: "#374151" }}>✓ {change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  {/* A/B Test Variations */}
                  {aiTask === 'abtest' && aiResult.variations && (
                    <div className="space-y-4">
                      {aiResult.variations.map((variation, idx) => (
                        <div key={idx} className="p-4 border-2 rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold" style={{ color: "#111827" }}>Variation {variation.name}</h4>
                            <NeuroButton size="sm" onClick={() => applyAIContent(variation.content)}>
                              Use
                            </NeuroButton>
                          </div>
                          <div dangerouslySetInnerHTML={{ __html: variation.content }} className="prose max-w-none mb-3" />
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-2 bg-blue-50 rounded">
                              <p className="font-medium mb-1" style={{ color: "#0066cc" }}>Tests:</p>
                              <p style={{ color: "#374151" }}>{variation.test_hypothesis}</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded">
                              <p className="font-medium mb-1" style={{ color: "#52c41a" }}>Why It Might Win:</p>
                              <p style={{ color: "#374151" }}>{variation.expected_winner}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}