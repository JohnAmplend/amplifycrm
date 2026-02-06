import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Upload, FileJson, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import NeuroButton from "../crm/NeuroButton";
import NeuroCard from "../crm/NeuroCard";

export default function ExportImportModal({ boardId, onClose }) {
  const [activeTab, setActiveTab] = useState("export");
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState("json");
  const [mappingMode, setMappingMode] = useState("create_new");
  const [importFile, setImportFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleExport = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      const { data } = await base44.functions.invoke('exportTrackerCards', {
        board_id: boardId
      });

      if (exportFormat === "json") {
        const blob = new Blob([JSON.stringify(data.json_data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tracker-cards-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        // CSV export
        const headers = Object.keys(data.csv_data[0] || {});
        const csvContent = [
          headers.join(','),
          ...data.csv_data.map(row => 
            headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tracker-cards-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }

      setResult({
        success: true,
        message: `Exported ${data.total_cards} cards successfully`
      });
    } catch (error) {
      setResult({
        success: false,
        message: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const fileContent = await importFile.text();
      const importData = JSON.parse(fileContent);

      const { data } = await base44.functions.invoke('importTrackerCards', {
        import_data: importData,
        mapping_mode: mappingMode
      });

      setResult({
        success: true,
        message: `Import complete! Created ${data.results.boards_created} boards, ${data.results.columns_created} columns, ${data.results.cards_created} cards`,
        details: data.results
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setResult({
        success: false,
        message: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <NeuroCard className="w-full max-w-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
              Export / Import Tracker Cards
            </h2>
            <button onClick={onClose} className="ampvibe-button p-2">
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("export")}
              className={`ampvibe-button px-4 py-2 flex items-center gap-2 ${activeTab === "export" ? "active" : ""}`}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`ampvibe-button px-4 py-2 flex items-center gap-2 ${activeTab === "import" ? "active" : ""}`}
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
          </div>

          {/* Export Tab */}
          {activeTab === "export" && (
            <div className="space-y-4">
              <div className="ampvibe-inset p-4 rounded-lg">
                <h3 className="font-bold mb-3" style={{ color: "#666" }}>Export Format</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setExportFormat("json")}
                    className={`ampvibe-button flex-1 p-4 flex flex-col items-center gap-2 ${exportFormat === "json" ? "active" : ""}`}
                  >
                    <FileJson className="w-6 h-6" />
                    <span className="font-medium">JSON</span>
                    <span className="text-xs" style={{ color: "#aaa" }}>Full data with relationships</span>
                  </button>
                  <button
                    onClick={() => setExportFormat("csv")}
                    className={`ampvibe-button flex-1 p-4 flex flex-col items-center gap-2 ${exportFormat === "csv" ? "active" : ""}`}
                  >
                    <FileSpreadsheet className="w-6 h-6" />
                    <span className="font-medium">CSV</span>
                    <span className="text-xs" style={{ color: "#aaa" }}>Spreadsheet compatible</span>
                  </button>
                </div>
              </div>

              <div className="ampvibe-inset p-4 rounded-lg">
                <h3 className="font-bold mb-2" style={{ color: "#666" }}>What will be exported?</h3>
                <ul className="text-sm space-y-1" style={{ color: "#888" }}>
                  <li>• {boardId ? "Selected board" : "All boards"} and columns</li>
                  <li>• All card details (title, description, status, priority)</li>
                  <li>• Assignments and collaborators</li>
                  <li>• Attachments and comments</li>
                  <li>• Progress tracking data</li>
                </ul>
              </div>

              <NeuroButton
                variant="primary"
                onClick={handleExport}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Export Cards
                  </>
                )}
              </NeuroButton>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === "import" && (
            <div className="space-y-4">
              <div className="ampvibe-inset p-4 rounded-lg">
                <h3 className="font-bold mb-3" style={{ color: "#666" }}>Import Mode</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={mappingMode === "create_new"}
                      onChange={() => setMappingMode("create_new")}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-medium" style={{ color: "#666" }}>Create New</p>
                      <p className="text-sm" style={{ color: "#aaa" }}>Creates new boards, columns, and cards</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={mappingMode === "map_existing"}
                      onChange={() => setMappingMode("map_existing")}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-medium" style={{ color: "#666" }}>Map to Existing</p>
                      <p className="text-sm" style={{ color: "#aaa" }}>Maps to existing boards/columns by name</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="ampvibe-inset p-4 rounded-lg">
                <h3 className="font-bold mb-3" style={{ color: "#666" }}>Select Import File</h3>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="ampvibe-input w-full"
                />
                {importFile && (
                  <p className="text-sm mt-2" style={{ color: "#00A86B" }}>
                    ✓ {importFile.name} selected
                  </p>
                )}
              </div>

              <NeuroButton
                variant="primary"
                onClick={handleImport}
                disabled={!importFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Import Cards
                  </>
                )}
              </NeuroButton>
            </div>
          )}

          {/* Result Message */}
          {result && (
            <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.message}
                  </p>
                  {result.details?.errors && result.details.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-700">
                      <p className="font-medium">Errors:</p>
                      <ul className="list-disc ml-4">
                        {result.details.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                        {result.details.errors.length > 5 && (
                          <li>...and {result.details.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </NeuroCard>
    </div>
  );
}