import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function ReportViewer() {
  const navigate = useNavigate();
  const [reportId, setReportId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setReportId(urlParams.get('id'));
  }, []);

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => base44.entities.Reports.filter({ id: reportId }),
    enabled: !!reportId,
    select: (data) => data[0]
  });

  const { data: reportData = [], isLoading: dataLoading, refetch } = useQuery({
    queryKey: ['reportData', reportId, report?.report_type],
    queryFn: async () => {
      if (!report) return [];
      
      const entityMap = {
        "Contacts": "Contact",
        "Companies": "Company",
        "Deals": "Deal",
        "Activities": "Activity",
        "Tickets": "Ticket",
        "Email Performance": "Email_Tracking"
      };
      
      const entityName = entityMap[report.report_type];
      if (!entityName) return [];
      
      try {
        const data = await base44.entities[entityName].list('-created_date', 100);
        return data || [];
      } catch (error) {
        console.error('Report data fetch error:', error);
        return [];
      }
    },
    enabled: !!report
  });

  const handleExport = () => {
    if (!report || !reportData.length) return;

    const columns = report.columns_to_show || [];
    const csvContent = [
      columns,
      ...reportData.map(row => 
        columns.map(col => {
          const value = row[col];
          return `"${String(value || '').replace(/"/g, '""')}"`;
        })
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (reportLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Loading report...
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Report not found
        </div>
      </div>
    );
  }

  const columns = report.columns_to_show || [];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeuroButton onClick={() => navigate(createPageUrl("Reports"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                {report.report_name}
              </h1>
              <p style={{ color: "#888" }}>
                {report.report_description || report.report_type} • {reportData.length} records
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </NeuroButton>
            <NeuroButton onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </NeuroButton>
          </div>
        </div>

        {/* Report Info */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <NeuroCard>
            <p className="text-sm" style={{ color: "#888" }}>Report Type</p>
            <p className="text-lg font-bold" style={{ color: "#666" }}>
              {report.report_type}
            </p>
          </NeuroCard>
          <NeuroCard>
            <p className="text-sm" style={{ color: "#888" }}>Chart Type</p>
            <p className="text-lg font-bold" style={{ color: "#666" }}>
              {report.chart_type}
            </p>
          </NeuroCard>
          <NeuroCard>
            <p className="text-sm" style={{ color: "#888" }}>Date Range</p>
            <p className="text-lg font-bold" style={{ color: "#666" }}>
              {report.date_range}
            </p>
          </NeuroCard>
          <NeuroCard>
            <p className="text-sm" style={{ color: "#888" }}>Records</p>
            <p className="text-lg font-bold" style={{ color: "#4a90e2" }}>
              {reportData.length}
            </p>
          </NeuroCard>
        </div>

        {/* Report Data Table */}
        <NeuroCard>
          {dataLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading data...
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              No data available
            </div>
          ) : columns.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              No columns configured for this report
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                    {columns.map((column) => (
                      <th key={column} className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#e0e0e0" }}>
                      {columns.map((column) => (
                        <td key={column} className="py-3 px-4" style={{ color: "#666" }}>
                          {row[column] !== undefined && row[column] !== null
                            ? String(row[column]).length > 100
                              ? String(row[column]).substring(0, 100) + '...'
                              : String(row[column])
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}