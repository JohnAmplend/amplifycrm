import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Eye, Users, MousePointer, TrendingUp } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import StatCard from "../components/crm/StatCard";

export default function WebsiteTracking() {
  const { data: visitors = [] } = useQuery({
    queryKey: ['website_visitors'],
    queryFn: () => base44.entities.Website_Visitor.list('-last_visit_date', 100)
  });

  const { data: pageViews = [] } = useQuery({
    queryKey: ['page_views'],
    queryFn: () => base44.entities.Page_View.list('-viewed_at', 100)
  });

  const totalVisitors = visitors.length;
  const totalPageViews = pageViews.length;
  const avgPageViews = totalVisitors > 0 ? (totalPageViews / totalVisitors).toFixed(1) : 0;
  const identifiedVisitors = visitors.filter(v => v.contact_id).length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Website Tracking
            </h1>
            <p style={{ color: "#888" }}>Monitor visitor activity on your website</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            icon={Users}
            title="Total Visitors"
            value={totalVisitors}
            subtitle="Unique website visitors"
            color="#4a90e2"
          />
          <StatCard
            icon={Eye}
            title="Page Views"
            value={totalPageViews}
            subtitle="Total page views"
            color="#52c41a"
          />
          <StatCard
            icon={MousePointer}
            title="Avg. Pages/Visit"
            value={avgPageViews}
            subtitle="Pages per visitor"
            color="#fa8c16"
          />
          <StatCard
            icon={TrendingUp}
            title="Identified"
            value={identifiedVisitors}
            subtitle="Known contacts"
            color="#eb2f96"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Visitors */}
          <NeuroCard>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              Recent Visitors
            </h2>
            <div className="space-y-3">
              {visitors.slice(0, 10).map((visitor) => (
                <div key={visitor.id} className="ampvibe-inset p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: "#666" }}>
                        {visitor.visitor_id}
                      </p>
                      <p className="text-xs" style={{ color: "#888" }}>
                        {visitor.city && visitor.country && `${visitor.city}, ${visitor.country}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "#888" }}>
                        {visitor.total_page_views} pages
                      </p>
                      <p className="text-xs" style={{ color: "#aaa" }}>
                        {new Date(visitor.last_visit_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </NeuroCard>

          {/* Recent Page Views */}
          <NeuroCard>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              Recent Page Views
            </h2>
            <div className="space-y-3">
              {pageViews.slice(0, 10).map((view) => (
                <div key={view.id} className="ampvibe-inset p-3 rounded-lg">
                  <p className="font-medium text-sm mb-1" style={{ color: "#666" }}>
                    {view.page_title || view.page_url}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: "#888" }}>
                      {view.page_url}
                    </p>
                    <p className="text-xs" style={{ color: "#aaa" }}>
                      {new Date(view.viewed_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </NeuroCard>
        </div>
      </div>
    </div>
  );
}