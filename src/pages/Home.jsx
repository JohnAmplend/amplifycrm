import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Users, Building2, DollarSign, Activity, Mail, MessageSquare, BarChart } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #F5F7FA 0%, #E6F0FA 100%)'
    }}>
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4" style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            AmplifyCRM
          </h1>
          <p className="text-xl mb-8" style={{ color: "#666" }}>
            All-in-one CRM platform to grow your business
          </p>
          <Link to={createPageUrl("Dashboard")}>
            <button className="ampvibe-button-primary px-8 py-4 text-lg">
              Get Started <ArrowRight className="w-5 h-5 ml-2 inline" />
            </button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="ampvibe-card p-6 text-center">
            <div className="ampvibe-button-primary w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: "#666" }}>Contact Management</h3>
            <p className="text-sm" style={{ color: "#888" }}>
              Organize and track all your contacts and relationships
            </p>
          </div>

          <div className="ampvibe-card p-6 text-center">
            <div className="ampvibe-button-primary w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <DollarSign className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: "#666" }}>Deal Pipeline</h3>
            <p className="text-sm" style={{ color: "#888" }}>
              Manage deals and track them through your sales pipeline
            </p>
          </div>

          <div className="ampvibe-card p-6 text-center">
            <div className="ampvibe-button-primary w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: "#666" }}>Email Integration</h3>
            <p className="text-sm" style={{ color: "#888" }}>
              Connect Gmail and sync your email communications
            </p>
          </div>

          <div className="ampvibe-card p-6 text-center">
            <div className="ampvibe-button-primary w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <BarChart className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: "#666" }}>Analytics & Reports</h3>
            <p className="text-sm" style={{ color: "#888" }}>
              Get insights with powerful reporting and dashboards
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="ampvibe-card p-8">
          <div className="text-center">
            <p className="mb-4" style={{ color: "#888" }}>
              © 2025 AmplifyCRM. All rights reserved.
            </p>
            <div className="flex justify-center gap-6">
              <a href="https://crm.amplend.net/privacy" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "#00A86B" }}>
                Privacy Policy
              </a>
              <a href="https://crm.amplend.net/terms" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "#00A86B" }}>
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}