import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const stages = [
  "Appointment Scheduled",
  "Qualified",
  "Presentation Scheduled",
  "Decision Maker Bought-In",
  "Contract Sent",
  "Closed Won",
  "Closed Lost"
];

export default function DealKanban({ deals, onUpdateDeal, onClickDeal }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const deal = deals.find(d => d.id === result.draggableId);
    const newStage = stages[result.destination.droppableId];
    
    if (deal && deal.deal_stage !== newStage) {
      onUpdateDeal({ id: deal.id, data: { deal_stage: newStage } });
    }
  };

  const getDealsByStage = (stage) => {
    return deals.filter(d => d.deal_stage === stage);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage, index) => {
          const stageDeals = getDealsByStage(stage);
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.deal_amount || 0), 0);
          
          return (
            <Droppable key={stage} droppableId={index.toString()}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="neuro-card flex-shrink-0 w-80 p-4"
                  style={{
                    backgroundColor: snapshot.isDraggingOver ? "#d8d8d8" : "#e8e8e8"
                  }}
                >
                  <div className="mb-4">
                    <h3 className="font-bold mb-1" style={{ color: "#666" }}>
                      {stage}
                    </h3>
                    <p className="text-sm" style={{ color: "#aaa" }}>
                      {stageDeals.length} deals • ${stageValue.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="space-y-3 min-h-[200px]">
                    {stageDeals.map((deal, dealIndex) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={dealIndex}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onClickDeal(deal)}
                            className="neuro-inset p-4 rounded-lg cursor-pointer border-b"
                            style={{
                              ...provided.draggableProps.style,
                              backgroundColor: snapshot.isDragging ? "#d0d0d0" : "#e8e8e8",
                              borderBottomColor: "rgba(0, 0, 0, 0.1)"
                            }}
                          >
                            <p className="font-bold mb-2" style={{ color: "#666" }}>
                              {deal.deal_name}
                            </p>
                            <p className="text-lg font-bold mb-2" style={{ color: "#4a90e2" }}>
                              ${(deal.deal_amount || 0).toLocaleString()}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="neuro-button px-2 py-1">
                                {deal.deal_type}
                              </span>
                              {deal.close_date && (
                                <span style={{ color: "#aaa" }}>
                                  {new Date(deal.close_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {deal.priority === 'High' && (
                              <div className="mt-2">
                                <span className="neuro-button px-2 py-1 text-xs text-red-600">
                                  High Priority
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}