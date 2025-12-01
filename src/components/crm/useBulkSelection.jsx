import { useState, useCallback, useEffect } from 'react';

export default function useBulkSelection(items = [], itemKey = 'id', persistenceKey = null) {
  const [selectedIds, setSelectedIds] = useState(() => {
    if (persistenceKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`bulk-selection-${persistenceKey}`);
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch (e) {
          return new Set();
        }
      }
    }
    return new Set();
  });
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

  // Persist selection
  useEffect(() => {
    if (persistenceKey && typeof window !== 'undefined') {
      localStorage.setItem(`bulk-selection-${persistenceKey}`, JSON.stringify(Array.from(selectedIds)));
    }
  }, [selectedIds, persistenceKey]);

  // Clear invalid selections when items change
  useEffect(() => {
    const validIds = new Set(items.map(item => item[itemKey]));
    setSelectedIds(prev => {
      const filtered = new Set([...prev].filter(id => validIds.has(id)));
      return filtered.size === prev.size ? prev : filtered;
    });
  }, [items, itemKey]);

  const isSelected = useCallback((id) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const toggleSelection = useCallback((id, index = null, event = null) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      
      // Handle Shift+Click for range selection
      if (event?.shiftKey && lastSelectedIndex !== null && index !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        
        for (let i = start; i <= end; i++) {
          if (items[i]) {
            newSet.add(items[i][itemKey]);
          }
        }
      } else {
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      }
      
      if (index !== null) {
        setLastSelectedIndex(index);
      }
      
      return newSet;
    });
  }, [items, itemKey, lastSelectedIndex]);

  const selectAll = useCallback(() => {
    const newSet = new Set(items.map(item => item[itemKey]));
    setSelectedIds(newSet);
  }, [items, itemKey]);

  const selectAllAcrossPages = useCallback(() => {
    setSelectAllMode(true);
    selectAll();
  }, [selectAll]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectAllMode(false);
    setLastSelectedIndex(null);
  }, []);

  const getSelectedCount = useCallback(() => {
    return selectedIds.size;
  }, [selectedIds]);

  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedIds.has(item[itemKey]));
  }, [items, selectedIds, itemKey]);

  const areAllSelected = useCallback(() => {
    if (items.length === 0) return false;
    return items.every(item => selectedIds.has(item[itemKey]));
  }, [items, selectedIds, itemKey]);

  const areSomeSelected = useCallback(() => {
    if (items.length === 0) return false;
    return items.some(item => selectedIds.has(item[itemKey])) && !areAllSelected();
  }, [items, selectedIds, itemKey, areAllSelected]);

  const toggleSelectAll = useCallback(() => {
    if (areAllSelected()) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [areAllSelected, clearSelection, selectAll]);

  return {
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    selectAllAcrossPages,
    clearSelection,
    getSelectedCount,
    getSelectedItems,
    areAllSelected,
    areSomeSelected,
    toggleSelectAll,
    selectAllMode,
    setSelectAllMode
  };
}