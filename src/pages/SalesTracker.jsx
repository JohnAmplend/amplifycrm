import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { Plus, LayoutGrid, List, Filter, Search, Settings, BarChart } from "lucide-react";
import TrackerColumn from "../components/tracker/TrackerColumn";
import CardFormModal from "../components/tracker/CardFormModal";
import ColumnFormModal from "../components/tracker/ColumnFormModal";
import TrackerFilters from "../components/tracker/TrackerFilters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SalesTracker() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [cardModal, setCardModal] = useState({ isOpen: false, card: null, columnId: null });
  const [columnModal, setColumnModal] = useState({ isOpen: false, column: null });
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const [showBoardSwitcher, setShowBoardSwitcher] = useState(false);
  const [viewMode, setViewMode] = useState("board"); // "board" or "list"
  const [hasInitialized, setHasInitialized] = useState(false);
  const [filters, setFilters] = useState({
    priority: "all",
    status: "all",
    assignee: "all",
    collaborator: "all",
    startDate: "",
    endDate: ""
  });

  // Fetch boards
  const { data: boards = [], isLoading: boardsLoading } = useQuery({
    queryKey: ['tracker-boards'],
    queryFn: () => base44.entities.Tracker_Board.list('position')
  });

  // Set current board on load
  useEffect(() => {
    if (boards.length > 0 && !currentBoardId) {
      const defaultBoard = boards.find(b => b.is_default) || boards[0];
      setCurrentBoardId(defaultBoard.id);
    }
  }, [boards, currentBoardId]);

  // Fetch columns for current board
  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ['tracker-columns', currentBoardId],
    queryFn: () => currentBoardId ? base44.entities.Tracker_Column.filter({ board_id: currentBoardId }, 'position') : [],
    enabled: !!currentBoardId
  });

  // Fetch cards
  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['tracker-cards'],
    queryFn: () => base44.entities.Tracker_Card.list('position')
  });

  // Initialize default board and columns if none exist (only once)
  useEffect(() => {
    if (!boardsLoading && boards.length === 0 && !hasInitialized) {
      setHasInitialized(true);
      base44.entities.Tracker_Board.create({
        name: "Tracker",
        description: "Main tracking board",
        is_default: true,
        position: 0
      }).then((board) => {
        setCurrentBoardId(board.id);
        const defaultColumns = [
          { board_id: board.id, title: "Backlog – Tasks not started", color: "#FEF3C7", position: 0 },
          { board_id: board.id, title: "In Progress", color: "#DCFCE7", position: 1 },
          { board_id: board.id, title: "For Approval", color: "#FEE2E2", position: 2 },
          { board_id: board.id, title: "Completed/ Done", color: "#DBEAFE", position: 3 },
          { board_id: board.id, title: "Reference / Resources", color: "#F3E8FF", position: 4 }
        ];
        defaultColumns.forEach(col => {
          base44.entities.Tracker_Column.create(col);
        });
        queryClient.invalidateQueries({ queryKey: ['tracker-boards'] });
        queryClient.invalidateQueries({ queryKey: ['tracker-columns', board.id] });
      });
    }
  }, [boardsLoading, boards, hasInitialized]);

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

  const createBoardMutation = useMutation({
    mutationFn: (data) => base44.entities.Tracker_Board.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-boards'] })
  });

  const createColumnMutation = useMutation({
    mutationFn: (data) => base44.entities.Tracker_Column.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-columns', currentBoardId] })
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tracker_Column.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-columns', currentBoardId] })
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (id) => base44.entities.Tracker_Column.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker-columns', currentBoardId] })
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

  const handleSaveCard = async (formData) => {
    if (formData.id) {
      updateCardMutation.mutate({ id: formData.id, data: formData });
      // Notify on update
      try {
        await base44.functions.invoke('notifyTaskAssignees', {
          card_id: formData.id,
          card_title: formData.title,
          action: 'updated'
        });
      } catch (error) {
        console.error('Failed to send notifications:', error);
      }
    } else {
      const columnId = formData.column_id || cardModal.columnId;
      const columnCards = cards.filter(c => c.column_id === columnId);
      const newCard = await createCardMutation.mutateAsync({
        ...formData,
        column_id: columnId,
        position: columnCards.length
      });
      // Notify on creation
      try {
        await base44.functions.invoke('notifyTaskAssignees', {
          card_id: newCard.id,
          card_title: formData.title,
          action: 'created'
        });
      } catch (error) {
        console.error('Failed to send notifications:', error);
      }
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
        board_id: currentBoardId,
        position: columns.length
      });
    }
    setColumnModal({ isOpen: false, column: null });
  };

  const handleCreateBoard = () => {
    const boardName = prompt("Enter board name:");
    if (!boardName) return;
    createBoardMutation.mutate({
      name: boardName,
      position: boards.length
    });
  };

  const handleSwitchBoard = (boardId) => {
    setCurrentBoardId(boardId);
    setShowBoardSwitcher(false);
  };

  const currentBoard = boards.find(b => b.id === currentBoardId);

  const handleDeleteColumn = (columnId) => {
    // Delete all cards in the column first
    const columnCards = cards.filter(c => c.column_id === columnId);
    columnCards.forEach(card => deleteCardMutation.mutate(card.id));
    deleteColumnMutation.mutate(columnId);
  };

  // Filter cards by search term and advanced filters
  const filteredCards = cards.filter(card => {
    // Search in title and description
    const searchMatch = 
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.description && card.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!searchMatch) return false;

    // Priority filter
    if (filters.priority !== "all" && card.priority !== filters.priority) return false;

    // Status filter
    if (filters.status !== "all" && card.status !== filters.status) return false;

    // Assignee filter
    if (filters.assignee !== "all") {
      if (filters.assignee === "unassigned" && card.assigned_to) return false;
      if (filters.assignee !== "unassigned" && card.assigned_to !== filters.assignee) return false;
    }

    // Collaborator filter
    if (filters.collaborator !== "all") {
      if (!card.collaborators || !card.collaborators.includes(filters.collaborator)) return false;
    }

    // Date range filters
    if (filters.startDate && card.start_date) {
      if (new Date(card.start_date) < new Date(filters.startDate)) return false;
    }
    if (filters.endDate && card.end_date) {
      if (new Date(card.end_date) > new Date(filters.endDate)) return false;
    }

    return true;
  });

  // Get cards for a specific column
  const getColumnCards = (columnId) => {
    return filteredCards
      .filter(card => card.column_id === columnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  if (boardsLoading || columnsLoading || cardsLoading) {
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
        background: currentBoard?.background_color || 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #0891b2 100%)'
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            {currentBoard?.name || "Tracker"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search in titles and descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/90 border-0 w-80"
            />
          </div>

          {/* Advanced Filters */}
          <TrackerFilters onFilterChange={setFilters} currentFilters={filters} />

          {/* Reports Link */}
          <Link to={createPageUrl("TrackerReports")}>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
              <BarChart className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </Link>

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

      {/* Board or List View */}
      {viewMode === "board" ? (
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
      ) : (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-lg p-4">
            <h2 className="text-lg font-bold mb-4">List View</h2>
            <div className="space-y-2">
              {cards.map((card) => {
                const column = columns.find(c => c.id === card.column_id);
                return (
                  <div key={card.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer" onClick={() => handleEditCard(card)}>
                    <span className="font-medium flex-1">{card.title}</span>
                    <span className="text-sm text-gray-600">{column?.title}</span>
                    <span className={`text-xs px-2 py-1 rounded ${card.priority === 'High' || card.priority === 'Highest' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                      {card.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${card.status === 'Done' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {card.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
          <button 
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 text-sm rounded-full flex items-center gap-2 ${viewMode === "list" ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button 
            onClick={() => setViewMode("board")}
            className={`px-4 py-2 text-sm rounded-full flex items-center gap-2 ${viewMode === "board" ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            Board
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowBoardSwitcher(!showBoardSwitcher)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-full flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Boards
            </button>
            {showBoardSwitcher && (
              <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-xl p-2 min-w-[200px] z-[1000]">
                <div className="max-h-[300px] overflow-y-auto">
                  {boards.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => handleSwitchBoard(board.id)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm ${board.id === currentBoardId ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                    >
                      {board.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCreateBoard}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm text-blue-600 font-medium border-t border-gray-200 mt-2 pt-2"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Create new board
                </button>
              </div>
            )}
          </div>
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