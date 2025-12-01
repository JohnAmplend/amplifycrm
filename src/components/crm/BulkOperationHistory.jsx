import React from "react";
import { X, Clock, CheckCircle, XCircle, AlertCircle, RotateCcw } from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function BulkOperationHistory({ 
  isOpen,
  onClose,
  operations = [],
  onUndo
}) {
  if (!isOpen) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5" style={{ color: "#00A86B" }} />;
      case 'Failed':
        return <XCircle className="w-5 h-5" style={{ color: "#ef4444" }} />;
      case 'Partially Completed':
        return <AlertCircle className="w-5 h-5" style={{ color: "#fa8c16" }} />;
      default:
        return <Clock className="w-5 h-5" style={{ color: "#888" }} />;
    }
  };

  const canUndo = (operation) => {
    if (!operation.can_undo || !operation.undo_expires_at) return false;
    return new Date(operation.undo_expires_at) > new Date();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="ampvibe-card max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex-shrink-0" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="ampvibe-inset p-2 rounded-lg">
                <Clock className="w-5 h-5" style={{ color: "#00A86B" }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                Operation History
              </h2>
            </div>
            <button onClick={onClose} className="ampvibe-button p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {operations.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: "#ddd" }} />
              <p style={{ color: "#aaa" }}>No operations yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {operations.map((operation) => (
                <div 
                  key={operation.id}
                  className="ampvibe-inset p-4 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(operation.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold" style={{ color: "#666" }}>
                            {operation.operation_type}
                          </h3>
                          <span className="ampvibe-button px-2 py-0.5 text-xs">
                            {operation.object_type}
                          </span>
                        </div>
                        <p className="text-sm mb-1" style={{ color: "#888" }}>
                          {operation.successful_records} of {operation.total_records} records processed
                          {operation.failed_records > 0 && ` (${operation.failed_records} failed)`}
                        </p>
                        <p className="text-xs" style={{ color: "#aaa" }}>
                          {new Date(operation.created_date).toLocaleString()} • by {operation.performed_by}
                        </p>
                      </div>
                    </div>

                    {canUndo(operation) && (
                      <NeuroButton
                        size="sm"
                        onClick={() => {
                          onUndo(operation.id);
                          onClose();
                        }}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Undo
                      </NeuroButton>
                    )}
                  </div>

                  {operation.operation_details && (
                    <div className="mt-2 pl-8 text-xs" style={{ color: "#aaa" }}>
                      {operation.operation_type === 'Update Owner' && (
                        <span>New owner: {operation.operation_details.newOwner}</span>
                      )}
                      {operation.operation_type === 'Add Tags' && (
                        <span>Tags: {operation.operation_details.tags?.join(', ')}</span>
                      )}
                    </div>
                  )}

                  {operation.error_log && operation.error_log.errors && operation.error_log.errors.length > 0 && (
                    <div className="mt-2 pl-8">
                      <details>
                        <summary className="text-xs cursor-pointer" style={{ color: "#ef4444" }}>
                          View {operation.error_log.errors.length} error(s)
                        </summary>
                        <div className="mt-1 space-y-1">
                          {operation.error_log.errors.slice(0, 5).map((error, idx) => (
                            <p key={idx} className="text-xs" style={{ color: "#aaa" }}>
                              {error.recordId}: {error.error}
                            </p>
                          ))}
                          {operation.error_log.errors.length > 5 && (
                            <p className="text-xs" style={{ color: "#aaa" }}>
                              ...and {operation.error_log.errors.length - 5} more
                            </p>
                          )}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}