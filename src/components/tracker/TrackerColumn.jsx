import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal, Trash2, Edit2, Sparkles } from "lucide-react";
import TrackerCard from "./TrackerCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const columnColors = {
  "#FEF3C7": "bg-amber-100", // Yellow/Gold
  "#DCFCE7": "bg-green-100", // Green
  "#FEE2E2": "bg-red-100", // Red
  "#DBEAFE": "bg-blue-100", // Blue
  "#F3E8FF": "bg-purple-100", // Purple
};

export default function TrackerColumn({ 
  column, 
  cards, 
  onAddCard, 
  onEditCard, 
  onDeleteCard,
  onEditColumn,
  onDeleteColumn 
}) {
  const bgColor = column.color ? columnColors[column.color] || "bg-gray-100" : "bg-gray-100";

  return (
    <div 
      className={`flex-shrink-0 w-72 rounded-xl ${bgColor} flex flex-col max-h-[calc(100vh-200px)]`}
      style={{ backgroundColor: column.color || undefined }}
    >
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-700 text-sm">
            {column.title}
          </h3>
          <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600">
            {cards.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-white/50 rounded transition-colors">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditColumn(column)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Column
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteColumn(column.id)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Add Card Button */}
      <div className="px-3 pb-2">
        <button
          onClick={() => onAddCard(column.id)}
          className="w-full flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm p-2 rounded-lg hover:bg-white/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add a card
        </button>
      </div>

      {/* Cards Container */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-3 pb-3 min-h-[100px] transition-colors rounded-b-xl ${
              snapshot.isDraggingOver ? "bg-white/30" : ""
            }`}
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="group"
                  >
                    <TrackerCard
                      card={card}
                      onEdit={onEditCard}
                      onDelete={onDeleteCard}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}