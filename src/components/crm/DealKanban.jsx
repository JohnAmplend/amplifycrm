import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "../crm/useToast";
import { DollarSign, Calendar, User, TrendingUp, AlertCircle } from "lucide-react";

const STAGES = [
  { name: "Appointment Scheduled", color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)" },
  { name: "Qualified",              color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)" },
  { name: "Presentation Scheduled", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)" },
  { name: "Decision Maker Bought-In",color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
  { name: "Contract Sent",           color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)" },
  { name: "Closed Won",              color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.25)" },
  { name: "Closed Lost",             color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)" },
];

const PRIORITY_COLORS = {
  High:   { text: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  Medium: { text: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  Low:    { text: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

function DealCard({ deal, index, onClickDeal }) {
  const priorityStyle = PRIORITY_COLORS[deal.priority] || PRIORITY_COLORS.Low;
  const isOverdue = deal.close_date && new Date(deal.close_date) < new Date() && deal.deal_stage !== "Closed Won" && deal.deal_stage !== "Closed Lost";

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClickDeal(deal)}
          className="rounded-xl p-4 cursor-pointer select-none transition-all"
          style={{
            ...provided.draggableProps.style,
            background: snapshot.isDragging
              ? "rgba(255,255,255,1)"
              : "rgba(255,255,255,0.92)",
            border: snapshot.isDragging
              ? "2px solid rgba(0,168,107,0.5)"
              : "1px solid rgba(0,0,0,0.07)",
            boxShadow: snapshot.isDragging
              ? "0 12px 32px rgba(0,0,0,0.18)"
              : "0 2px 8px rgba(0,0,0,0.05)",
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(2deg)`
              : provided.draggableProps.style?.transform,
          }}
        >
          {/* Deal name */}
          <p className="font-semibold text-sm mb-2 leading-snug" style={{ color: "#333" }}>
            {deal.deal_name}
          </p>

          {/* Amount */}
          <div className="flex items-center gap-1.5 mb-3">
            <DollarSign className="w-3.5 h-3.5" style={{ color: "#00A86B" }} />
            <span className="text-base font-bold" style={{ color: "#00A86B" }}>
              {(deal.deal_amount || 0).toLocaleString()}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {deal.priority && (
              <span
                className="px-2 py-0.5 rounded-full font-medium"
                style={{ color: priorityStyle.text, background: priorityStyle.bg }}
              >
                {deal.priority}
              </span>
            )}
            {deal.probability != null && (
              <span className="flex items-center gap-1" style={{ color: "#888" }}>
                <TrendingUp className="w-3 h-3" />
                {deal.probability}%
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            {deal.deal_owner ? (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#999" }}>
                <User className="w-3 h-3" />
                {deal.deal_owner.split("@")[0]}
              </span>
            ) : <span />}
            {deal.close_date && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: isOverdue ? "#ef4444" : "#999" }}
              >
                {isOverdue && <AlertCircle className="w-3 h-3" />}
                <Calendar className="w-3 h-3" />
                {new Date(deal.close_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function DealKanban({ deals, onUpdateDeal, onClickDeal }) {
  const [draggingId, setDraggingId] = useState(null);

  const handleDragStart = (start) => setDraggingId(start.draggableId);

  const handleDragEnd = (result) => {
    setDraggingId(null);
    if (!result.destination) return;

    const destStageIndex = parseInt(result.destination.droppableId, 10);
    const newStage = STAGES[destStageIndex].name;
    const deal = deals.find(d => d.id === result.draggableId);

    if (deal && deal.deal_stage !== newStage) {
      onUpdateDeal({ id: deal.id, data: { deal_stage: newStage } });
      toast.success(`"${deal.deal_name}" moved to ${newStage}`);
    }
  };

  const getDealsByStage = (stageName) => deals.filter(d => d.deal_stage === stageName);

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: "70vh" }}>
        {STAGES.map((stage, index) => {
          const stageDeals = getDealsByStage(stage.name);
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.deal_amount || 0), 0);

          return (
            <div key={stage.name} className="flex-shrink-0 flex flex-col" style={{ width: "280px" }}>
              {/* Column header */}
              <div
                className="rounded-xl p-3 mb-3 flex items-center justify-between"
                style={{ background: stage.bg, border: `1px solid ${stage.border}` }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                    <h3 className="font-bold text-sm leading-tight" style={{ color: "#333" }}>
                      {stage.name}
                    </h3>
                  </div>
                  <p className="text-xs pl-4" style={{ color: "#888" }}>
                    {stageDeals.length} deal{stageDeals.length !== 1 ? "s" : ""} · ${stageValue.toLocaleString()}
                  </p>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: stage.color, color: "white", minWidth: "24px", textAlign: "center" }}
                >
                  {stageDeals.length}
                </span>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={index.toString()}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 rounded-xl p-2 space-y-2 transition-colors"
                    style={{
                      background: snapshot.isDraggingOver
                        ? stage.bg
                        : "rgba(248,250,252,0.6)",
                      border: snapshot.isDraggingOver
                        ? `2px dashed ${stage.color}`
                        : "2px dashed transparent",
                      minHeight: "200px",
                    }}
                  >
                    {stageDeals.map((deal, dealIndex) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        index={dealIndex}
                        onClickDeal={onClickDeal}
                      />
                    ))}
                    {provided.placeholder}
                    {stageDeals.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center h-24 rounded-lg" style={{ color: "#ccc" }}>
                        <p className="text-xs">Drop here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}