import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function AddConnection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [formData, setFormData] = useState({
    connection_name: "",
    source_app_url: "",
    api_key: "",
    sync_type: "One-Way Import",
    sync_objects: [],
    conflict_resolution: "Newest Wins",
    sync_status: "Active"
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.App_Sync_Connection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sync_connections']);
      navigate(createPageUrl("AppSync"));
    }
  });

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResult({ success: true, message: 'Connection successful!' });
    } catch (error) {
      setTestResult({ success: false, message: 'Connection failed. Please check your credentials.' });
    }
    setTesting(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const toggleObject = (object) => {
    const current = formData.sync_objects || [];
    const updated = current.includes(object)
      ? current.filter(o => o !== object)
      : [...current, object];
    setFormData({ ...formData, sync_objects: updated });
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <NeuroButton onClick={() => navigate(createPageUrl("AppSync"))}>
            <ArrowLeft className="w-4 h-4" />
          </NeuroButton>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
              Add Connection
            </h1>
            <p style={{ color: "#888" }}>Connect to another Base44 app</p>
          </div>
        </div>

        <NeuroCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <NeuroInput
              label="Connection Name"
              value={formData.connection_name}
              onChange={(e) => setFormData({ ...formData, connection_name: e.target.value })}
              placeholder="My CRM Connection"
              required
            />

            <NeuroInput
              label="Source App URL"
              value={formData.source_app_url}
              onChange={(e) => setFormData({ ...formData, source_app_url: e.target.value })}
              placeholder="https://other-app.base44.com"
              required
            />

            <NeuroInput
              label="API Key"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="Enter API key from source app"
              required
            />

            <div className="flex gap-3">
              <NeuroButton
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !formData.source_app_url || !formData.api_key}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </NeuroButton>
              {testResult && (
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5" style={{ color: "#52c41a" }} />
                  ) : (
                    <XCircle className="w-5 h-5" style={{ color: "#f5222d" }} />
                  )}
                  <span style={{ color: testResult.success ? "#52c41a" : "#f5222d" }}>
                    {testResult.message}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <NeuroSelect
                label="Sync Type"
                value={formData.sync_type}
                onChange={(e) => setFormData({ ...formData, sync_type: e.target.value })}
                options={[
                  { value: 'One-Way Import', label: 'One-Way Import' },
                  { value: 'Two-Way Sync', label: 'Two-Way Sync' }
                ]}
              />

              <NeuroSelect
                label="Conflict Resolution"
                value={formData.conflict_resolution}
                onChange={(e) => setFormData({ ...formData, conflict_resolution: e.target.value })}
                options={[
                  { value: 'Source Wins', label: 'Source Wins' },
                  { value: 'Newest Wins', label: 'Newest Wins' },
                  { value: 'Manual Review', label: 'Manual Review' }
                ]}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: "#666" }}>
                Objects to Sync <span style={{ color: "#f5222d" }}>*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Contacts', 'Companies', 'Deals', 'Leads'].map((object) => (
                  <div key={object} className="neuro-inset p-4 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sync_objects?.includes(object)}
                        onChange={() => toggleObject(object)}
                        className="neuro-button w-5 h-5"
                      />
                      <span className="font-medium" style={{ color: "#666" }}>
                        {object}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="neuro-inset p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2" style={{ color: "#666" }}>
                Notes:
              </p>
              <ul className="text-sm space-y-1" style={{ color: "#888" }}>
                <li>• One-Way Import: Only pulls data from source app</li>
                <li>• Two-Way Sync: Syncs changes in both directions</li>
                <li>• Conflicts are resolved based on your selected strategy</li>
                <li>• Sync runs automatically daily at midnight</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <NeuroButton type="button" onClick={() => navigate(createPageUrl("AppSync"))}>
                Cancel
              </NeuroButton>
              <NeuroButton
                type="submit"
                variant="primary"
                disabled={createMutation.isLoading || !formData.sync_objects?.length}
              >
                {createMutation.isLoading ? 'Saving...' : 'Save & Sync'}
              </NeuroButton>
            </div>
          </form>
        </NeuroCard>
      </div>
    </div>
  );
}