import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const { data: lists = [] } = useQuery({
    queryKey: ['contact_lists'],
    queryFn: () => base44.entities.Contact_List.list(),
    enabled: action === 'addToList'
  });

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
      case 'sendEmail':
        return { subject: emailSubject, body: emailBody };
      case 'addToList':
        return { listId: inputValue };
      case 'updateStage':
        return { stage: inputValue };
      case 'updateStatus':
        return { status: inputValue };
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
      case 'sendEmail':
        return {
          title: 'Send Email',
          description: `Send email to ${selectedCount} ${objectType.toLowerCase()}(s):`,
          confirmText: 'Send Email',
          confirmVariant: 'primary',
          showInput: true,
          inputType: 'email',
          icon: CheckCircle,
          iconColor: '#00A86B'
        };
      case 'addToList':
        return {
          title: 'Add to List',
          description: `Add ${selectedCount} ${objectType.toLowerCase()}(s) to a contact list:`,
          confirmText: 'Add to List',
          confirmVariant: 'primary',
          showInput: true,
          inputType: 'list',
          icon: CheckCircle,
          iconColor: '#00A86B'
        };
      case 'updateStage':
        return {
          title: 'Update Stage',
          description: `Update lifecycle stage for ${selectedCount} ${objectType.toLowerCase()}(s):`,
          confirmText: 'Update Stage',
          confirmVariant: 'primary',
          showInput: true,
          inputType: 'stage',
          icon: CheckCircle,
          iconColor: '#00A86B'
        };
      case 'updateStatus':
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
        case 'updateStatus':
        const statusOptions = objectType === 'Contact' || objectType === 'Lead' 
          ? ['New', 'Attempting', 'Connected', 'Qualified', 'Unqualified']
          : ['New', 'Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed'];
        return {
          title: 'Update Status',
          description: `Select new status for ${selectedCount} ${objectType.toLowerCase()}(s):`,
          confirmText: 'Update Status',
          confirmVariant: 'primary',
          showInput: true,
          inputType: 'select',
          inputOptions: statusOptions.map(s => ({ value: s, label: s })),
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

              {config.showInput && config.inputType === 'email' && (
                <div className="space-y-4">
                  <NeuroInput
                    label="Subject Line"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject..."
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                      Email Body
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="ampvibe-input w-full min-h-[200px]"
                      placeholder="Write your email... (Use {{first_name}}, {{last_name}}, {{company}} for personalization)"
                    />
                  </div>
                </div>
              )}

              {config.showInput && config.inputType === 'list' && (
                <NeuroSelect
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  options={lists.map(l => ({ value: l.id, label: l.list_name }))}
                  placeholder="Select a list..."
                />
              )}

              {config.showInput && config.inputType === 'stage' && (
                <NeuroSelect
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  options={
                    objectType === 'Deal' 
                      ? [
                          { value: 'Appointment Scheduled', label: 'Appointment Scheduled' },
                          { value: 'Qualified', label: 'Qualified' },
                          { value: 'Presentation Scheduled', label: 'Presentation Scheduled' },
                          { value: 'Decision Maker Bought-In', label: 'Decision Maker Bought-In' },
                          { value: 'Contract Sent', label: 'Contract Sent' },
                          { value: 'Closed Won', label: 'Closed Won' },
                          { value: 'Closed Lost', label: 'Closed Lost' }
                        ]
                      : [
                          { value: 'Subscriber', label: 'Subscriber' },
                          { value: 'Lead', label: 'Lead' },
                          { value: 'MQL', label: 'MQL' },
                          { value: 'SQL', label: 'SQL' },
                          { value: 'Opportunity', label: 'Opportunity' },
                          { value: 'Customer', label: 'Customer' }
                        ]
                  }
                  placeholder="Select stage..."
                />
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
                disabled={isProcessing || (config.showInput && config.inputType === 'select' && !inputValue) || 
                         (config.showInput && config.inputType === 'tags' && tags.length === 0) ||
                         (config.showInput && config.inputType === 'email' && (!emailSubject || !emailBody)) ||
                         (config.showInput && config.inputType === 'list' && !inputValue) ||
                         (config.showInput && config.inputType === 'stage' && !inputValue)}
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