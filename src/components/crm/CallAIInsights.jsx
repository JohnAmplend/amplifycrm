import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, ChevronDown, ChevronUp, Loader2, FileText, Target, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import NeuroButton from "./NeuroButton";

const sentimentConfig = {
  positive: { color: "#52c41a", bg: "#f6ffed", border: "#b7eb8f", label: "Positive" },
  neutral:  { color: "#fa8c16", bg: "#fff7e6", border: "#ffd591", label: "Neutral" },
  negative: { color: "#ef4444", bg: "#fff1f0", border: "#ffa39e", label: "Negative" }
};

export default function CallAIInsights({ call, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const hasAI = call.summary || call.transcript;
  const sentiment = sentimentConfig[call.sentiment] || sentimentConfig.neutral;

  const handleProcess = async (e) => {
    e.stopPropagation();
    setProcessing(true);
    await base44.functions.invoke("ringcentral/processCallAI", { call_id: call.call_id }).catch(() => {});
    setProcessing(false);
    onUpdated?.();
  };

  if (!call.recording_url) return null;

  return (
    <div className="mt-2">
      {/* Trigger button / status */}
      {!hasAI ? (
        <NeuroButton
          size="sm"
          onClick={handleProcess}
          disabled={processing || call.transcript_status === "processing"}
        >
          {(processing || call.transcript_status === "processing")
            ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing...</>
            : <><Sparkles className="w-3 h-3 mr-1" />Analyze with AI</>
          }
        </NeuroButton>
      ) : (
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
          style={{ background: "rgba(0,168,107,0.08)", color: "#00A86B" }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Insights
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Expanded panel */}
      {expanded && hasAI && (
        <div className="mt-3 space-y-3 rounded-xl p-4 border" style={{ background: "rgba(248,250,252,0.95)", borderColor: "rgba(0,0,0,0.08)" }}>

          {/* Sentiment */}
          {call.sentiment && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: sentiment.color }} />
              <span className="text-xs font-semibold" style={{ color: "#666" }}>Sentiment:</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: sentiment.bg, color: sentiment.color, border: `1px solid ${sentiment.border}` }}
              >
                {sentiment.label}
              </span>
            </div>
          )}

          {/* Summary */}
          {call.summary && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5" style={{ color: "#4a90e2" }} />
                <span className="text-xs font-semibold" style={{ color: "#555" }}>Summary</span>
              </div>
              <p className="text-sm" style={{ color: "#666", lineHeight: 1.6 }}>{call.summary}</p>
            </div>
          )}

          {/* Key Points */}
          {call.key_points && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5" style={{ color: "#722ed1" }} />
                <span className="text-xs font-semibold" style={{ color: "#555" }}>Key Points</span>
              </div>
              <div className="space-y-0.5">
                {call.key_points.split('\n').filter(l => l.trim()).map((pt, i) => (
                  <p key={i} className="text-sm" style={{ color: "#666" }}>{pt}</p>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {call.action_items && call.action_items !== "None identified" && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-3.5 h-3.5" style={{ color: "#fa8c16" }} />
                <span className="text-xs font-semibold" style={{ color: "#555" }}>Action Items</span>
              </div>
              <div className="space-y-0.5">
                {call.action_items.split('\n').filter(l => l.trim()).map((item, i) => (
                  <p key={i} className="text-sm" style={{ color: "#666" }}>{item}</p>
                ))}
              </div>
            </div>
          )}

          {/* Transcript toggle */}
          {call.transcript && (
            <div>
              <button
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: "#4a90e2" }}
                onClick={() => setShowTranscript(s => !s)}
              >
                <FileText className="w-3 h-3" />
                {showTranscript ? "Hide" : "View"} Full Transcript
                {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showTranscript && (
                <div
                  className="mt-2 p-3 rounded-lg text-xs max-h-48 overflow-y-auto"
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", color: "#555", lineHeight: 1.7, whiteSpace: "pre-wrap" }}
                >
                  {call.transcript}
                </div>
              )}
            </div>
          )}

          {/* Re-process */}
          <button
            className="text-xs flex items-center gap-1"
            style={{ color: "#aaa" }}
            onClick={handleProcess}
            disabled={processing}
          >
            <RefreshCw className={`w-3 h-3 ${processing ? "animate-spin" : ""}`} />
            Re-process
          </button>
        </div>
      )}
    </div>
  );
}