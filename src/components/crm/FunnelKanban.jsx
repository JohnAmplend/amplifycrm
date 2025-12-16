import React, { useState } from "react";
import { DollarSign, User, Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function FunnelKanban({ stages, records, funnel, onStageChange, getRecordStage }) {
  const navigate = useNavigate();
  const [draggedRecord, setDraggedRecord] = useState(null);

  const getRecordsForStage = (stageName) => {
    return records.filter(record => getRecordStage(record) === stageName);
  };

  const getStageValue = (record) => {
    if (funnel.object_type === 'Deal') {
      return record.deal_amount ? `$${record.deal_amount.toLocaleString()}` : null;
    }
    return null;
  };

  const getRecordTitle = (record) => {
    if (funnel.object_type === 'Deal') return record.deal_name;
    if (funnel.object_type === 'Lead') return `${record.first_name} ${record.last_name}`;
    if (funnel.object_type === 'Contact') return `${record.first_name} ${record.last_name}`;
    return 'Unknown';
  };

  const getRecordSubtitle = (record) => {
    if (funnel.object_type === 'Deal') return record.deal_owner;
    if (funnel.object_type === 'Lead') return record.company_name || record.email;
    if (funnel.object_type === 'Contact') return record.email || record.job_title;
    return '';
  };

  const handleDragStart = (e, record) => {
    setDraggedRecord(record);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, stageName) => {
    e.preventDefault();
    if (draggedRecord && getRecordStage(draggedRecord) !== stageName) {
      await onStageChange(draggedRecord.id, stageName);
    }
    setDraggedRecord(null);
  };

  const handleDragEnd = () => {
    setDraggedRecord(null);
  };

  const getDetailPage = () => {
    if (funnel.object_type === 'Deal') return 'DealDetail';
    if (funnel.object_type === 'Lead') return 'LeadDetail';
    if (funnel.object_type === 'Contact') return 'ContactDetail';
    return 'Dashboard';
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageRecords = getRecordsForStage(stage.stage_name);
        const totalValue = stageRecords
          .filter(r => r.deal_amount)
          .reduce((sum, r) => sum + (r.deal_amount || 0), 0);

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.stage_name)}
          >
            {/* Stage Header */}
            <div 
              className="ampvibe-card p-4 mb-3"
              style={{ borderTop: `4px solid ${stage.stage_color}` }}
            >
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>
                {stage.stage_name}
              </h3>
              <div className="flex items-center justify-between text-sm" style={{ color: "#888" }}>
                <span>{stageRecords.length} records</span>
                {funnel.object_type === 'Deal' && totalValue > 0 && (
                  <span className="font-medium">${totalValue.toLocaleString()}</span>
                )}
              </div>
              {stage.probability !== undefined && (
                <div className="mt-2">
                  <div className="ampvibe-inset h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all"
                      style={{ 
                        width: `${stage.probability}%`,
                        background: 'linear-gradient(135deg, #00A86B 0%, #00C87A 100%)'
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1 text-center" style={{ color: "#888" }}>
                    {stage.probability}% probability
                  </p>
                </div>
              )}
            </div>

            {/* Records */}
            <div className="space-y-3">
              {stageRecords.map((record) => (
                <div
                  key={record.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, record)}
                  onDragEnd={handleDragEnd}
                  className={`ampvibe-card p-4 cursor-move hover:scale-102 transition-all ${
                    draggedRecord?.id === record.id ? 'opacity-50' : ''
                  }`}
                  onClick={(e) => {
                    if (e.target.tagName !== 'INPUT') {
                      navigate(createPageUrl(getDetailPage()) + `?id=${record.id}`);
                    }
                  }}
                >
                  <h4 className="font-bold mb-2" style={{ color: "#666" }}>
                    {getRecordTitle(record)}
                  </h4>
                  
                  {getRecordSubtitle(record) && (
                    <p className="text-sm mb-3" style={{ color: "#888" }}>
                      {getRecordSubtitle(record)}
                    </p>
                  )}

                  <div className="space-y-2">
                    {getStageValue(record) && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4" style={{ color: "#00A86B" }} />
                        <span className="font-medium" style={{ color: "#00A86B" }}>
                          {getStageValue(record)}
                        </span>
                      </div>
                    )}

                    {record.close_date && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "#888" }}>
                        <Calendar className="w-4 h-4" />
                        <span>{moment(record.close_date).format('MMM D, YYYY')}</span>
                      </div>
                    )}

                    {(record.deal_owner || record.lead_owner || record.contact_owner) && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "#888" }}>
                        <User className="w-4 h-4" />
                        <span>{record.deal_owner || record.lead_owner || record.contact_owner}</span>
                      </div>
                    )}
                  </div>

                  {record.priority && (
                    <div className="mt-3">
                      <span className={`ampvibe-inset px-2 py-1 text-xs rounded-full ${
                        record.priority === 'High' ? 'text-red-600' :
                        record.priority === 'Medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        {record.priority}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {stageRecords.length === 0 && (
                <div className="ampvibe-inset p-6 text-center rounded-lg" style={{ color: "#aaa" }}>
                  <p className="text-sm">No records in this stage</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}