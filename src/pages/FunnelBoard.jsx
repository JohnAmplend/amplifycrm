import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Filter, Search, TrendingUp, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import FunnelKanban from "../components/crm/FunnelKanban";

export default function FunnelBoard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [funnelId, setFunnelId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOwner, setFilterOwner] = useState("all");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setFunnelId(urlParams.get('funnelId'));
  }, []);

  const { data: funnel, isLoading: loadingFunnel } = useQuery({
    queryKey: ['funnel', funnelId],
    queryFn: () => base44.entities.FunnelDefinition.filter({ id: funnelId }),
    enabled: !!funnelId,
    select: (data) => data[0]
  });

  const { data: stages = [], isLoading: loadingStages } = useQuery({
    queryKey: ['funnel_stages', funnelId],
    queryFn: () => base44.entities.FunnelStage.filter({ funnel_id: funnelId }, 'stage_order'),
    enabled: !!funnelId
  });

  const { data: records = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['funnel_records', funnel?.object_type],
    queryFn: async () => {
      if (funnel?.object_type === 'Deal') {
        return await base44.entities.Deal.list();
      } else if (funnel?.object_type === 'Lead') {
        return await base44.entities.Lead.list();
      } else if (funnel?.object_type === 'Contact') {
        return await base44.entities.Contact.list();
      }
      return [];
    },
    enabled: !!funnel?.object_type
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const updateRecordMutation = useMutation({
    mutationFn: async ({ recordId, stageValue }) => {
      if (funnel.object_type === 'Deal') {
        return await base44.entities.Deal.update(recordId, { deal_stage: stageValue });
      } else if (funnel.object_type === 'Lead') {
        return await base44.entities.Lead.update(recordId, { lead_status: stageValue });
      } else if (funnel.object_type === 'Contact') {
        return await base44.entities.Contact.update(recordId, { lifecycle_stage: stageValue });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['funnel_records']);
    }
  });

  const handleStageChange = async (recordId, newStage) => {
    await updateRecordMutation.mutateAsync({ recordId, stageValue: newStage });
  };

  const getRecordStage = (record) => {
    if (funnel?.object_type === 'Deal') return record.deal_stage;
    if (funnel?.object_type === 'Lead') return record.lead_status;
    if (funnel?.object_type === 'Contact') return record.lifecycle_stage;
    return null;
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === "" || 
      JSON.stringify(record).toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordOwner = record.deal_owner || record.lead_owner || record.contact_owner;
    const matchesOwner = filterOwner === "all" || recordOwner === filterOwner;

    return matchesSearch && matchesOwner;
  });

  const calculateStats = () => {
    const totalRecords = filteredRecords.length;
    const totalValue = filteredRecords
      .filter(r => r.deal_amount)
      .reduce((sum, r) => sum + (r.deal_amount || 0), 0);
    
    const winStage = stages.find(s => s.is_winning_stage);
    const wonRecords = winStage 
      ? filteredRecords.filter(r => getRecordStage(r) === winStage.stage_name).length
      : 0;

    const conversionRate = totalRecords > 0 ? ((wonRecords / totalRecords) * 100).toFixed(1) : 0;

    return { totalRecords, totalValue, conversionRate };
  };

  const stats = calculateStats();

  if (loadingFunnel || loadingStages) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Loading funnel...
        </div>
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Funnel not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeuroButton onClick={() => navigate(createPageUrl("Funnels"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                {funnel.funnel_name}
              </h1>
              <p style={{ color: "#888" }}>
                {funnel.object_type} Pipeline
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <NeuroCard inset>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: "#888" }}>Total Records</p>
                <p className="text-2xl font-bold" style={{ color: "#666" }}>{stats.totalRecords}</p>
              </div>
              <Filter className="w-8 h-8" style={{ color: "#00A86B" }} />
            </div>
          </NeuroCard>

          {funnel.object_type === 'Deal' && (
            <NeuroCard inset>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1" style={{ color: "#888" }}>Total Value</p>
                  <p className="text-2xl font-bold" style={{ color: "#666" }}>
                    ${stats.totalValue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8" style={{ color: "#00A86B" }} />
              </div>
            </NeuroCard>
          )}

          <NeuroCard inset>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: "#888" }}>Win Rate</p>
                <p className="text-2xl font-bold" style={{ color: "#666" }}>{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: "#00A86B" }} />
            </div>
          </NeuroCard>
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search records..."
                  className="ampvibe-input w-full pl-10"
                />
              </div>
            </div>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="ampvibe-input"
            >
              <option value="all">All Owners</option>
              {users.map(user => (
                <option key={user.id} value={user.email}>{user.full_name}</option>
              ))}
            </select>
          </div>
        </NeuroCard>

        {/* Kanban Board */}
        <FunnelKanban
          stages={stages}
          records={filteredRecords}
          funnel={funnel}
          onStageChange={handleStageChange}
          getRecordStage={getRecordStage}
        />
      </div>
    </div>
  );
}