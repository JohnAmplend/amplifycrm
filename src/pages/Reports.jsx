import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, BarChart, Star, Edit2, Trash2, Play } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function Reports() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Reports.list('-created_date')
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => base44.entities.Reports.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Reports.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
    }
  });

  const myReports = reports.filter(r => r.created_by === currentUser?.email);
  const sharedReports = reports.filter(r => r.is_shared && r.created_by !== currentUser?.email);
  const favoriteReports = reports.filter(r => r.is_favorite);

  const filteredReports = reports.filter(r => !filterType || r.report_type === filterType);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Reports
            </h1>
            <p style={{ color: "#888" }}>Analyze your CRM data</p>
          </div>
          <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("ReportBuilder"))}>
            <Plus className="w-4 h-4 mr-2" />
            Create Report
          </NeuroButton>
        </div>

        {/* Filter */}
        <NeuroCard className="mb-6">
          <NeuroSelect
            placeholder="All Report Types"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: 'Contacts', label: 'Contacts' },
              { value: 'Companies', label: 'Companies' },
              { value: 'Deals', label: 'Deals' },
              { value: 'Activities', label: 'Activities' },
              { value: 'Tickets', label: 'Tickets' },
              { value: 'Email Performance', label: 'Email Performance' }
            ]}
          />
        </NeuroCard>

        {/* Favorites */}
        {favoriteReports.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              <Star className="w-5 h-5 inline mr-2" style={{ color: "#fa8c16" }} />
              Favorites
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteReports.map((report) => (
                <NeuroCard key={report.id} className="hover:shadow-xl transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold" style={{ color: "#666" }}>
                          {report.report_name}
                        </h3>
                        <p className="text-xs" style={{ color: "#888" }}>
                          {report.report_type}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleFavoriteMutation.mutate({ id: report.id, isFavorite: report.is_favorite })}
                        className="ampvibe-button p-2"
                      >
                        <Star className="w-4 h-4" style={{ color: "#fa8c16", fill: "#fa8c16" }} />
                      </button>
                    </div>
                    {report.report_description && (
                      <p className="text-sm" style={{ color: "#888" }}>
                        {report.report_description.substring(0, 80)}...
                      </p>
                    )}
                    <div className="flex gap-2">
                      <NeuroButton size="sm" className="flex-1">
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </NeuroButton>
                      <NeuroButton size="sm">
                        <Edit2 className="w-3 h-3" />
                      </NeuroButton>
                    </div>
                  </div>
                </NeuroCard>
              ))}
            </div>
          </div>
        )}

        {/* My Reports */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            My Reports
          </h2>
          {myReports.length === 0 ? (
            <NeuroCard>
              <div className="text-center py-12">
                <BarChart className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
                <p className="mb-4" style={{ color: "#aaa" }}>No reports yet</p>
                <NeuroButton onClick={() => navigate(createPageUrl("ReportBuilder"))}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Report
                </NeuroButton>
              </div>
            </NeuroCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myReports.map((report) => (
                <NeuroCard key={report.id} className="hover:shadow-xl transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold" style={{ color: "#666" }}>
                          {report.report_name}
                        </h3>
                        <p className="text-xs" style={{ color: "#888" }}>
                          {report.report_type} • {report.chart_type}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleFavoriteMutation.mutate({ id: report.id, isFavorite: report.is_favorite })}
                        className="ampvibe-button p-2"
                      >
                        <Star className="w-4 h-4" style={{ color: report.is_favorite ? "#fa8c16" : "#ccc", fill: report.is_favorite ? "#fa8c16" : "none" }} />
                      </button>
                    </div>
                    {report.report_description && (
                      <p className="text-sm" style={{ color: "#888" }}>
                        {report.report_description.substring(0, 80)}...
                      </p>
                    )}
                    <div className="flex gap-2">
                      <NeuroButton size="sm" className="flex-1">
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </NeuroButton>
                      <NeuroButton size="sm">
                        <Edit2 className="w-3 h-3" />
                      </NeuroButton>
                      <NeuroButton
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Delete this report?')) {
                            deleteMutation.mutate(report.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </NeuroButton>
                    </div>
                  </div>
                </NeuroCard>
              ))}
            </div>
          )}
        </div>

        {/* Shared Reports */}
        {sharedReports.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              Shared Reports
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedReports.map((report) => (
                <NeuroCard key={report.id} className="hover:shadow-xl transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold" style={{ color: "#666" }}>
                          {report.report_name}
                        </h3>
                        <p className="text-xs" style={{ color: "#888" }}>
                          {report.report_type}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleFavoriteMutation.mutate({ id: report.id, isFavorite: report.is_favorite })}
                        className="ampvibe-button p-2"
                      >
                        <Star className="w-4 h-4" style={{ color: report.is_favorite ? "#fa8c16" : "#ccc", fill: report.is_favorite ? "#fa8c16" : "none" }} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <NeuroButton size="sm" className="flex-1">
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </NeuroButton>
                    </div>
                  </div>
                </NeuroCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}