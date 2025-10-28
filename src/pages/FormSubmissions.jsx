import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function FormSubmissions() {
  const [selectedForm, setSelectedForm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('form');
    if (formId) setSelectedForm(formId);
  }, []);

  const { data: forms = [] } = useQuery({
    queryKey: ['forms'],
    queryFn: () => base44.entities.Form.list()
  });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions', selectedForm],
    queryFn: () => {
      if (selectedForm) {
        return base44.entities.Form_Submission.filter({ form_id: selectedForm }, '-created_date');
      }
      return base44.entities.Form_Submission.list('-created_date');
    }
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Form Submissions
            </h1>
            <p style={{ color: "#888" }}>View all form submissions</p>
          </div>
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <NeuroSelect
              placeholder="All Forms"
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              options={forms.map(f => ({ value: f.id, label: f.form_name }))}
            />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ampvibe-input w-full pl-12"
              />
            </div>
          </div>
        </NeuroCard>

        {/* Submissions */}
        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p style={{ color: "#aaa" }}>No submissions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const form = forms.find(f => f.id === submission.form_id);
                return (
                  <div key={submission.id} className="ampvibe-inset p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold" style={{ color: "#666" }}>
                          {form?.form_name || 'Unknown Form'}
                        </h3>
                        <p className="text-sm" style={{ color: "#888" }}>
                          {new Date(submission.created_date).toLocaleString()}
                        </p>
                      </div>
                      {submission.ip_address && (
                        <span className="ampvibe-button px-2 py-1 text-xs">
                          {submission.ip_address}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(submission.submission_data || {}).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs" style={{ color: "#aaa" }}>{key}</p>
                          <p className="text-sm" style={{ color: "#666" }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}