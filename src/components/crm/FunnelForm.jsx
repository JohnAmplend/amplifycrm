import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical } from "lucide-react";
import NeuroButton from "./NeuroButton";
import NeuroInput from "./NeuroInput";
import NeuroSelect from "./NeuroSelect";

export default function FunnelForm({ funnel, onSave, onCancel }) {
  const [funnelData, setFunnelData] = useState({
    funnel_name: "",
    description: "",
    object_type: "Deal",
    is_default: false,
    is_active: true,
    color_scheme: "blue",
    ...funnel
  });

  const [stages, setStages] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const { data: existingStages = [] } = useQuery({
    queryKey: ['funnel_stages', funnel?.id],
    queryFn: () => base44.entities.FunnelStage.filter({ funnel_id: funnel.id }, 'stage_order'),
    enabled: !!funnel?.id
  });

  useEffect(() => {
    if (existingStages.length > 0) {
      setStages(existingStages);
    } else if (!funnel) {
      setStages([
        { stage_name: "New", stage_order: 0, probability: 10, stage_color: "#e3f2fd" },
        { stage_name: "Contacted", stage_order: 1, probability: 25, stage_color: "#bbdefb" },
        { stage_name: "Qualified", stage_order: 2, probability: 50, stage_color: "#90caf9" },
        { stage_name: "Proposal", stage_order: 3, probability: 75, stage_color: "#64b5f6" },
        { stage_name: "Won", stage_order: 4, probability: 100, is_winning_stage: true, stage_color: "#4caf50" }
      ]);
    }
  }, [existingStages, funnel]);

  const saveFunnelMutation = useMutation({
    mutationFn: async (data) => {
      if (funnel?.id) {
        return await base44.entities.FunnelDefinition.update(funnel.id, data);
      } else {
        return await base44.entities.FunnelDefinition.create(data);
      }
    }
  });

  const saveStagesMutation = useMutation({
    mutationFn: async ({ funnelId, stagesList }) => {
      if (funnel?.id) {
        const existingIds = existingStages.map(s => s.id);
        const deletePromises = existingIds.map(id => base44.entities.FunnelStage.delete(id));
        await Promise.all(deletePromises);
      }

      const createPromises = stagesList.map((stage, index) => 
        base44.entities.FunnelStage.create({
          funnel_id: funnelId,
          stage_name: stage.stage_name,
          stage_order: index,
          probability: stage.probability || 0,
          stage_color: stage.stage_color || "#e0e0e0",
          is_winning_stage: stage.is_winning_stage || false,
          is_losing_stage: stage.is_losing_stage || false
        })
      );

      return await Promise.all(createPromises);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const savedFunnel = await saveFunnelMutation.mutateAsync(funnelData);
      const funnelId = savedFunnel.id || funnel?.id;
      await saveStagesMutation.mutateAsync({ funnelId, stagesList: stages });
      onSave();
    } catch (error) {
      alert('Failed to save funnel: ' + error.message);
    }
  };

  const addStage = () => {
    setStages([...stages, {
      stage_name: "New Stage",
      stage_order: stages.length,
      probability: 0,
      stage_color: "#e0e0e0"
    }]);
  };

  const removeStage = (index) => {
    const newStages = stages.filter((_, i) => i !== index);
    setStages(newStages.map((stage, i) => ({ ...stage, stage_order: i })));
  };

  const updateStage = (index, field, value) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newStages = [...stages];
    const draggedItem = newStages[draggedIndex];
    newStages.splice(draggedIndex, 1);
    newStages.splice(index, 0, draggedItem);
    
    setStages(newStages.map((stage, i) => ({ ...stage, stage_order: i })));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Funnel Details */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg" style={{ color: "#666" }}>Funnel Details</h3>
        
        <NeuroInput
          label="Funnel Name"
          value={funnelData.funnel_name}
          onChange={(e) => setFunnelData({ ...funnelData, funnel_name: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
            Description
          </label>
          <textarea
            value={funnelData.description}
            onChange={(e) => setFunnelData({ ...funnelData, description: e.target.value })}
            className="ampvibe-input w-full min-h-[80px]"
            placeholder="Describe the purpose of this funnel..."
          />
        </div>

        <NeuroSelect
          label="Object Type"
          value={funnelData.object_type}
          onChange={(e) => setFunnelData({ ...funnelData, object_type: e.target.value })}
          options={[
            { value: "Deal", label: "Deal" },
            { value: "Lead", label: "Lead" },
            { value: "Contact", label: "Contact" },
            { value: "Opportunity", label: "Opportunity" }
          ]}
          required
        />

        <NeuroSelect
          label="Color Scheme"
          value={funnelData.color_scheme}
          onChange={(e) => setFunnelData({ ...funnelData, color_scheme: e.target.value })}
          options={[
            { value: "blue", label: "Blue" },
            { value: "green", label: "Green" },
            { value: "purple", label: "Purple" },
            { value: "orange", label: "Orange" },
            { value: "red", label: "Red" }
          ]}
        />

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={funnelData.is_active}
              onChange={(e) => setFunnelData({ ...funnelData, is_active: e.target.checked })}
              className="ampvibe-button"
            />
            <span style={{ color: "#666" }}>Active</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={funnelData.is_default}
              onChange={(e) => setFunnelData({ ...funnelData, is_default: e.target.checked })}
              className="ampvibe-button"
            />
            <span style={{ color: "#666" }}>Set as Default</span>
          </label>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg" style={{ color: "#666" }}>Funnel Stages</h3>
          <NeuroButton type="button" onClick={addStage}>
            <Plus className="w-4 h-4 mr-2" />
            Add Stage
          </NeuroButton>
        </div>

        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="ampvibe-inset p-4 rounded-lg cursor-move"
            >
              <div className="flex items-start gap-3">
                <GripVertical className="w-5 h-5 mt-2" style={{ color: "#888" }} />
                
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={stage.stage_name}
                      onChange={(e) => updateStage(index, 'stage_name', e.target.value)}
                      className="ampvibe-input"
                      placeholder="Stage name"
                    />
                    <input
                      type="color"
                      value={stage.stage_color || "#e0e0e0"}
                      onChange={(e) => updateStage(index, 'stage_color', e.target.value)}
                      className="ampvibe-input h-full"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs" style={{ color: "#888" }}>Probability %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={stage.probability || 0}
                        onChange={(e) => updateStage(index, 'probability', parseInt(e.target.value))}
                        className="ampvibe-input w-full"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stage.is_winning_stage || false}
                        onChange={(e) => updateStage(index, 'is_winning_stage', e.target.checked)}
                        className="ampvibe-button"
                      />
                      <span className="text-xs" style={{ color: "#666" }}>Win Stage</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stage.is_losing_stage || false}
                        onChange={(e) => updateStage(index, 'is_losing_stage', e.target.checked)}
                        className="ampvibe-button"
                      />
                      <span className="text-xs" style={{ color: "#666" }}>Loss Stage</span>
                    </label>
                  </div>
                </div>

                <NeuroButton type="button" onClick={() => removeStage(index)}>
                  <Trash2 className="w-4 h-4" />
                </NeuroButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <NeuroButton type="button" onClick={onCancel}>
          Cancel
        </NeuroButton>
        <NeuroButton type="submit" variant="primary">
          {funnel ? 'Update Funnel' : 'Create Funnel'}
        </NeuroButton>
      </div>
    </form>
  );
}