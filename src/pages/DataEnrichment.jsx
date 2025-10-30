import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Settings, Play, Check, X, TrendingUp, Users, Building2, Zap, RefreshCw, Calendar } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function DataEnrichment() {
  const queryClient = useQueryClient();
  const [enriching, setEnriching] = useState(false);
  const [enrichmentSettings, setEnrichmentSettings] = useState({
    auto_enrich_contacts: true,
    auto_enrich_companies: true,
    enrich_on_create: true,
    enrich_on_update: false,
    confidence_threshold: 70,
    fields_to_enrich: {
      job_title: true,
      industry: true,
      company_size: true,
      linkedin_url: true,
      twitter_handle: true,
      phone_verification: false
    }
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-enrichment'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: enrichmentLogs = [] } = useQuery({
    queryKey: ['enrichment-logs'],
    queryFn: async () => {
      const logs = await base44.entities.Custom_Object_Records.list();
      return logs.filter(l => l.record_data?.source === 'AI Enrichment');
    }
  });

  // Count contacts that could be enriched
  const enrichableContacts = contacts.filter(c => 
    !c.custom_data?.enrichment?.enriched_at &&
    (c.email || c.company_id)
  );

  const enrichedContacts = contacts.filter(c => 
    c.custom_data?.enrichment?.enriched_at
  );

  const enrichContactMutation = useMutation({
    mutationFn: async (contactId) => {
      const contact = contacts.find(c => c.id === contactId);
      const response = await base44.functions.invoke('enrichContactData', {
        contact_id: contactId,
        email: contact.email,
        company_name: contact.company_id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts-for-enrichment']);
      queryClient.invalidateQueries(['enrichment-logs']);
    }
  });

  const bulkEnrichMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const contact of enrichableContacts.slice(0, 10)) {
        try {
          const response = await base44.functions.invoke('enrichContactData', {
            contact_id: contact.id,
            email: contact.email,
            company_name: contact.company_id
          });
          results.push({ contact_id: contact.id, success: true, data: response.data });
        } catch (error) {
          results.push({ contact_id: contact.id, success: false, error: error.message });
        }
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts-for-enrichment']);
      queryClient.invalidateQueries(['enrichment-logs']);
      setEnriching(false);
      alert('Bulk enrichment completed!');
    }
  });

  const handleBulkEnrich = () => {
    if (enrichableContacts.length === 0) {
      alert('No contacts to enrich');
      return;
    }
    setEnriching(true);
    bulkEnrichMutation.mutate();
  };

  const recentLogs = enrichmentLogs.slice(0, 10);

  const avgConfidence = enrichedContacts.length > 0
    ? (enrichedContacts.reduce((sum, c) => sum + (c.custom_data?.enrichment?.confidence_score || 0), 0) / enrichedContacts.length).toFixed(0)
    : 0;

  return (
    <div className="p-8" style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8" style={{ color: "#722ed1" }} />
              <h1 className="text-3xl font-bold" style={{ color: "#111827" }}>Data Enrichment</h1>
            </div>
            <p style={{ color: "#6b7280" }}>Automatically enhance contact and company records with AI</p>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={handleBulkEnrich} disabled={enriching || enrichableContacts.length === 0}>
              {enriching ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Enrich {Math.min(enrichableContacts.length, 10)} Contacts
                </>
              )}
            </NeuroButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <NeuroCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Total Contacts</p>
                <p className="text-3xl font-bold" style={{ color: "#0066cc" }}>
                  {contacts.length}
                </p>
              </div>
              <Users className="w-8 h-8" style={{ color: "#0066cc", opacity: 0.2 }} />
            </div>
          </NeuroCard>

          <NeuroCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Enriched</p>
                <p className="text-3xl font-bold" style={{ color: "#52c41a" }}>
                  {enrichedContacts.length}
                </p>
              </div>
              <Check className="w-8 h-8" style={{ color: "#52c41a", opacity: 0.2 }} />
            </div>
          </NeuroCard>

          <NeuroCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Can Be Enriched</p>
                <p className="text-3xl font-bold" style={{ color: "#fa8c16" }}>
                  {enrichableContacts.length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: "#fa8c16", opacity: 0.2 }} />
            </div>
          </NeuroCard>

          <NeuroCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Avg. Confidence</p>
                <p className="text-3xl font-bold" style={{ color: "#722ed1" }}>
                  {avgConfidence}%
                </p>
              </div>
              <Sparkles className="w-8 h-8" style={{ color: "#722ed1", opacity: 0.2 }} />
            </div>
          </NeuroCard>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Settings */}
          <div className="col-span-1">
            <NeuroCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5" style={{ color: "#0066cc" }} />
                <h3 className="font-bold" style={{ color: "#111827" }}>Enrichment Settings</h3>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enrichmentSettings.auto_enrich_contacts}
                    onChange={(e) => setEnrichmentSettings({ ...enrichmentSettings, auto_enrich_contacts: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "#0066cc" }}
                  />
                  <span className="text-sm" style={{ color: "#374151" }}>Auto-enrich contacts</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enrichmentSettings.auto_enrich_companies}
                    onChange={(e) => setEnrichmentSettings({ ...enrichmentSettings, auto_enrich_companies: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "#0066cc" }}
                  />
                  <span className="text-sm" style={{ color: "#374151" }}>Auto-enrich companies</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enrichmentSettings.enrich_on_create}
                    onChange={(e) => setEnrichmentSettings({ ...enrichmentSettings, enrich_on_create: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "#0066cc" }}
                  />
                  <span className="text-sm" style={{ color: "#374151" }}>Enrich on create</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enrichmentSettings.enrich_on_update}
                    onChange={(e) => setEnrichmentSettings({ ...enrichmentSettings, enrich_on_update: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "#0066cc" }}
                  />
                  <span className="text-sm" style={{ color: "#374151" }}>Enrich on update</span>
                </label>

                <div className="pt-4 border-t" style={{ borderColor: "#e5e7eb" }}>
                  <p className="text-sm font-medium mb-3" style={{ color: "#374151" }}>
                    Fields to Enrich
                  </p>
                  {Object.entries(enrichmentSettings.fields_to_enrich).map(([field, enabled]) => (
                    <label key={field} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnrichmentSettings({
                          ...enrichmentSettings,
                          fields_to_enrich: {
                            ...enrichmentSettings.fields_to_enrich,
                            [field]: e.target.checked
                          }
                        })}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: "#0066cc" }}
                      />
                      <span className="text-sm capitalize" style={{ color: "#6b7280" }}>
                        {field.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="pt-4 border-t" style={{ borderColor: "#e5e7eb" }}>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
                    Confidence Threshold: {enrichmentSettings.confidence_threshold}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={enrichmentSettings.confidence_threshold}
                    onChange={(e) => setEnrichmentSettings({ ...enrichmentSettings, confidence_threshold: parseInt(e.target.value) })}
                    className="w-full"
                    style={{ accentColor: "#0066cc" }}
                  />
                  <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                    Only apply enrichment above this confidence level
                  </p>
                </div>
              </div>
            </NeuroCard>

            {/* Info Card */}
            <NeuroCard className="p-6 mt-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium mb-1" style={{ color: "#0066cc" }}>
                  How it works
                </p>
                <ul className="text-xs space-y-1" style={{ color: "#374151" }}>
                  <li>• AI analyzes email domain and name</li>
                  <li>• Infers job title and seniority</li>
                  <li>• Estimates company size & revenue</li>
                  <li>• Finds social media profiles</li>
                  <li>• Non-intrusive & configurable</li>
                </ul>
              </div>
            </NeuroCard>
          </div>

          {/* Enrichment Logs */}
          <div className="col-span-2">
            <NeuroCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold" style={{ color: "#111827" }}>Recent Enrichments</h3>
                <span className="text-sm px-3 py-1 rounded-full" style={{ background: '#e6f7ff', color: "#0066cc" }}>
                  {enrichmentLogs.length} total
                </span>
              </div>

              {recentLogs.length === 0 ? (
                <div className="text-center py-12" style={{ color: "#9ca3af" }}>
                  <Sparkles className="w-12 h-12 mx-auto mb-3" style={{ color: "#d1d5db" }} />
                  <p>No enrichment activity yet</p>
                  <p className="text-sm">Click "Enrich Contacts" to start</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                      <div className="ampvibe-inset p-2 rounded-lg">
                        <Check className="w-5 h-5" style={{ color: "#52c41a" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium" style={{ color: "#111827" }}>
                            {log.record_name}
                          </p>
                          <span className="text-xs px-2 py-1 rounded-full" style={{ 
                            background: log.record_data.confidence_score >= 80 ? '#f6ffed' : '#fffbe6',
                            color: log.record_data.confidence_score >= 80 ? '#52c41a' : '#fa8c16'
                          }}>
                            {log.record_data.confidence_score}% confidence
                          </span>
                        </div>
                        <p className="text-xs mb-2" style={{ color: "#6b7280" }}>
                          Enriched fields: {log.record_data.fields_enriched?.join(', ') || 'None'}
                        </p>
                        <div className="flex items-center gap-2 text-xs" style={{ color: "#9ca3af" }}>
                          <Calendar className="w-3 h-3" />
                          {new Date(log.record_data.enriched_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </NeuroCard>
          </div>
        </div>
      </div>
    </div>
  );
}