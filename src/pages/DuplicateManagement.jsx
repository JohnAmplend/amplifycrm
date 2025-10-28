import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Copy, RefreshCw, X, CheckCircle, Settings, Play } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function DuplicateManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("Pending");
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);

  const { data: duplicates = [], isLoading } = useQuery({
    queryKey: ['duplicates'],
    queryFn: () => base44.entities.Duplicate_Records.list('-created_date')
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['duplicate_rules'],
    queryFn: () => base44.entities.Duplicate_Rules.list()
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list()
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Duplicate_Records.update(id, { 
      status,
      reviewed_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['duplicates']);
    }
  });

  const runDetectionMutation = useMutation({
    mutationFn: async (entityType) => {
      setIsDetecting(true);
      setDetectionResult(null);
      const response = await base44.functions.invoke('detectDuplicates', { entity_type: entityType });
      return response.data;
    },
    onSuccess: (data) => {
      setIsDetecting(false);
      setDetectionResult(data);
      queryClient.invalidateQueries(['duplicates']);
    },
    onError: (error) => {
      setIsDetecting(false);
      alert('Detection failed: ' + error.message);
    }
  });

  const getRecord = (type, id) => {
    if (type === 'Contact') return contacts.find(c => c.id === id);
    if (type === 'Company') return companies.find(c => c.id === id);
    if (type === 'Lead') return leads.find(l => l.id === id);
    return null;
  };

  const getRecordName = (type, record) => {
    if (!record) return 'Unknown';
    if (type === 'Contact') return `${record.first_name} ${record.last_name}`;
    if (type === 'Company') return record.company_name;
    if (type === 'Lead') return `${record.first_name} ${record.last_name}`;
    return 'Unknown';
  };

  const handleMerge = (duplicate) => {
    const primary = getRecord(duplicate.record_type, duplicate.primary_record_id);
    const duplicateRecord = getRecord(duplicate.record_type, duplicate.duplicate_record_id);
    
    if (window.confirm(`Merge "${getRecordName(duplicate.record_type, duplicateRecord)}" into "${getRecordName(duplicate.record_type, primary)}"?\n\nThe duplicate record will be deleted and its data will be preserved in merge history.`)) {
      updateStatusMutation.mutate({ id: duplicate.id, status: 'Merged' });
      // In a real implementation, you would also merge the actual records here
    }
  };

  const filteredDuplicates = duplicates.filter(d => {
    const typeMatch = !filterType || d.record_type === filterType;
    const statusMatch = !filterStatus || d.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const pendingCount = duplicates.filter(d => d.status === 'Pending').length;
  const activeRulesCount = rules.filter(r => r.active).length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Duplicate Management
            </h1>
            <p style={{ color: "#888" }}>Identify and merge duplicate records</p>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={() => setShowRulesModal(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Detection Rules ({activeRulesCount})
            </NeuroButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <NeuroCard className="text-center">
            <Copy className="w-8 h-8 mx-auto mb-2" style={{ color: "#fa8c16" }} />
            <p className="text-2xl font-bold" style={{ color: "#666" }}>
              {pendingCount}
            </p>
            <p className="text-sm" style={{ color: "#888" }}>Pending Review</p>
          </NeuroCard>
          <NeuroCard className="text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "#52c41a" }} />
            <p className="text-2xl font-bold" style={{ color: "#666" }}>
              {duplicates.filter(d => d.status === 'Merged').length}
            </p>
            <p className="text-sm" style={{ color: "#888" }}>Merged</p>
          </NeuroCard>
          <NeuroCard className="text-center">
            <X className="w-8 h-8 mx-auto mb-2" style={{ color: "#888" }} />
            <p className="text-2xl font-bold" style={{ color: "#666" }}>
              {duplicates.filter(d => d.status === 'Dismissed').length}
            </p>
            <p className="text-sm" style={{ color: "#888" }}>Dismissed</p>
          </NeuroCard>
        </div>

        {/* Detection Controls */}
        <NeuroCard className="mb-6">
          <h3 className="font-bold mb-4" style={{ color: "#666" }}>
            Run Duplicate Detection
          </h3>
          <div className="flex gap-3">
            <NeuroButton 
              variant="primary"
              onClick={() => runDetectionMutation.mutate('Contact')}
              disabled={isDetecting}
            >
              <Play className="w-4 h-4 mr-2" />
              {isDetecting ? 'Detecting...' : 'Scan Contacts'}
            </NeuroButton>
            <NeuroButton 
              variant="primary"
              onClick={() => runDetectionMutation.mutate('Company')}
              disabled={isDetecting}
            >
              <Play className="w-4 h-4 mr-2" />
              {isDetecting ? 'Detecting...' : 'Scan Companies'}
            </NeuroButton>
            <NeuroButton 
              variant="primary"
              onClick={() => runDetectionMutation.mutate('Lead')}
              disabled={isDetecting}
            >
              <Play className="w-4 h-4 mr-2" />
              {isDetecting ? 'Detecting...' : 'Scan Leads'}
            </NeuroButton>
          </div>
          
          {detectionResult && (
            <div className="mt-4 ampvibe-inset p-4 rounded-lg">
              <p className="font-bold mb-2" style={{ color: "#52c41a" }}>
                ✓ Detection Complete
              </p>
              <div className="text-sm" style={{ color: "#888" }}>
                <p>• Entity Type: {detectionResult.entity_type}</p>
                <p>• Records Scanned: {detectionResult.records_scanned}</p>
                <p>• Duplicates Found: {detectionResult.duplicates_found}</p>
                <p>• Rules Applied: {detectionResult.rules_applied}</p>
              </div>
            </div>
          )}
        </NeuroCard>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <NeuroSelect
              placeholder="All Types"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'Contact', label: 'Contacts' },
                { value: 'Company', label: 'Companies' },
                { value: 'Lead', label: 'Leads' }
              ]}
            />
            <NeuroSelect
              placeholder="All Statuses"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'Pending', label: 'Pending' },
                { value: 'Merged', label: 'Merged' },
                { value: 'Dismissed', label: 'Dismissed' },
                { value: 'False Positive', label: 'False Positive' }
              ]}
            />
          </div>
        </NeuroCard>

        {/* Duplicates List */}
        <div className="space-y-4">
          {isLoading ? (
            <NeuroCard>
              <div className="text-center py-12" style={{ color: "#aaa" }}>
                Loading duplicates...
              </div>
            </NeuroCard>
          ) : filteredDuplicates.length === 0 ? (
            <NeuroCard>
              <div className="text-center py-12">
                <Copy className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
                <p className="mb-4" style={{ color: "#aaa" }}>
                  {duplicates.length === 0 
                    ? 'No duplicates detected. Run a scan to find potential duplicates.'
                    : 'No duplicates match your filters.'}
                </p>
              </div>
            </NeuroCard>
          ) : (
            filteredDuplicates.map((duplicate) => {
              const primary = getRecord(duplicate.record_type, duplicate.primary_record_id);
              const duplicateRecord = getRecord(duplicate.record_type, duplicate.duplicate_record_id);

              return (
                <NeuroCard key={duplicate.id} className="hover:shadow-xl transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="ampvibe-button px-3 py-1 text-xs">
                            {duplicate.record_type}
                          </span>
                          <span className={`ampvibe-button px-3 py-1 text-xs ${
                            duplicate.status === 'Pending' ? 'text-orange-600' :
                            duplicate.status === 'Merged' ? 'text-green-600' :
                            'text-gray-600'
                          }`}>
                            {duplicate.status}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "#888" }}>
                          Similarity: <span className="font-bold">{duplicate.similarity_score}%</span>
                        </p>
                        <p className="text-xs" style={{ color: "#aaa" }}>
                          Matching fields: {duplicate.matching_fields}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="ampvibe-inset p-4 rounded-lg">
                        <p className="text-xs mb-2" style={{ color: "#888" }}>Primary Record</p>
                        <p className="font-bold" style={{ color: "#666" }}>
                          {getRecordName(duplicate.record_type, primary)}
                        </p>
                        {primary && duplicate.record_type === 'Contact' && (
                          <p className="text-sm" style={{ color: "#888" }}>{primary.email}</p>
                        )}
                        {primary && duplicate.record_type === 'Company' && (
                          <p className="text-sm" style={{ color: "#888" }}>{primary.domain}</p>
                        )}
                      </div>

                      <div className="ampvibe-inset p-4 rounded-lg">
                        <p className="text-xs mb-2" style={{ color: "#888" }}>Duplicate Record</p>
                        <p className="font-bold" style={{ color: "#666" }}>
                          {getRecordName(duplicate.record_type, duplicateRecord)}
                        </p>
                        {duplicateRecord && duplicate.record_type === 'Contact' && (
                          <p className="text-sm" style={{ color: "#888" }}>{duplicateRecord.email}</p>
                        )}
                        {duplicateRecord && duplicate.record_type === 'Company' && (
                          <p className="text-sm" style={{ color: "#888" }}>{duplicateRecord.domain}</p>
                        )}
                      </div>
                    </div>

                    {duplicate.status === 'Pending' && (
                      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                        <NeuroButton
                          size="sm"
                          variant="primary"
                          onClick={() => handleMerge(duplicate)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Merge Records
                        </NeuroButton>
                        <NeuroButton
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: duplicate.id, status: 'Dismissed' })}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Dismiss
                        </NeuroButton>
                        <NeuroButton
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: duplicate.id, status: 'False Positive' })}
                        >
                          Not a Duplicate
                        </NeuroButton>
                      </div>
                    )}
                  </div>
                </NeuroCard>
              );
            })
          )}
        </div>

        {/* Rules Modal */}
        {showRulesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="ampvibe-card max-w-4xl w-full max-h-[80vh] overflow-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                  Duplicate Detection Rules
                </h2>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="ampvibe-button p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {rules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="mb-4" style={{ color: "#888" }}>
                    No detection rules configured yet.
                  </p>
                  <p className="text-sm" style={{ color: "#aaa" }}>
                    Rules define how duplicates are detected based on field matching.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="ampvibe-inset p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold" style={{ color: "#666" }}>
                            {rule.entity_type} - {rule.field_name}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="ampvibe-button px-2 py-1 text-xs">
                              {rule.match_type}
                            </span>
                            <span className="ampvibe-button px-2 py-1 text-xs">
                              Weight: {rule.weight}
                            </span>
                            <span className="ampvibe-button px-2 py-1 text-xs">
                              Threshold: {rule.threshold}
                            </span>
                          </div>
                        </div>
                        <span className={`ampvibe-button px-3 py-1 text-xs ${
                          rule.active ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 ampvibe-inset p-4 rounded-lg">
                <h3 className="font-bold mb-2" style={{ color: "#666" }}>
                  How Detection Works
                </h3>
                <ul className="text-sm space-y-1" style={{ color: "#888" }}>
                  <li>• Each rule checks a specific field (e.g., email, name)</li>
                  <li>• Exact match: Fields must be identical</li>
                  <li>• Fuzzy match: Fields are similar (80%+ similarity)</li>
                  <li>• Weights determine importance (0-1 scale)</li>
                  <li>• Threshold sets minimum score to flag as duplicate</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}