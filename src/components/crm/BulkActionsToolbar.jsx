import React from "react";
import { 
  Trash2, UserCog, Tag, Download, MoreHorizontal, 
  Mail, List, BarChart3, CheckSquare, Calendar,
  X, RotateCcw, AlertCircle, Sparkles, Clock
} from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function BulkActionsToolbar({ 
  selectedCount,
  objectType,
  onClearSelection,
  onDelete,
  onChangeOwner,
  onAddTags,
  onRemoveTags,
  onExport,
  onSendEmail,
  onAddToList,
  onUpdateStage,
  onUpdateStatus,
  onMarkComplete,
  onChangeDueDate,
  onUpdatePriority,
  onUndo,
  undoTimeRemaining,
  onSmartSelection,
  onViewHistory,
  customActions = []
}) {
  if (selectedCount === 0) return null;

  const renderObjectSpecificActions = () => {
    switch (objectType) {
      case 'Contact':
      case 'Lead':
        return (
          <>
            {onSendEmail && (
              <NeuroButton onClick={onSendEmail} size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </NeuroButton>
            )}
            {onAddToList && (
              <NeuroButton onClick={onAddToList} size="sm">
                <List className="w-4 h-4 mr-2" />
                Add to List
              </NeuroButton>
            )}
            {onUpdateStage && (
              <NeuroButton onClick={onUpdateStage} size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Update Stage
              </NeuroButton>
            )}
            {onUpdateStatus && (
              <NeuroButton onClick={onUpdateStatus} size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Update Status
              </NeuroButton>
            )}
          </>
        );
      
      case 'Task':
        return (
          <>
            {onMarkComplete && (
              <NeuroButton onClick={onMarkComplete} size="sm">
                <CheckSquare className="w-4 h-4 mr-2" />
                Mark Complete
              </NeuroButton>
            )}
            {onChangeDueDate && (
              <NeuroButton onClick={onChangeDueDate} size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Change Due Date
              </NeuroButton>
            )}
            {onUpdatePriority && (
              <NeuroButton onClick={onUpdatePriority} size="sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                Update Priority
              </NeuroButton>
            )}
          </>
        );
      
      case 'Deal':
        return (
          <>
            {onUpdateStage && (
              <NeuroButton onClick={onUpdateStage} size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Update Stage
              </NeuroButton>
            )}
            {onUpdatePriority && (
              <NeuroButton onClick={onUpdatePriority} size="sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                Update Priority
              </NeuroButton>
            )}
          </>
        );
      
      case 'Ticket':
        return (
          <>
            {onUpdateStatus && (
              <NeuroButton onClick={onUpdateStatus} size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Update Status
              </NeuroButton>
            )}
            {onUpdatePriority && (
              <NeuroButton onClick={onUpdatePriority} size="sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                Update Priority
              </NeuroButton>
            )}
          </>
        );
      
      case 'Company':
        return (
          <>
            {onUpdateStage && (
              <NeuroButton onClick={onUpdateStage} size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Update Stage
              </NeuroButton>
            )}
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className="ampvibe-card sticky top-0 z-40 mb-4 animate-slide-down"
      style={{
        boxShadow: '0 4px 16px rgba(30, 58, 138, 0.15)'
      }}
    >
      <div className="p-3 md:p-4 flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3">
        {/* Left: Selection Info */}
        <div className="flex items-center justify-between md:justify-start gap-3 md:mr-auto">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00A86B 0%, #00C87A 100%)' }}
            >
              <span className="text-white text-xs font-bold">{selectedCount}</span>
            </div>
            <span className="font-medium text-sm md:text-base" style={{ color: "#666" }}>
              {selectedCount} {objectType?.toLowerCase() || 'item'}{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          <button
            onClick={onClearSelection}
            className="text-xs md:text-sm underline hover:opacity-70 transition-opacity md:block"
            style={{ color: "#666" }}
          >
            Clear
          </button>
        </div>

        {/* Center: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Universal Actions */}
          {onDelete && (
            <NeuroButton onClick={onDelete} size="sm" className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </NeuroButton>
          )}

          {onChangeOwner && (
            <NeuroButton onClick={onChangeOwner} size="sm">
              <UserCog className="w-4 h-4 mr-2" />
              Change Owner
            </NeuroButton>
          )}

          {onAddTags && (
            <NeuroButton onClick={onAddTags} size="sm">
              <Tag className="w-4 h-4 mr-2" />
              Add Tags
            </NeuroButton>
          )}

          {onRemoveTags && (
            <NeuroButton onClick={onRemoveTags} size="sm">
              <Tag className="w-4 h-4 mr-2" />
              Remove Tags
            </NeuroButton>
          )}

          {onExport && (
            <NeuroButton onClick={onExport} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </NeuroButton>
          )}

          {/* Object-Specific Actions */}
          {renderObjectSpecificActions()}

          {/* Custom Actions */}
          {customActions.map((action, index) => (
            <NeuroButton key={index} onClick={action.onClick} size="sm">
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </NeuroButton>
          ))}

          {/* Smart Selection */}
          {onSmartSelection && (
            <NeuroButton onClick={onSmartSelection} size="sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Smart Select
            </NeuroButton>
          )}
        </div>

        {/* Right: Undo & History Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {onViewHistory && (
            <NeuroButton onClick={onViewHistory} size="sm" className="md:flex hidden">
              <Clock className="w-4 h-4" />
            </NeuroButton>
          )}

          {onUndo && undoTimeRemaining > 0 && (
            <NeuroButton onClick={onUndo} size="sm">
              <RotateCcw className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">
                Undo ({Math.floor(undoTimeRemaining / 60)}:{String(undoTimeRemaining % 60).padStart(2, '0')})
              </span>
            </NeuroButton>
          )}

          {/* Close Button - Desktop only */}
          <button
            onClick={onClearSelection}
            className="ampvibe-button p-2 hidden md:block"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}