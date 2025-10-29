
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, BarChart, Star, Edit2, Trash2, Play, Search, Eye } from "lucide-react"; // Added Search and Eye
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function Reports() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState(""); // New state
  const [filterType, setFilterType] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false); // New state
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Reports.list('-created_date')
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id) => {
      // Optimistically get the current state from the cache
      const currentReports = queryClient.getQueryData(['reports']);
      const reportToToggle = currentReports?.find(r => r.id === id);
      if (reportToToggle) {
        return base44.entities.Reports.update(id, { is_favorite: !reportToToggle.is_favorite });
      }
      // If not found in cache, proceed with assumption or throw
      // For a robust solution, you might fetch the report state first from the API
      // or ensure the backend handles toggling based on current state.
      // For this exercise, we'll assume the cache has the data.
      throw new Error("Report not found in cache for toggling favorite status.");
    },
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

  // Updated filteredReports logic
  const filteredReports = reports.filter(report => {
    const matchesSearch =
      report.report_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.report_description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || report.report_type === filterType;
    const matchesFavorites = !showFavoritesOnly || report.is_favorite;

    return matchesSearch && matchesType && matchesFavorites;
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Reports
            </h1>
            <p style={{ color: "#888" }}>{filteredReports.length} total reports</p>
          </div>
          <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("ReportBuilder"))}>
            <Plus className="w-4 h-4 mr-2" />
            Create Report
          </NeuroButton>
        </div>

        <NeuroCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neuro-input w-full pl-12"
              />
            </div>
            <NeuroSelect
              placeholder="Filter by type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: "Contacts", label: "Contacts" },
                { value: "Companies", label: "Companies" },
                { value: "Deals", label: "Deals" },
                { value: "Activities", label: "Activities" },
                { value: "Tickets", label: "Tickets" },
                { value: "Email Performance", label: "Email Performance" }
              ]}
            />
            <label className="flex items-center gap-2 cursor-pointer ampvibe-button px-4">
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              />
              <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              <span className="text-sm">Favorites Only</span>
            </label>
          </div>
        </NeuroCard>

        <div className="grid gap-4">
          {isLoading ? (
            <NeuroCard>
              <div className="text-center py-12" style={{ color: "#aaa" }}>
                Loading reports...
              </div>
            </NeuroCard>
          ) : filteredReports.length === 0 ? (
            <NeuroCard>
              <div className="text-center py-12">
                <p className="mb-4" style={{ color: "#aaa" }}>No reports found</p>
                <NeuroButton onClick={() => navigate(createPageUrl("ReportBuilder"))}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Report
                </NeuroButton>
              </div>
            </NeuroCard>
          ) : (
            filteredReports.map((report) => (
              <NeuroCard key={report.id} className="hover:shadow-xl transition-shadow"> {/* Added hover effect back */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold" style={{ color: "#666" }}>
                        {report.report_name}
                      </h3>
                      <button
                        onClick={() => toggleFavoriteMutation.mutate(report.id)}
                        className="ampvibe-button p-2"
                      >
                        <Star className={`w-4 h-4 ${report.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>
                    </div>
                    {report.report_description && (
                      <p className="mb-3" style={{ color: "#888" }}>
                        {report.report_description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm flex-wrap"> {/* Added flex-wrap for better layout */}
                      <span className="ampvibe-button px-2 py-1 text-xs">{report.report_type}</span>
                      <span className="ampvibe-button px-2 py-1 text-xs">{report.chart_type}</span>
                      <span className="ampvibe-button px-2 py-1 text-xs">{report.date_range}</span>
                      {report.is_shared && (
                        <span className="ampvibe-button px-2 py-1 text-green-600 text-xs">Shared</span>
                      )}
                      <span style={{ color: "#aaa" }} className="text-xs">
                        Created {new Date(report.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <NeuroButton size="sm" onClick={() => navigate(createPageUrl("ReportViewer") + `?id=${report.id}`)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </NeuroButton>
                    {report.created_by === currentUser?.email && ( // Only allow delete for owner
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete report "${report.report_name}"?`)) {
                            deleteMutation.mutate(report.id);
                          }
                        }}
                        className="ampvibe-button p-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </NeuroCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
