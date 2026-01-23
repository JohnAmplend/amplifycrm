import React, { useState } from "react";
import { X, Download } from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function ExportModal({
  isOpen,
  onClose,
  onExport,
  availableFields,
  defaultFields,
  totalCount,
  selectedCount = 0,
  objectType = "records",
  allItems = [],
  selectedItems = []
}) {
  const [exportFields, setExportFields] = useState(defaultFields);
  const [selectedItemsToExport, setSelectedItemsToExport] = useState([]);
  const [exportMode, setExportMode] = useState('all'); // 'all' or 'custom'

  if (!isOpen) return null;

  const toggleExportField = (fieldId) => {
    if (exportFields.includes(fieldId)) {
      setExportFields(exportFields.filter(f => f !== fieldId));
    } else {
      setExportFields([...exportFields, fieldId]);
    }
  };

  const handleExport = (exportType) => {
    if (exportMode === 'custom') {
      onExport('custom', exportFields, selectedItemsToExport);
    } else {
      onExport(exportType, exportFields);
    }
  };

  const toggleItemSelection = (itemId) => {
    if (selectedItemsToExport.includes(itemId)) {
      setSelectedItemsToExport(selectedItemsToExport.filter(id => id !== itemId));
    } else {
      setSelectedItemsToExport([...selectedItemsToExport, itemId]);
    }
  };

  const selectAllItems = () => {
    setSelectedItemsToExport(allItems.map(item => item.id));
  };

  const deselectAllItems = () => {
    setSelectedItemsToExport([]);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black" 
        style={{ zIndex: 9998, opacity: 0.6 }}
        onClick={onClose}
      />
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" 
        style={{ zIndex: 9999 }}
      >
        <div className="ampvibe-card max-w-2xl w-full pointer-events-auto bg-white shadow-2xl max-h-[85vh] flex flex-col">
          <div className="p-6 border-b flex-shrink-0" style={{ borderColor: "#e0e0e0" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold" style={{ color: "#666" }}>
                Export {objectType}
              </h3>
              <button onClick={onClose} className="ampvibe-button p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="mb-6">
              <h4 className="font-bold mb-3" style={{ color: "#666" }}>Select Fields to Export</h4>
              <div className="flex items-center gap-2 mb-3">
                <NeuroButton 
                  onClick={() => setExportFields(availableFields.map(f => f.id))}
                  size="sm"
                >
                  Select All
                </NeuroButton>
                <NeuroButton 
                  onClick={() => setExportFields([])}
                  size="sm"
                >
                  Clear All
                </NeuroButton>
                <span className="text-sm ml-2" style={{ color: "#888" }}>
                  ({exportFields.length} selected)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto ampvibe-inset p-4 rounded-lg">
                {availableFields.map(field => (
                  <label key={field.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={exportFields.includes(field.id)}
                      onChange={() => toggleExportField(field.id)}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: "#00A86B" }}
                    />
                    <span className="text-sm" style={{ color: "#666" }}>{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: "#e0e0e0" }}>
              <h4 className="font-bold mb-3" style={{ color: "#666" }}>Export Options</h4>
              <div className="space-y-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportMode"
                    checked={exportMode === 'all'}
                    onChange={() => setExportMode('all')}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: "#00A86B" }}
                  />
                  <span className="text-sm font-medium" style={{ color: "#666" }}>Export All ({totalCount})</span>
                </label>
                
                {selectedCount > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                    <input
                      type="radio"
                      name="exportMode"
                      checked={exportMode === 'selected'}
                      onChange={() => setExportMode('selected')}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: "#00A86B" }}
                    />
                    <span className="text-sm font-medium" style={{ color: "#666" }}>Export Pre-Selected ({selectedCount})</span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportMode"
                    checked={exportMode === 'custom'}
                    onChange={() => setExportMode('custom')}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: "#00A86B" }}
                  />
                  <span className="text-sm font-medium" style={{ color: "#666" }}>Choose Specific Items</span>
                </label>
              </div>

              {exportMode === 'custom' && (
                <div className="mb-4 ampvibe-inset p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <NeuroButton onClick={selectAllItems} size="sm">
                      Select All
                    </NeuroButton>
                    <NeuroButton onClick={deselectAllItems} size="sm">
                      Deselect All
                    </NeuroButton>
                    <span className="text-sm ml-2" style={{ color: "#888" }}>
                      ({selectedItemsToExport.length} selected)
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {allItems.map(item => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedItemsToExport.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="w-4 h-4 cursor-pointer"
                          style={{ accentColor: "#00A86B" }}
                        />
                        <span className="text-sm truncate" style={{ color: "#666" }}>
                          {item.first_name || item.company_name || item.deal_name || item.task_name || item.title || item.email || 'Unnamed'}
                          {item.last_name && ` ${item.last_name}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <NeuroButton 
                onClick={() => exportMode === 'all' ? handleExport('all') : exportMode === 'selected' ? handleExport('selected') : handleExport('custom')}
                className="w-full justify-between"
                variant="primary"
                disabled={exportFields.length === 0 || (exportMode === 'custom' && selectedItemsToExport.length === 0)}
              >
                <span>
                  Export {exportMode === 'all' ? `All (${totalCount})` : exportMode === 'selected' ? `Selected (${selectedCount})` : `Custom (${selectedItemsToExport.length})`} {objectType}
                </span>
                <Download className="w-4 h-4" />
              </NeuroButton>
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-2 flex-shrink-0" style={{ borderColor: "#e0e0e0" }}>
            <NeuroButton onClick={onClose}>
              Cancel
            </NeuroButton>
          </div>
        </div>
      </div>
    </>
  );
}