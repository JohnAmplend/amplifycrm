import React, { useState, useEffect } from "react";
import { Plus, ChevronDown, Edit2, Trash2, Save, X, Settings, Eye } from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function ViewManager({
  objectType = "Contact",
  currentView,
  onViewChange,
  onSaveView,
  onDeleteView,
  availableColumns,
  currentColumns,
  onColumnsChange
}) {
  const [views, setViews] = useState([]);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showCreateView, setShowCreateView] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [editingColumns, setEditingColumns] = useState([]);

  // Load views from localStorage
  useEffect(() => {
    const savedViews = localStorage.getItem(`crm_views_${objectType}`);
    if (savedViews) {
      setViews(JSON.parse(savedViews));
    } else {
      // Default view
      const defaultView = {
        id: "default",
        name: `All ${objectType}s`,
        isDefault: true,
        columns: availableColumns.filter(c => c.defaultVisible !== false).map(c => c.id)
      };
      setViews([defaultView]);
    }
  }, [objectType, availableColumns]);

  // Save views to localStorage
  const saveViewsToStorage = (newViews) => {
    localStorage.setItem(`crm_views_${objectType}`, JSON.stringify(newViews));
    setViews(newViews);
  };

  const handleCreateView = () => {
    if (!newViewName.trim()) return;

    const newView = {
      id: `view_${Date.now()}`,
      name: newViewName,
      isDefault: false,
      columns: currentColumns
    };

    const updatedViews = [...views, newView];
    saveViewsToStorage(updatedViews);
    onSaveView?.(newView);
    onViewChange(newView);
    setNewViewName("");
    setShowCreateView(false);
    setShowViewDropdown(false);
  };

  const handleDeleteView = (viewId) => {
    if (window.confirm("Are you sure you want to delete this view?")) {
      const updatedViews = views.filter(v => v.id !== viewId);
      saveViewsToStorage(updatedViews);
      onDeleteView?.(viewId);
      
      // Switch to default view if current view is deleted
      if (currentView?.id === viewId) {
        const defaultView = updatedViews.find(v => v.isDefault) || updatedViews[0];
        onViewChange(defaultView);
      }
    }
  };

  const handleUpdateView = () => {
    const updatedViews = views.map(v => 
      v.id === currentView?.id 
        ? { ...v, columns: currentColumns }
        : v
    );
    saveViewsToStorage(updatedViews);
    onSaveView?.(currentView);
  };

  const handleOpenColumnEditor = () => {
    setEditingColumns([...currentColumns]);
    setShowColumnEditor(true);
  };

  const handleSaveColumns = () => {
    onColumnsChange(editingColumns);
    setShowColumnEditor(false);
  };

  const toggleColumn = (columnId) => {
    if (editingColumns.includes(columnId)) {
      setEditingColumns(editingColumns.filter(id => id !== columnId));
    } else {
      setEditingColumns([...editingColumns, columnId]);
    }
  };

  const moveColumn = (columnId, direction) => {
    const index = editingColumns.indexOf(columnId);
    if (direction === 'up' && index > 0) {
      const newColumns = [...editingColumns];
      [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
      setEditingColumns(newColumns);
    } else if (direction === 'down' && index < editingColumns.length - 1) {
      const newColumns = [...editingColumns];
      [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
      setEditingColumns(newColumns);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* View Selector */}
      <div className="relative">
        <button
          onClick={() => setShowViewDropdown(!showViewDropdown)}
          className="ampvibe-button px-4 py-2 flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          <span>{currentView?.name || "All Contacts"}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {showViewDropdown && (
          <>
            <div 
              className="fixed inset-0" 
              style={{ zIndex: 99998 }}
              onClick={() => setShowViewDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-2 ampvibe-card shadow-xl min-w-[250px]" style={{ zIndex: 99999 }}>
              <div className="p-2">
                <p className="text-xs font-semibold px-3 py-2" style={{ color: "#888" }}>
                  MY VIEWS
                </p>
                {views.map(view => (
                  <div
                    key={view.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      currentView?.id === view.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      onViewChange(view);
                      setShowViewDropdown(false);
                    }}
                  >
                    <span style={{ color: "#666" }}>{view.name}</span>
                    {!view.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteView(view.id);
                        }}
                        className="opacity-0 hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
                
                <div className="border-t mt-2 pt-2" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                  <button
                    onClick={() => setShowCreateView(true)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    style={{ color: "#00A86B" }}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">Create new view</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Columns Button */}
      <NeuroButton onClick={handleOpenColumnEditor}>
        <Settings className="w-4 h-4 mr-2" />
        Edit columns
      </NeuroButton>

      {/* Save View Button (if view is modified) */}
      {currentView && !currentView.isDefault && (
        <NeuroButton onClick={handleUpdateView}>
          <Save className="w-4 h-4 mr-2" />
          Save view
        </NeuroButton>
      )}

      {/* Create View Modal */}
      {showCreateView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 100000 }}>
          <div className="ampvibe-card max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold" style={{ color: "#666" }}>
                  Create New View
                </h3>
                <button onClick={() => setShowCreateView(false)} className="ampvibe-button p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                  View Name
                </label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="e.g., My Active Contacts"
                  className="ampvibe-input w-full"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateView()}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <NeuroButton onClick={() => setShowCreateView(false)}>
                  Cancel
                </NeuroButton>
                <NeuroButton 
                  variant="primary" 
                  onClick={handleCreateView}
                  disabled={!newViewName.trim()}
                >
                  Create View
                </NeuroButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Editor Modal */}
      {showColumnEditor && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 999999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="ampvibe-card max-w-2xl w-full max-h-[90vh] flex flex-col bg-white" style={{ position: 'relative', zIndex: 1000000000 }}>
            <div className="p-6 border-b flex-shrink-0" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: "#666" }}>
                  Edit Columns
                </h3>
                <button onClick={() => setShowColumnEditor(false)} className="ampvibe-button p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm mt-2" style={{ color: "#888" }}>
                Select columns to display and reorder them
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Available Columns */}
                <div>
                  <h4 className="font-semibold mb-3" style={{ color: "#666" }}>
                    Available Columns
                  </h4>
                  <div className="space-y-2">
                    {availableColumns
                      .filter(col => !editingColumns.includes(col.id))
                      .map(column => (
                        <button
                          key={column.id}
                          onClick={() => toggleColumn(column.id)}
                          className="ampvibe-button w-full text-left px-3 py-2 flex items-center justify-between"
                        >
                          <span>{column.label}</span>
                          <Plus className="w-4 h-4" style={{ color: "#00A86B" }} />
                        </button>
                      ))}
                  </div>
                </div>

                {/* Selected Columns */}
                <div>
                  <h4 className="font-semibold mb-3" style={{ color: "#666" }}>
                    Selected Columns ({editingColumns.length})
                  </h4>
                  <div className="space-y-2">
                    {editingColumns.map((columnId, index) => {
                      const column = availableColumns.find(c => c.id === columnId);
                      if (!column) return null;
                      
                      return (
                        <div
                          key={columnId}
                          className="ampvibe-button px-3 py-2 flex items-center justify-between"
                        >
                          <span>{column.label}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveColumn(columnId, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                            >
                              <ChevronDown className="w-4 h-4 rotate-180" />
                            </button>
                            <button
                              onClick={() => moveColumn(columnId, 'down')}
                              disabled={index === editingColumns.length - 1}
                              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleColumn(columnId)}
                              className="p-1 hover:bg-red-50 rounded ml-2"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-2 flex-shrink-0 bg-white" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
              <NeuroButton onClick={() => setShowColumnEditor(false)}>
                Cancel
              </NeuroButton>
              <NeuroButton variant="primary" onClick={handleSaveColumns}>
                Apply Changes
              </NeuroButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}