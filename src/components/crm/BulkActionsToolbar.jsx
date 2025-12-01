import React from "react";
import { 
  Trash2, UserCog, Tag, Download, MoreHorizontal, 
  Mail, List, BarChart3, CheckSquare, Calendar,
  X, RotateCcw, AlertCircle
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
      <div className="p-4 flex flex-wrap items-center gap-3">
        {/* Left: Selection Info */}
        <div className="flex items-center gap-3 mr-auto">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00A86B 0%, #00C87A 100%)' }}
            >
              <span className="text-white text-xs font-bold">{selectedCount}</span>
            </div>
            <span className="font-medium" style={{ color: "#666" }}>
              {selectedCount} {objectType?.toLowerCase() || 'item'}{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          <button
            onClick={onClearSelection}
            className="text-sm underline hover:opacity-70 transition-opacity"
            style={{ color: "#666" }}
          >
            Clear Selection
          </button>
        </div>

        {/* Center: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
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

          {/* More Actions */}
          <NeuroButton size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </NeuroButton>
        </div>

        {/* Right: Undo Button */}
        {onUndo && undoTimeRemaining > 0 && (
          <NeuroButton onClick={onUndo} size="sm" className="ml-2">
            <RotateCcw className="w-4 h-4 mr-2" />
            Undo ({Math.floor(undoTimeRemaining / 60)}:{String(undoTimeRemaining % 60).padStart(2, '0')})
          </NeuroButton>
        )}

        {/* Close Button */}
        <button
          onClick={onClearSelection}
          className="ampvibe-button p-2 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
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