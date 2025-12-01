import React, { useState } from "react";
import { Sparkles, Users, Tag, CheckSquare, Calendar, TrendingUp, X } from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function SmartSelectionMenu({ 
  isOpen,
  onClose,
  items = [],
  onSelectItems,
  objectType
}) {
  if (!isOpen) return null;

  const getSmartSelectionOptions = () => {
    const options = [];

    // Group by owner
    const ownerCounts = {};
    items.forEach(item => {
      const owner = item.contact_owner || item.company_owner || item.deal_owner || item.lead_owner || item.assigned_to || 'Unassigned';
      ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
    });

    Object.entries(ownerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([owner, count]) => {
        options.push({
          label: `All owned by ${owner}`,
          icon: Users,
          count,
          filter: (item) => {
            const itemOwner = item.contact_owner || item.company_owner || item.deal_owner || item.lead_owner || item.assigned_to || 'Unassigned';
            return itemOwner === owner;
          }
        });
      });

    // Group by tags
    const tagCounts = {};
    items.forEach(item => {
      (item.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([tag, count]) => {
        options.push({
          label: `All with tag "${tag}"`,
          icon: Tag,
          count,
          filter: (item) => (item.tags || []).includes(tag)
        });
      });

    // Recent items (created in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentCount = items.filter(item => new Date(item.created_date) > weekAgo).length;
    if (recentCount > 0) {
      options.push({
        label: 'All created this week',
        icon: TrendingUp,
        count: recentCount,
        filter: (item) => new Date(item.created_date) > weekAgo
      });
    }

    // Stage-specific for contacts
    if (objectType === 'Contact') {
      const stageCounts = {};
      items.forEach(item => {
        const stage = item.lifecycle_stage || 'Unknown';
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      });

      Object.entries(stageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([stage, count]) => {
          options.push({
            label: `All in ${stage} stage`,
            icon: CheckSquare,
            count,
            filter: (item) => item.lifecycle_stage === stage
          });
        });
    }

    // Status-specific
    if (objectType === 'Contact' || objectType === 'Lead') {
      const statusCounts = {};
      items.forEach(item => {
        const status = item.lead_status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      Object.entries(statusCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([status, count]) => {
          options.push({
            label: `All with ${status} status`,
            icon: CheckSquare,
            count,
            filter: (item) => item.lead_status === status
          });
        });
    }

    return options;
  };

  const options = getSmartSelectionOptions();

  const handleSelect = (option) => {
    const matchingItems = items.filter(option.filter);
    onSelectItems(matchingItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="ampvibe-card max-w-lg w-full">
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="ampvibe-inset p-2 rounded-lg">
                <Sparkles className="w-5 h-5" style={{ color: "#00A86B" }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                Smart Selection
              </h2>
            </div>
            <button onClick={onClose} className="ampvibe-button p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="mb-4" style={{ color: "#888" }}>
            Quickly select groups of records based on common attributes:
          </p>

          {options.length === 0 ? (
            <p className="text-center py-8" style={{ color: "#aaa" }}>
              No smart selection options available
            </p>
          ) : (
            <div className="space-y-2">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(option)}
                  className="ampvibe-button w-full p-4 flex items-center justify-between hover:scale-102 transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <option.icon className="w-5 h-5" style={{ color: "#00A86B" }} />
                    <span style={{ color: "#666" }}>{option.label}</span>
                  </div>
                  <span 
                    className="ampvibe-inset px-3 py-1 rounded-full text-sm font-medium"
                    style={{ color: "#00A86B" }}
                  >
                    {option.count} records
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}