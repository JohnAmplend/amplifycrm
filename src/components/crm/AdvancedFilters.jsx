import React, { useState } from "react";
import { X, Search, Calendar, Type, Hash, Tag, Mail, Phone, Building2, User, MapPin, TrendingUp, Clock } from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function AdvancedFilters({ isOpen, onClose, onApplyFilters, currentFilters = [] }) {
  const [activeFilters, setActiveFilters] = useState(currentFilters);
  const [searchTerm, setSearchTerm] = useState("");

  // Available filter properties organized by category
  const filterCategories = [
    {
      name: "Contact Information",
      properties: [
        { id: "first_name", label: "First Name", type: "text", icon: Type },
        { id: "last_name", label: "Last Name", type: "text", icon: Type },
        { id: "email", label: "Email", type: "text", icon: Mail },
        { id: "phone", label: "Phone", type: "text", icon: Phone },
        { id: "job_title", label: "Job Title", type: "text", icon: Type },
        { id: "department", label: "Department", type: "text", icon: Type },
        { id: "mobile", label: "Mobile", type: "text", icon: Phone },
      ]
    },
    {
      name: "Contact Activity",
      properties: [
        { id: "created_date", label: "Create Date", type: "date", icon: Calendar },
        { id: "updated_date", label: "Last Modified Date", type: "date", icon: Calendar },
        { id: "last_contacted", label: "Last Contacted", type: "date", icon: Calendar },
        { id: "next_activity_date", label: "Next Activity Date", type: "date", icon: Calendar },
        { id: "last_activity_date", label: "Last Activity Date", type: "date", icon: Calendar },
      ]
    },
    {
      name: "Company Information",
      properties: [
        { id: "company_id", label: "Company", type: "text", icon: Building2 },
        { id: "industry", label: "Industry", type: "text", icon: Tag },
        { id: "number_of_employees", label: "Number of Employees", type: "number", icon: Hash },
        { id: "annual_revenue", label: "Annual Revenue", type: "number", icon: Hash },
      ]
    },
    {
      name: "Lead Information",
      properties: [
        { id: "lifecycle_stage", label: "Lifecycle Stage", type: "select", icon: TrendingUp, options: ['Subscriber', 'Lead', 'MQL', 'SQL', 'Opportunity', 'Customer'] },
        { id: "lead_status", label: "Lead Status", type: "select", icon: Tag, options: ['New', 'Attempting', 'Connected', 'Qualified', 'Unqualified'] },
        { id: "lead_source", label: "Lead Source", type: "text", icon: Type },
        { id: "original_source", label: "Original Source", type: "text", icon: Type },
      ]
    },
    {
      name: "Location",
      properties: [
        { id: "city", label: "City", type: "text", icon: MapPin },
        { id: "state", label: "State/Region", type: "text", icon: MapPin },
        { id: "country", label: "Country", type: "text", icon: MapPin },
        { id: "zip", label: "Postal Code", type: "text", icon: MapPin },
      ]
    },
    {
      name: "Marketing",
      properties: [
        { id: "marketing_emails_opened", label: "Marketing Emails Opened", type: "number", icon: Hash },
        { id: "marketing_emails_clicked", label: "Marketing Emails Clicked", type: "number", icon: Hash },
        { id: "first_conversion_date", label: "First Conversion Date", type: "date", icon: Calendar },
        { id: "recent_conversion_date", label: "Recent Conversion Date", type: "date", icon: Calendar },
      ]
    },
    {
      name: "Deal Information",
      properties: [
        { id: "deal_amount", label: "Deal Amount", type: "number", icon: Hash },
        { id: "close_date", label: "Close Date", type: "date", icon: Calendar },
        { id: "deal_stage_name", label: "Deal Stage", type: "text", icon: Type },
      ]
    },
    {
      name: "Other",
      properties: [
        { id: "contact_owner", label: "Contact Owner", type: "text", icon: User },
        { id: "linkedin_url", label: "LinkedIn URL", type: "text", icon: Type },
        { id: "twitter_handle", label: "Twitter Handle", type: "text", icon: Type },
        { id: "time_zone", label: "Time Zone", type: "text", icon: Clock },
      ]
    }
  ];

  const allProperties = filterCategories.flatMap(cat => cat.properties);

  const filteredProperties = searchTerm
    ? allProperties.filter(prop => 
        prop.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  const addFilter = (property) => {
    if (!activeFilters.find(f => f.id === property.id)) {
      setActiveFilters([...activeFilters, {
        id: property.id,
        label: property.label,
        type: property.type,
        icon: property.icon,
        operator: property.type === 'number' ? 'equals' : property.type === 'date' ? 'is_after' : 'contains',
        value: '',
        options: property.options
      }]);
    }
  };

  const removeFilter = (filterId) => {
    setActiveFilters(activeFilters.filter(f => f.id !== filterId));
  };

  const updateFilter = (filterId, field, value) => {
    setActiveFilters(activeFilters.map(f => 
      f.id === filterId ? { ...f, [field]: value } : f
    ));
  };

  const handleApply = () => {
    onApplyFilters(activeFilters.filter(f => f.value));
    onClose();
  };

  const handleClear = () => {
    setActiveFilters([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="ampvibe-card w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#e0e0e0" }}>
          <h2 className="text-2xl font-bold" style={{ color: "#555" }}>All Filters</h2>
          <button onClick={onClose} className="ampvibe-button p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Side - Active Filters */}
          <div className="w-1/2 border-r p-6 overflow-y-auto" style={{ borderColor: "#e0e0e0" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: "#666" }}>Quick Filters</h3>
              {activeFilters.length > 0 && (
                <button onClick={handleClear} className="text-sm" style={{ color: "#4a90e2" }}>
                  Clear all
                </button>
              )}
            </div>

            {activeFilters.length === 0 ? (
              <div className="text-center py-12" style={{ color: "#aaa" }}>
                <p className="mb-2">No filters applied</p>
                <p className="text-sm">Select a filter to begin</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeFilters.map((filter, index) => (
                  <div key={filter.id} className="ampvibe-inset p-4 rounded-lg">
                    {index > 0 && (
                      <div className="text-center mb-3">
                        <span className="ampvibe-button px-3 py-1 text-xs">AND</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <filter.icon className="w-4 h-4" style={{ color: "#888" }} />
                        <span className="font-medium" style={{ color: "#666" }}>{filter.label}</span>
                      </div>
                      <button onClick={() => removeFilter(filter.id)} className="ampvibe-button p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Operator */}
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                      className="ampvibe-input w-full mb-2"
                    >
                      {filter.type === 'text' && (
                        <>
                          <option value="contains">contains</option>
                          <option value="not_contains">doesn't contain</option>
                          <option value="equals">is equal to</option>
                          <option value="not_equals">is not equal to</option>
                          <option value="starts_with">starts with</option>
                          <option value="ends_with">ends with</option>
                          <option value="is_empty">is empty</option>
                          <option value="is_not_empty">is not empty</option>
                        </>
                      )}
                      {filter.type === 'number' && (
                        <>
                          <option value="equals">is equal to</option>
                          <option value="not_equals">is not equal to</option>
                          <option value="greater_than">is greater than</option>
                          <option value="less_than">is less than</option>
                          <option value="greater_or_equal">is greater than or equal to</option>
                          <option value="less_or_equal">is less than or equal to</option>
                          <option value="is_empty">is empty</option>
                          <option value="is_not_empty">is not empty</option>
                        </>
                      )}
                      {filter.type === 'date' && (
                        <>
                          <option value="is_after">is after</option>
                          <option value="is_before">is before</option>
                          <option value="is_equal">is equal to</option>
                          <option value="is_between">is between</option>
                          <option value="is_empty">is empty</option>
                          <option value="is_not_empty">is not empty</option>
                          <option value="in_last">in the last</option>
                          <option value="in_next">in the next</option>
                        </>
                      )}
                      {filter.type === 'select' && (
                        <>
                          <option value="equals">is equal to</option>
                          <option value="not_equals">is not equal to</option>
                          <option value="is_any_of">is any of</option>
                          <option value="is_empty">is empty</option>
                          <option value="is_not_empty">is not empty</option>
                        </>
                      )}
                    </select>

                    {/* Value Input */}
                    {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                      <>
                        {filter.type === 'select' && filter.options ? (
                          <select
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                            className="ampvibe-input w-full"
                          >
                            <option value="">Select...</option>
                            {filter.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : filter.type === 'date' ? (
                          filter.operator === 'in_last' || filter.operator === 'in_next' ? (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={filter.value}
                                onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                className="ampvibe-input flex-1"
                                placeholder="Number"
                              />
                              <select
                                value={filter.unit || 'days'}
                                onChange={(e) => updateFilter(filter.id, 'unit', e.target.value)}
                                className="ampvibe-input"
                              >
                                <option value="days">days</option>
                                <option value="weeks">weeks</option>
                                <option value="months">months</option>
                                <option value="years">years</option>
                              </select>
                            </div>
                          ) : (
                            <input
                              type="date"
                              value={filter.value}
                              onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                              className="ampvibe-input w-full"
                            />
                          )
                        ) : filter.type === 'number' ? (
                          <input
                            type="number"
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                            className="ampvibe-input w-full"
                            placeholder="Enter number"
                          />
                        ) : (
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                            className="ampvibe-input w-full"
                            placeholder="Enter value"
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t" style={{ borderColor: "#e0e0e0" }}>
              <h3 className="font-bold mb-2" style={{ color: "#666" }}>Advanced Filters</h3>
              <p className="text-sm" style={{ color: "#888" }}>
                {activeFilters.length > 0 
                  ? `${activeFilters.length} filter(s) applied` 
                  : "No advanced filters applied"}
              </p>
            </div>
          </div>

          {/* Right Side - Add Filter */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <h3 className="font-bold mb-4" style={{ color: "#666" }}>Add Filter</h3>
            
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search in contact properties"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ampvibe-input w-full pl-10"
              />
            </div>

            {/* Property List */}
            <div className="space-y-6">
              {(filteredProperties || filterCategories).map((item) => {
                // If searching, show flat list
                if (filteredProperties) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => addFilter(item)}
                      className="ampvibe-button w-full text-left px-4 py-3 flex items-center gap-3"
                      disabled={activeFilters.find(f => f.id === item.id)}
                    >
                      <item.icon className="w-4 h-4" style={{ color: "#888" }} />
                      <span>{item.label}</span>
                    </button>
                  );
                }

                // Otherwise show by category
                return (
                  <div key={item.name}>
                    <h4 className="font-semibold mb-3 text-sm" style={{ color: "#888" }}>
                      {item.name}
                    </h4>
                    <div className="space-y-1">
                      {item.properties.map((prop) => (
                        <button
                          key={prop.id}
                          onClick={() => addFilter(prop)}
                          className="ampvibe-button w-full text-left px-4 py-3 flex items-center gap-3 text-sm"
                          disabled={activeFilters.find(f => f.id === prop.id)}
                        >
                          <prop.icon className="w-4 h-4" style={{ color: "#888" }} />
                          <span>{prop.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t" style={{ borderColor: "#e0e0e0" }}>
          <NeuroButton onClick={onClose}>Cancel</NeuroButton>
          <NeuroButton variant="primary" onClick={handleApply}>
            Apply Filters ({activeFilters.filter(f => f.value).length})
          </NeuroButton>
        </div>
      </div>
    </div>
  );
}