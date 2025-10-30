import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Play, Pause, CheckCircle, Trophy, TrendingUp, Mail, Clock, User, FileText, BarChart3, AlertCircle } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ABTesting() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const { data: tests = [] } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: () => base44.entities.AB_Test_Campaign.list('-created_date')
  });

  const { data: allVariants = [] } = useQuery({
    queryKey: ['ab-variants'],
    queryFn: () => base44.entities.AB_Test_Variant.list()
  });

  const getTestVariants = (testId) => {
    return allVariants.filter(v => v.test_id === testId);
  };

  const calculateWinner = (variants, criteria) => {
    if (!variants || variants.length === 0) return null;
    
    let maxValue = -1;
    let winner = null;

    variants.forEach(variant => {
      let value = 0;
      switch (criteria) {
        case 'Open Rate':
          value = variant.open_rate || 0;
          break;
        case 'Click Rate':
          value = variant.click_rate || 0;
          break;
        case 'Conversion Rate':
          value = variant.conversion_rate || 0;
          break;
        default:
          value = variant.open_rate || 0;
      }

      if (value > maxValue) {
        maxValue = value;
        winner = variant;
      }
    });

    return { variant: winner, value: maxValue };
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': '#9ca3af',
      'Running': '#0066cc',
      'Completed': '#52c41a',
      'Paused': '#fa8c16'
    };
    return colors[status] || '#9ca3af';
  };

  const getTestIcon = (variable) => {
    const icons = {
      'Subject Line': Mail,
      'Sender Name': User,
      'Email Content': FileText,
      'Send Time': Clock
    };
    return icons[variable] || Mail;
  };

  return (
    <div className="p-8" style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#111827" }}>A/B Testing</h1>
            <p style={{ color: "#6b7280" }}>Test and optimize your email campaigns</p>
          </div>
          <NeuroButton variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create A/B Test
          </NeuroButton>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <NeuroCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Total Tests</p>
                <p className="text-3xl font-bold" style={{ color: "#0066cc" }}>
                  {tests.length}
                </p>
              </div>
              <BarChart3 className="w-8 h-8" style={{ color: "#0066cc", opacity: 0.2 }} />
            </div>
          </NeuroCard>

          <NeuroCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Running</p>
                <p className="text-3xl font-bold" style={{ color: "#0066cc" }}>
                  {tests.filter(t => t.status === 'Running').length}
                </p>
              </div>
              <Play className="w-8 h-8" style={{ color: "#0066cc", opacity: 0.2 }} />
            </div>
          </NeuroCard>

          <NeuroCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Completed</p>
                <p className="text-3xl font-bold" style={{ color: "#52c41a" }}>
                  {tests.filter(t => t.status === 'Completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8" style={{ color: "#52c41a", opacity: 0.2 }} />
            </div>
          </NeuroCard>

          <NeuroCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Avg. Improvement</p>
                <p className="text-3xl font-bold" style={{ color: "#00a86b" }}>
                  +23%
                </p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: "#00a86b", opacity: 0.2 }} />
            </div>
          </NeuroCard>
        </div>

        {/* Tests List */}
        <div className="space-y-4">
          {tests.length === 0 ? (
            <NeuroCard className="p-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4" style={{ color: "#d1d5db" }} />
              <p className="text-lg font-medium mb-2" style={{ color: "#6b7280" }}>
                No A/B tests yet
              </p>
              <p className="text-sm mb-6" style={{ color: "#9ca3af" }}>
                Create your first test to optimize email performance
              </p>
              <NeuroButton variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Test
              </NeuroButton>
            </NeuroCard>
          ) : (
            tests.map((test) => {
              const variants = getTestVariants(test.id);
              const winner = test.status === 'Completed' ? calculateWinner(variants, test.winner_criteria) : null;
              const TestIcon = getTestIcon(test.test_variable);

              return (
                <NeuroCard key={test.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(createPageUrl("ABTestDetail") + `?id=${test.id}`)}>
                  <div className="flex items-start gap-4">
                    <div className="ampvibe-inset p-3 rounded-xl">
                      <TestIcon className="w-6 h-6" style={{ color: getStatusColor(test.status) }} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold mb-1" style={{ color: "#111827" }}>
                            {test.test_name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="px-2 py-1 rounded" style={{ 
                              background: `${getStatusColor(test.status)}22`, 
                              color: getStatusColor(test.status) 
                            }}>
                              {test.status}
                            </span>
                            <span style={{ color: "#6b7280" }}>Testing: {test.test_variable}</span>
                            <span style={{ color: "#6b7280" }}>Winner: {test.winner_criteria}</span>
                          </div>
                        </div>

                        {test.status === 'Completed' && winner && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: '#f6ffed', border: '1px solid #52c41a' }}>
                            <Trophy className="w-5 h-5" style={{ color: "#52c41a" }} />
                            <div>
                              <p className="text-xs" style={{ color: "#52c41a" }}>Winner</p>
                              <p className="font-bold" style={{ color: "#52c41a" }}>
                                {winner.variant.variant_name}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Variants Performance */}
                      {variants.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          {variants.map((variant) => (
                            <div key={variant.id} className="ampvibe-inset p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold" style={{ color: "#374151" }}>
                                  {variant.variant_name}
                                </p>
                                {variant.is_winner && (
                                  <Trophy className="w-4 h-4" style={{ color: "#52c41a" }} />
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p style={{ color: "#9ca3af" }}>Opens</p>
                                  <p className="font-medium" style={{ color: "#374151" }}>
                                    {variant.open_rate?.toFixed(1) || 0}%
                                  </p>
                                </div>
                                <div>
                                  <p style={{ color: "#9ca3af" }}>Clicks</p>
                                  <p className="font-medium" style={{ color: "#374151" }}>
                                    {variant.click_rate?.toFixed(1) || 0}%
                                  </p>
                                </div>
                                <div>
                                  <p style={{ color: "#9ca3af" }}>Sent</p>
                                  <p className="font-medium" style={{ color: "#374151" }}>
                                    {variant.sent_count || 0}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
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

      {/* Create Test Modal */}
      {showCreateModal && (
        <CreateABTestModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['ab-tests']);
          }}
        />
      )}
    </div>
  );
}

function CreateABTestModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [testData, setTestData] = useState({
    test_name: "",
    test_variable: "Subject Line",
    winner_criteria: "Open Rate",
    sample_size_percentage: 50,
    auto_select_winner: true,
    status: "Draft"
  });

  const [variants, setVariants] = useState([
    { variant_name: "Variant A", subject_line: "", sender_name: "", email_body: "", send_time: "" },
    { variant_name: "Variant B", subject_line: "", sender_name: "", email_body: "", send_time: "" }
  ]);

  const createMutation = useMutation({
    mutationFn: async () => {
      // Create test
      const test = await base44.entities.AB_Test_Campaign.create(testData);
      
      // Create variants
      await Promise.all(variants.map(v => 
        base44.entities.AB_Test_Variant.create({
          ...v,
          test_id: test.id
        })
      ));
      
      return test;
    },
    onSuccess: onSuccess
  });

  const handleCreate = () => {
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="text-2xl font-bold" style={{ color: "#111827" }}>
            Create A/B Test
          </h2>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            Step {step} of 3
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {step === 1 && (
            <div className="space-y-6">
              <NeuroInput
                label="Test Name"
                value={testData.test_name}
                onChange={(e) => setTestData({ ...testData, test_name: e.target.value })}
                placeholder="e.g., Newsletter Subject Line Test"
                required
              />

              <NeuroSelect
                label="What do you want to test?"
                value={testData.test_variable}
                onChange={(e) => setTestData({ ...testData, test_variable: e.target.value })}
                options={[
                  { value: 'Subject Line', label: 'Subject Line' },
                  { value: 'Sender Name', label: 'Sender Name' },
                  { value: 'Email Content', label: 'Email Content' },
                  { value: 'Send Time', label: 'Send Time' }
                ]}
              />

              <NeuroSelect
                label="Winner Criteria"
                value={testData.winner_criteria}
                onChange={(e) => setTestData({ ...testData, winner_criteria: e.target.value })}
                options={[
                  { value: 'Open Rate', label: 'Open Rate' },
                  { value: 'Click Rate', label: 'Click Rate' },
                  { value: 'Conversion Rate', label: 'Conversion Rate' }
                ]}
              />

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
                  Sample Size: {testData.sample_size_percentage}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={testData.sample_size_percentage}
                  onChange={(e) => setTestData({ ...testData, sample_size_percentage: parseInt(e.target.value) })}
                  className="w-full"
                  style={{ accentColor: "#0066cc" }}
                />
                <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                  Percentage of your list to include in the test
                </p>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={testData.auto_select_winner}
                  onChange={(e) => setTestData({ ...testData, auto_select_winner: e.target.checked })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "#0066cc" }}
                />
                <span className="text-sm" style={{ color: "#374151" }}>
                  Automatically select and send winning version
                </span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Configure your test variants below
              </p>

              {variants.map((variant, index) => (
                <div key={index} className="p-4 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                  <h4 className="font-bold mb-4" style={{ color: "#374151" }}>
                    {variant.variant_name}
                  </h4>

                  {testData.test_variable === 'Subject Line' && (
                    <NeuroInput
                      label="Subject Line"
                      value={variant.subject_line}
                      onChange={(e) => {
                        const newVariants = [...variants];
                        newVariants[index].subject_line = e.target.value;
                        setVariants(newVariants);
                      }}
                      placeholder="Enter subject line..."
                    />
                  )}

                  {testData.test_variable === 'Sender Name' && (
                    <NeuroInput
                      label="Sender Name"
                      value={variant.sender_name}
                      onChange={(e) => {
                        const newVariants = [...variants];
                        newVariants[index].sender_name = e.target.value;
                        setVariants(newVariants);
                      }}
                      placeholder="Enter sender name..."
                    />
                  )}

                  {testData.test_variable === 'Email Content' && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
                        Email Content
                      </label>
                      <textarea
                        value={variant.email_body}
                        onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[index].email_body = e.target.value;
                          setVariants(newVariants);
                        }}
                        className="ampvibe-input w-full h-32"
                        placeholder="Enter email content..."
                      />
                    </div>
                  )}

                  {testData.test_variable === 'Send Time' && (
                    <NeuroInput
                      label="Send Time"
                      type="datetime-local"
                      value={variant.send_time ? new Date(variant.send_time).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const newVariants = [...variants];
                        newVariants[index].send_time = e.target.value;
                        setVariants(newVariants);
                      }}
                    />
                  )}
                </div>
              ))}

              <NeuroButton onClick={() => setVariants([...variants, { 
                variant_name: `Variant ${String.fromCharCode(65 + variants.length)}`, 
                subject_line: "", 
                sender_name: "", 
                email_body: "", 
                send_time: "" 
              }])}>
                <Plus className="w-4 h-4 mr-2" />
                Add Variant
              </NeuroButton>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-bold mb-2" style={{ color: "#0066cc" }}>Test Summary</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Test Name:</strong> {testData.test_name}</p>
                  <p><strong>Testing:</strong> {testData.test_variable}</p>
                  <p><strong>Winner Criteria:</strong> {testData.winner_criteria}</p>
                  <p><strong>Variants:</strong> {variants.length}</p>
                  <p><strong>Sample Size:</strong> {testData.sample_size_percentage}%</p>
                  <p><strong>Auto-select Winner:</strong> {testData.auto_select_winner ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: "#f59e0b" }} />
                <div className="text-sm" style={{ color: "#92400e" }}>
                  <p className="font-medium mb-1">Before you start:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Ensure you have enough recipients for statistically significant results</li>
                    <li>Let the test run for at least 24-48 hours</li>
                    <li>Avoid making changes to variants during the test</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between" style={{ borderColor: "#e5e7eb" }}>
          <NeuroButton onClick={onClose}>
            Cancel
          </NeuroButton>
          <div className="flex gap-2">
            {step > 1 && (
              <NeuroButton onClick={() => setStep(step - 1)}>
                Back
              </NeuroButton>
            )}
            {step < 3 ? (
              <NeuroButton variant="primary" onClick={() => setStep(step + 1)}>
                Next
              </NeuroButton>
            ) : (
              <NeuroButton variant="primary" onClick={handleCreate} disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Creating...' : 'Create Test'}
              </NeuroButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}