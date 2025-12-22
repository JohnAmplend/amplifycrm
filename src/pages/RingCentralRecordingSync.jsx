import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function RingCentralRecordingSync() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    
    try {
      const response = await base44.functions.invoke('ringcentral/syncCallsWithRecordings', {});
      setResult(response.data);
    } catch (error) {
      setResult({ 
        success: false, 
        error: error.message || 'Failed to sync recordings' 
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
            RingCentral Recording Sync
          </h1>
          <p style={{ color: "#888" }}>
            Download and permanently store RingCentral call recordings in Base44
          </p>
        </div>

        <NeuroCard className="mb-6">
          <div className="space-y-4">
            <div className="neuro-inset p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-3" style={{ color: "#666" }}>
                About Recording Storage
              </h3>
              <ul className="space-y-2 text-sm" style={{ color: "#888" }}>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#52c41a" }} />
                  <span>Downloads recordings from RingCentral and stores them permanently in Base44</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#52c41a" }} />
                  <span>Recordings remain accessible even if removed from RingCentral</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#52c41a" }} />
                  <span>Audio player works directly without authentication issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#52c41a" }} />
                  <span>Only processes activities that haven't been downloaded yet</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-center">
              <NeuroButton 
                variant="primary" 
                onClick={handleSync}
                disabled={syncing}
                className="px-8 py-4 text-lg"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Syncing Recordings...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Sync All Recordings
                  </>
                )}
              </NeuroButton>
            </div>
          </div>
        </NeuroCard>

        {result && (
          <NeuroCard>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                {result.success ? (
                  <>
                    <div className="neuro-inset p-3 rounded-lg">
                      <CheckCircle className="w-6 h-6" style={{ color: "#52c41a" }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: "#666" }}>
                        Sync Completed
                      </h3>
                      <p className="text-sm" style={{ color: "#888" }}>
                        Recordings have been processed successfully
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="neuro-inset p-3 rounded-lg">
                      <AlertCircle className="w-6 h-6" style={{ color: "#ff4d4f" }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: "#666" }}>
                        Sync Failed
                      </h3>
                      <p className="text-sm" style={{ color: "#ff4d4f" }}>
                        {result.error}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {result.success && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="neuro-inset p-4 rounded-lg">
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>
                      Total Recordings
                    </p>
                    <p className="text-2xl font-bold" style={{ color: "#666" }}>
                      {result.total_recordings || 0}
                    </p>
                  </div>
                  <div className="neuro-inset p-4 rounded-lg">
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>
                      Downloaded
                    </p>
                    <p className="text-2xl font-bold" style={{ color: "#52c41a" }}>
                      {result.downloaded || 0}
                    </p>
                  </div>
                  <div className="neuro-inset p-4 rounded-lg">
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>
                      Failed
                    </p>
                    <p className="text-2xl font-bold" style={{ color: result.failed > 0 ? "#ff4d4f" : "#666" }}>
                      {result.failed || 0}
                    </p>
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="neuro-inset p-4 rounded-lg">
                  <h4 className="font-bold mb-2" style={{ color: "#666" }}>
                    Errors:
                  </h4>
                  <div className="space-y-2">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm p-2 bg-red-50 rounded" style={{ color: "#ff4d4f" }}>
                        <p className="font-medium">{error.subject || error.activity_id}</p>
                        <p className="text-xs">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </NeuroCard>
        )}
      </div>
    </div>
  );
}