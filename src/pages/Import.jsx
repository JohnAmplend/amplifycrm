import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function Import() {
  const queryClient = useQueryClient();
  const [importType, setImportType] = useState("Contacts");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type) {
      setImportType(type);
    }
  }, []);

  const { data: imports = [] } = useQuery({
    queryKey: ['imports'],
    queryFn: () => base44.entities.Import_Job.list('-created_date')
  });

  const createImportMutation = useMutation({
    mutationFn: async (data) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: data.file });
      
      return base44.entities.Import_Job.create({
        file_name: data.file.name,
        file_url,
        import_type: data.import_type,
        status: "Pending",
        total_records: 0,
        successful_records: 0,
        failed_records: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['imports']);
      setFile(null);
      setUploading(false);
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    createImportMutation.mutate({ file, import_type: importType });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5" style={{ color: "#52c41a" }} />;
      case 'Failed':
        return <XCircle className="w-5 h-5" style={{ color: "#f5222d" }} />;
      case 'Processing':
        return <Clock className="w-5 h-5 animate-spin" style={{ color: "#4a90e2" }} />;
      default:
        return <Clock className="w-5 h-5" style={{ color: "#aaa" }} />;
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
            Import Data
          </h1>
          <p style={{ color: "#888" }}>Upload CSV or Excel files to bulk import records</p>
        </div>

        {/* Upload Form */}
        <NeuroCard className="mb-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: "#666" }}>
            Upload File
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <NeuroSelect
              label="Import Type"
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              options={[
                { value: 'Contacts', label: 'Contacts' },
                { value: 'Companies', label: 'Companies' },
                { value: 'Deals', label: 'Deals' },
                { value: 'Leads', label: 'Leads' }
              ]}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#666" }}>
                Select File <span style={{ color: "#f5222d" }}>*</span>
              </label>
              <div className="neuro-inset p-8 rounded-lg text-center">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  required
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer"
                >
                  <div className="neuro-button inline-flex items-center gap-2 px-6 py-3 mb-3">
                    <Upload className="w-5 h-5" style={{ color: "#666" }} />
                    <span style={{ color: "#666" }}>Choose File</span>
                  </div>
                  {file && (
                    <div className="mt-4 flex items-center justify-center gap-2" style={{ color: "#666" }}>
                      <FileText className="w-5 h-5" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-sm" style={{ color: "#aaa" }}>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                  <p className="text-sm mt-4" style={{ color: "#aaa" }}>
                    Supported formats: CSV, XLSX, XLS
                  </p>
                </label>
              </div>
            </div>

            <div className="neuro-inset p-4 rounded-lg">
              <h3 className="font-semibold mb-2" style={{ color: "#666" }}>
                Import Guidelines:
              </h3>
              <ul className="text-sm space-y-1" style={{ color: "#888" }}>
                <li>• First row should contain column headers</li>
                <li>• Ensure required fields are present (varies by type)</li>
                <li>• Date format: YYYY-MM-DD</li>
                <li>• Maximum file size: 10 MB</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <NeuroButton
                type="submit"
                variant="primary"
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Start Import
                  </>
                )}
              </NeuroButton>
            </div>
          </form>
        </NeuroCard>

        {/* Import History */}
        <NeuroCard>
          <h2 className="text-xl font-bold mb-6" style={{ color: "#666" }}>
            Import History
          </h2>
          {imports.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              No import history yet
            </div>
          ) : (
            <div className="space-y-3">
              {imports.map((importJob) => (
                <div key={importJob.id} className="neuro-inset p-5 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="neuro-button p-3 rounded-lg">
                      {getStatusIcon(importJob.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold mb-1" style={{ color: "#666" }}>
                            {importJob.file_name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="neuro-button px-2 py-1 text-xs">
                              {importJob.import_type}
                            </span>
                            <span className={`neuro-button px-2 py-1 text-xs ${
                              importJob.status === 'Completed' ? 'text-green-600' :
                              importJob.status === 'Failed' ? 'text-red-600' :
                              importJob.status === 'Processing' ? 'text-blue-600' : ''
                            }`}>
                              {importJob.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm" style={{ color: "#aaa" }}>
                          {new Date(importJob.created_date).toLocaleDateString()}
                        </p>
                      </div>

                      {importJob.status !== 'Pending' && (
                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <p style={{ color: "#aaa" }}>Total Records</p>
                            <p className="font-semibold" style={{ color: "#666" }}>
                              {importJob.total_records || 0}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: "#aaa" }}>Successful</p>
                            <p className="font-semibold" style={{ color: "#52c41a" }}>
                              {importJob.successful_records || 0}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: "#aaa" }}>Failed</p>
                            <p className="font-semibold" style={{ color: "#f5222d" }}>
                              {importJob.failed_records || 0}
                            </p>
                          </div>
                        </div>
                      )}

                      {importJob.error_log && (
                        <div className="mt-3 neuro-inset p-3 rounded-lg">
                          <p className="text-xs font-semibold mb-1" style={{ color: "#f5222d" }}>
                            Errors:
                          </p>
                          <p className="text-xs" style={{ color: "#888" }}>
                            {importJob.error_log}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}