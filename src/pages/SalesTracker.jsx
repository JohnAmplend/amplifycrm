import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { Plus, LayoutGrid, List, Filter, Search, Settings } from "lucide-react";
import TrackerColumn from "../components/tracker/TrackerColumn";
import CardFormModal from "../components/tracker/CardFormModal";
import ColumnFormModal from "../components/tracker/ColumnFormModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SalesTracker() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [cardModal, setCardModal] = useState({ isOpen: false, card: null, columnId: null });
  const [columnModal, setColumnModal] = useState({ isOpen: false, column: null });

  // Fetch columns
  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ['tracker-columns'],
    queryFn: () => base44.entities.Tracker_Column.list('position')
  });

  // Fetch cards
  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['tracker-cards'],
    queryFn: () => base44.entities.Tracker_Card.list('position')
  });

  // Initialize default columns if none exist
  useEffect(() => {
    if (!columnsLoading && columns.length === 0) {
      const defaultColumns = [
        { title: "Backlog – Tasks not started", color: "#FEF3C7", position: 0 },
        { title: "In Progress", color: "#DCFCE7", position: 1 },
        { title: "For Approval", color: "#FEE2E2", position: 2 },
        { title: "Completed/ Done", color: "#DBEAFE", position: 3 },
        { title: "Reference / Resources", color: "#F3E8FF", position: 4 }
      ];
      defaultColumns.forEach(col => {
        base44.entities.Tracker_Column.create(col);
      });
      queryClient.invalidateQueries({ queryKey: ['tracker-columns'] });
    }
  }, [columnsLoading, columns]);

  // Mutations
  const createCardMutation = useMutation({
    mutationFn: (data) => base44.entities.Tracker_Card.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-cards'] })
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tracker_Card.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-cards'] })
  });

  const deleteCardMutation = useMutation({
    mutationFn: (id) => base44.entities.Tracker_Card.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-cards'] })
  });

  const createColumnMutation = useMutation({
    mutationFn: (data) => base44.entities.Tracker_Column.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-columns'] })
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tracker_Column.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-columns'] })
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (id) => base44.entities.Tracker_Column.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-columns'] })
  });

  // Handle drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId !== destination.droppableId) {
      // Card moved to different column
      updateCardMutation.mutate({
        id: draggableId,
        data: {
          column_id: destination.droppableId,
          position: destination.index
        }
      });
    } else if (source.index !== destination.index) {
      // Card reordered within same column
      updateCardMutation.mutate({
        id: draggableId,
        data: { position: destination.index }
      });
    }
  };

  // Card handlers
  const handleAddCard = (columnId) => {
    setCardModal({ isOpen: true, card: null, columnId });
  };

  const handleEditCard = (card) => {
    setCardModal({ isOpen: true, card, columnId: card.column_id });
  };

  const handleSaveCard = (formData) => {
    if (formData.id) {
      updateCardMutation.mutate({ id: formData.id, data: formData });
    } else {
      const columnId = formData.column_id || cardModal.columnId;
      const columnCards = cards.filter(c => c.column_id === columnId);
      createCardMutation.mutate({
        ...formData,
        column_id: columnId,
        position: columnCards.length
      });
    }
    setCardModal({ isOpen: false, card: null, columnId: null });
  };

  const handleDeleteCard = (cardId) => {
    deleteCardMutation.mutate(cardId);
  };

  // Column handlers
  const handleAddColumn = () => {
    setColumnModal({ isOpen: true, column: null });
  };

  const handleEditColumn = (column) => {
    setColumnModal({ isOpen: true, column });
  };

  const handleSaveColumn = (formData) => {
    if (formData.id) {
      updateColumnMutation.mutate({ id: formData.id, data: formData });
    } else {
      createColumnMutation.mutate({
        ...formData,
        position: columns.length
      });
    }
    setColumnModal({ isOpen: false, column: null });
  };

  const handleDeleteColumn = (columnId) => {
    // Delete all cards in the column first
    const columnCards = cards.filter(c => c.column_id === columnId);
    columnCards.forEach(card => deleteCardMutation.mutate(card.id));
    deleteColumnMutation.mutate(columnId);
  };

  // Filter cards by search term
  const filteredCards = cards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get cards for a specific column
  const getColumnCards = (columnId) => {
    return filteredCards
      .filter(card => card.column_id === columnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  if (columnsLoading || cardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #0891b2 100%)'
      }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #0891b2 100%)'
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Amplend Sales Team Tracker
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/90 border-0 w-64"
            />
          </div>

          {/* Add Column Button */}
          <Button
            onClick={handleAddColumn}
            className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add another list
          </Button>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="px-4 pb-4 flex gap-4 overflow-x-auto">
          {columns
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map((column) => (
              <TrackerColumn
                key={column.id}
                column={column}
                cards={getColumnCards(column.id)}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onEditColumn={handleEditColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

          {/* Add Column Placeholder */}
          <div 
            onClick={handleAddColumn}
            className="flex-shrink-0 w-72 h-12 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-colors backdrop-blur-sm"
          >
            <Plus className="w-5 h-5 text-white mr-2" />
            <span className="text-white font-medium">Add another list</span>
          </div>
        </div>
      </DragDropContext>

      {/* Bottom Navigation */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <div className="bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
          <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-full flex items-center gap-2">
            <List className="w-4 h-4" />
            Inbox
          </button>
          <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-full flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            Planner
          </button>
          <button className="px-4 py-2 text-sm bg-blue-100 text-blue-600 rounded-full flex items-center gap-2 font-medium">
            <LayoutGrid className="w-4 h-4" />
            Board
          </button>
          <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-full flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Switch boards
          </button>
        </div>
      </div>

      {/* Modals */}
      <CardFormModal
        isOpen={cardModal.isOpen}
        onClose={() => setCardModal({ isOpen: false, card: null, columnId: null })}
        onSave={handleSaveCard}
        card={cardModal.card}
        columns={columns}
      />

      <ColumnFormModal
        isOpen={columnModal.isOpen}
        onClose={() => setColumnModal({ isOpen: false, column: null })}
        onSave={handleSaveColumn}
        column={columnModal.column}
      />
    </div>
  );
}