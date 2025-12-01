import React, { useState } from "react";
import { X, AlertTriangle, Loader2, CheckCircle, XCircle } from "lucide-react";
import NeuroButton from "./NeuroButton";
import NeuroInput from "./NeuroInput";
import NeuroSelect from "./NeuroSelect";

export default function BulkActionModal({
  isOpen,
  onClose,
  action,
  selectedCount,
  objectType,
  onConfirm,
  users = [],
  existingTags = []
}) {
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const result = await onConfirm(getPayload());
      setResult(result);
    } catch (error) {
      setResult({ 
        success: false, 
        error: error.message,
        failedRecords: selectedCount 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPayload = () => {
    switch (action) {
      case 'changeOwner':
        return { newOwner: inputValue };
      case 'addTags':
        return { tags };
      case 'removeTags':
        return { tags };
      case 'updateStatus':
      case 'updateStage':
      case 'updatePriority':
        return { value: inputValue };
      default:
        return {};
    }
  };

  const handleClose = () => {
    setInputValue("");
    setTags([]);
    setTagInput("");
    setIsProcessing(false);
    setResult(null);
    onClose();
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const getActionConfig = () => {
    switch (action) {
      case 'delete':
        return {
          title: 'Delete Records',
          description: `Are you sure you want to delete ${selectedCount} ${objectType.toLowerCase()}(s)? This action cannot be undone.`,
          confirmText: 'Delete',
          confirmVariant: 'danger',
          showInput: false,
          icon: AlertTriangle,
          iconColor: '#ef4444'
        };
      case 'changeOwner':
        return {
          title: 'Change Owner',
          description: `Select a new owner for ${selectedCount} ${objectType.toLowerCase()}(s):`,
          confirmText: 'Update Owner',
          confirmVariant: 'primary',
          showInput: true,
          inputType: 'select',
          inputOptions: users.map(u => ({ value: u.email, label: u.full_name || u.email })),
          icon: CheckCircle,
          iconColor: '#00A86B'
        };
      case 'addTags':
        return {
          title: 'Add Tags',
          description: `Add tags to ${selectedCount} ${objectType.toLowerCase()}(s):`,
          confirmText: 'Add Tags',
          confirmVariant: 'primary',
          showInput: true,
          inputType: 'tags',
          icon: CheckCircle,
          iconColor: '#00A86B'
        };
      case 'removeTags':
        return {
          title: 'Remove Tags',
          description: `Remove tags from ${selectedCount} ${objectType.toLowerCase()}(s):`,
          confirmText: 'Remove Tags',
          confirmVariant: 'primary',
          showInput: true,
          inputType: 'tags',
          icon: CheckCircle,
          iconColor: '#00A86B'
        };
      default:
        return {
          title: 'Bulk Action',
          description: `Perform action on ${selectedCount} ${objectType.toLowerCase()}(s)?`,
          confirmText: 'Confirm',
          confirmVariant: 'primary',
          showInput: false,
          icon: CheckCircle,
          iconColor: '#00A86B'
        };
    }
  };

  const config = getActionConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="ampvibe-card max-w-lg w-full">
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="ampvibe-inset p-2 rounded-lg">
                <config.icon className="w-5 h-5" style={{ color: config.iconColor }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                {config.title}
              </h2>
            </div>
            <button onClick={handleClose} className="ampvibe-button p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!result ? (
            <>
              <p className="mb-4" style={{ color: "#888" }}>
                {config.description}
              </p>

              {config.showInput && config.inputType === 'select' && (
                <NeuroSelect
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  options={config.inputOptions}
                  placeholder="Select..."
                />
              )}

              {config.showInput && config.inputType === 'tags' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <NeuroInput
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Enter tag name"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <NeuroButton onClick={addTag}>Add</NeuroButton>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span key={tag} className="ampvibe-button px-3 py-1 text-sm flex items-center gap-2">
                          {tag}
                          <button onClick={() => removeTag(tag)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {existingTags.length > 0 && (
                    <div>
                      <p className="text-sm mb-2" style={{ color: "#888" }}>Suggested tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {existingTags.filter(t => !tags.includes(t)).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setTags([...tags, tag])}
                            className="ampvibe-button px-2 py-1 text-xs"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              {result.success ? (
                <>
                  <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#00A86B" }} />
                  <h3 className="text-xl font-bold mb-2" style={{ color: "#666" }}>
                    Operation Completed
                  </h3>
                  <p style={{ color: "#888" }}>
                    Successfully processed {result.successfulRecords} of {result.totalRecords} records
                    {result.failedRecords > 0 && ` (${result.failedRecords} failed)`}
                  </p>
                  {result.canUndo && (
                    <p className="mt-2 text-sm" style={{ color: "#00A86B" }}>
                      You can undo this action within 5 minutes
                    </p>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#ef4444" }} />
                  <h3 className="text-xl font-bold mb-2" style={{ color: "#666" }}>
                    Operation Failed
                  </h3>
                  <p style={{ color: "#888" }}>
                    {result.error || 'An error occurred while processing the operation'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end gap-2" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          {!result ? (
            <>
              <NeuroButton onClick={handleClose} disabled={isProcessing}>
                Cancel
              </NeuroButton>
              <NeuroButton
                variant={config.confirmVariant === 'danger' ? undefined : 'primary'}
                onClick={handleConfirm}
                disabled={isProcessing || (config.showInput && !inputValue && tags.length === 0)}
                className={config.confirmVariant === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  config.confirmText
                )}
              </NeuroButton>
            </>
          ) : (
            <NeuroButton variant="primary" onClick={handleClose}>
              Close
            </NeuroButton>
          )}
        </div>
      </div>
    </div>
  );
}