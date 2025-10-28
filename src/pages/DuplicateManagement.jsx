import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Copy, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function DuplicateManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recordType, setRecordType] = useState("Contact");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: duplicates = [], isLoading } = useQuery({
    queryKey: ['duplicates', recordType],
    queryFn: () => base44.entities.Duplicate_Records.filter({ record_type: recordType }, '-created_date')
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
    enabled: recordType === 'Contact'
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    enabled: recordType === 'Company'
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
    enabled: recordType === 'Lead'
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

  const mergeMutation = useMutation({
    mutationFn: async ({ duplicate, keepPrimary }) => {
      const primaryId = keepPrimary ? duplicate.primary_record_id : duplicate.duplicate_record_id;
      const mergeId = keepPrimary ? duplicate.duplicate_record_id : duplicate.primary_record_id;

      // Log merge history
      await base44.entities.Merge_History.create({
        record_type: duplicate.record_type,
        primary_record_id: primaryId,
        merged_record_id: mergeId,
        merged_data: {},
        merged_by: (await base44.auth.me()).email,
        merged_at: new Date().toISOString()
      });

      // Update duplicate status
      await base44.entities.Duplicate_Records.update(duplicate.id, {
        status: 'Merged',
        merged_at: new Date().toISOString()
      });

      // Delete the duplicate record
      if (duplicate.record_type === 'Contact') {
        await base44.entities.Contact.delete(mergeId);
      } else if (duplicate.record_type === 'Company') {
        await base44.entities.Company.delete(mergeId);
      } else if (duplicate.record_type === 'Lead') {
        await base44.entities.Lead.delete(mergeId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['duplicates']);
      queryClient.invalidateQueries(['contacts']);
      queryClient.invalidateQueries(['companies']);
      queryClient.invalidateQueries(['leads']);
    }
  });

  const getRecord = (id) => {
    if (recordType === 'Contact') return contacts.find(c => c.id === id);
    if (recordType === 'Company') return companies.find(c => c.id === id);
    if (recordType === 'Lead') return leads.find(l => l.id === id);
    return null;
  };

  const getRecordName = (record) => {
    if (!record) return 'Unknown';
    if (recordType === 'Contact') return `${record.first_name} ${record.last_name}`;
    if (recordType === 'Company') return record.company_name;
    if (recordType === 'Lead') return `${record.first_name} ${record.last_name}`;
    return 'Unknown';
  };

  const filteredDuplicates = duplicates.filter(dup => {
    return !filterStatus || dup.status === filterStatus;
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Duplicate Management
            </h1>
            <p style={{ color: "#888" }}>Review and merge duplicate records</p>
          </div>
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <NeuroSelect
              label="Record Type"
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              options={[
                { value: 'Contact', label: 'Contacts' },
                { value: 'Company', label: 'Companies' },
                { value: 'Lead', label: 'Leads' }
              ]}
            />
            <NeuroSelect
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: '', label: 'All' },
                { value: 'Pending Review', label: 'Pending Review' },
                { value: 'Merged', label: 'Merged' },
                { value: 'Dismissed', label: 'Dismissed' },
                { value: 'False Positive', label: 'False Positive' }
              ]}
            />
          </div>
        </NeuroCard>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <NeuroCard className="text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: "#fa8c16" }} />
            <p className="text-2xl font-bold" style={{ color: "#666" }}>
              {duplicates.filter(d => d.status === 'Pending Review').length}
            </p>
            <p className="text-sm" style={{ color: "#888" }}>Pending</p>
          </NeuroCard>
          <NeuroCard className="text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "#52c41a" }} />
            <p className="text-2xl font-bold" style={{ color: "#666" }}>
              {duplicates.filter(d => d.status === 'Merged').length}
            </p>
            <p className="text-sm" style={{ color: "#888" }}>Merged</p>
          </NeuroCard>
          <NeuroCard className="text-center">
            <XCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "#f5222d" }} />
            <p className="text-2xl font-bold" style={{ color: "#666" }}>
              {duplicates.filter(d => d.status === 'Dismissed').length}
            </p>
            <p className="text-sm" style={{ color: "#888" }}>Dismissed</p>
          </NeuroCard>
          <NeuroCard className="text-center">
            <Copy className="w-8 h-8 mx-auto mb-2" style={{ color: "#4a90e2" }} />
            <p className="text-2xl font-bold" style={{ color: "#666" }}>
              {duplicates.length}
            </p>
            <p className="text-sm" style={{ color: "#888" }}>Total</p>
          </NeuroCard>
        </div>

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
                <p style={{ color: "#aaa" }}>No duplicates found</p>
              </div>
            </NeuroCard>
          ) : (
            filteredDuplicates.map((duplicate) => {
              const primaryRecord = getRecord(duplicate.primary_record_id);
              const duplicateRecord = getRecord(duplicate.duplicate_record_id);

              return (
                <NeuroCard key={duplicate.id}>
                  <div className="flex items-start justify-between gap-6">
                    {/* Primary Record */}
                    <div className="flex-1 ampvibe-inset p-4 rounded-lg">
                      <h3 className="font-bold mb-2" style={{ color: "#666" }}>
                        {getRecordName(primaryRecord)}
                      </h3>
                      {primaryRecord?.email && (
                        <p className="text-sm" style={{ color: "#888" }}>{primaryRecord.email}</p>
                      )}
                      {primaryRecord?.phone && (
                        <p className="text-sm" style={{ color: "#888" }}>{primaryRecord.phone}</p>
                      )}
                    </div>

                    {/* Similarity Score */}
                    <div className="text-center px-4">
                      <div className="ampvibe-button px-4 py-2 mb-2">
                        <p className="text-2xl font-bold" style={{ color: "#4a90e2" }}>
                          {duplicate.similarity_score}%
                        </p>
                        <p className="text-xs" style={{ color: "#888" }}>Match</p>
                      </div>
                      <span className={`ampvibe-button px-3 py-1 text-xs ${
                        duplicate.status === 'Merged' ? 'text-green-600' :
                        duplicate.status === 'Dismissed' ? 'text-gray-600' :
                        duplicate.status === 'Pending Review' ? 'text-orange-600' : ''
                      }`}>
                        {duplicate.status}
                      </span>
                    </div>

                    {/* Duplicate Record */}
                    <div className="flex-1 ampvibe-inset p-4 rounded-lg">
                      <h3 className="font-bold mb-2" style={{ color: "#666" }}>
                        {getRecordName(duplicateRecord)}
                      </h3>
                      {duplicateRecord?.email && (
                        <p className="text-sm" style={{ color: "#888" }}>{duplicateRecord.email}</p>
                      )}
                      {duplicateRecord?.phone && (
                        <p className="text-sm" style={{ color: "#888" }}>{duplicateRecord.phone}</p>
                      )}
                    </div>

                    {/* Actions */}
                    {duplicate.status === 'Pending Review' && (
                      <div className="flex flex-col gap-2">
                        <NeuroButton
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            if (window.confirm('Merge and keep the first record?')) {
                              mergeMutation.mutate({ duplicate, keepPrimary: true });
                            }
                          }}
                        >
                          Merge (Keep Left)
                        </NeuroButton>
                        <NeuroButton
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: duplicate.id, status: 'Dismissed' })}
                        >
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
      </div>
    </div>
  );
}