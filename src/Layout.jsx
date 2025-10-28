import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  UserPlus,
  Activity,
  CheckSquare,
  Upload,
  LogOut,
  Phone,
  Settings,
  Mail,
  List,
  Send,
  Layers,
  Ticket,
  MessageSquare,
  Clock,
  BarChart3
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Contacts", icon: Users, page: "Contacts" },
    { name: "Companies", icon: Building2, page: "Companies" },
    { name: "Deals", icon: DollarSign, page: "Deals" },
    { name: "Leads", icon: UserPlus, page: "Leads" },
    { name: "Activities", icon: Activity, page: "Activities" },
    { name: "Tasks", icon: CheckSquare, page: "Tasks" },
    { name: "Import", icon: Upload, page: "Import" },
  ];

  const service = [
    { name: "Tickets Dashboard", icon: LayoutDashboard, page: "TicketsDashboard" },
    { name: "All Tickets", icon: Ticket, page: "AllTickets" },
    { name: "My Tickets", icon: Ticket, page: "MyTickets" },
    { name: "Canned Responses", icon: MessageSquare, page: "CannedResponses" },
    { name: "SLA Policies", icon: Clock, page: "SLAPolicies" },
  ];

  const integrations = [
    { name: "RingCentral", icon: Phone, page: "RingCentral" },
  ];

  const marketing = [
    { name: "Campaigns", icon: Send, page: "Campaigns" },
    { name: "Email Templates", icon: Mail, page: "EmailTemplates" },
    { name: "Sequences", icon: Layers, page: "EmailSequences" },
    { name: "Contact Lists", icon: List, page: "ContactLists" },
  ];

  const settings = [
    { name: "App Sync", icon: Settings, page: "AppSync" },
    { name: "API Settings", icon: Settings, page: "APISettings" },
  ];

  const isActive = (page) => {
    return location.pathname === createPageUrl(page);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen flex" style={{ 
      background: 'linear-gradient(135deg, #F5F7FA 0%, #E6F0FA 100%)'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        /* AmpVibe Glass Card */
        .ampvibe-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(30, 58, 138, 0.1);
          transition: all 0.3s ease-in-out;
        }
        
        .ampvibe-card:hover {
          box-shadow: 0 12px 40px rgba(30, 58, 138, 0.15);
          transform: translateY(-2px);
        }
        
        /* AmpVibe Inset - for inputs and sunken areas */
        .ampvibe-inset {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: inset 0 2px 8px rgba(30, 58, 138, 0.05);
        }
        
        /* AmpVibe Button */
        .ampvibe-button {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 16px rgba(30, 58, 138, 0.08);
          transition: all 0.3s ease-in-out;
          cursor: pointer;
          color: #333333;
        }
        
        .ampvibe-button:hover {
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 6px 20px rgba(30, 58, 138, 0.12);
          transform: scale(1.02) translateY(-1px);
        }
        
        .ampvibe-button:active, .ampvibe-button.active {
          background: rgba(0, 168, 107, 0.15);
          border-color: rgba(0, 168, 107, 0.3);
          color: #00A86B;
          box-shadow: 0 2px 8px rgba(0, 168, 107, 0.2);
        }
        
        /* AmpVibe Primary Button */
        .ampvibe-button-primary {
          background: linear-gradient(135deg, #00A86B 0%, #00C87A 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 16px rgba(0, 168, 107, 0.25);
        }
        
        .ampvibe-button-primary:hover {
          background: linear-gradient(135deg, #00C87A 0%, #00E089 100%);
          box-shadow: 0 6px 24px rgba(0, 168, 107, 0.35);
          transform: scale(1.05) translateY(-2px);
        }
        
        /* AmpVibe Input */
        .ampvibe-input {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 12px 16px;
          outline: none;
          color: #333333;
          box-shadow: inset 0 2px 8px rgba(30, 58, 138, 0.05);
          transition: all 0.3s ease-in-out;
        }
        
        .ampvibe-input:focus {
          background: rgba(255, 255, 255, 0.7);
          border-color: rgba(0, 168, 107, 0.5);
          box-shadow: 0 0 0 3px rgba(0, 168, 107, 0.1), inset 0 2px 8px rgba(30, 58, 138, 0.05);
        }
        
        .ampvibe-input::placeholder {
          color: rgba(51, 51, 51, 0.5);
        }
        
        /* Scrollbar Styling */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 168, 107, 0.3) rgba(255, 255, 255, 0.1);
        }
        
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(0, 168, 107, 0.3);
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 168, 107, 0.5);
        }
        
        /* Animations */
        @keyframes ampvibe-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .ampvibe-glow {
          animation: ampvibe-glow 2s ease-in-out infinite;
        }
        
        /* Typography */
        h1, h2, h3, h4, h5, h6 {
          font-weight: 700;
          line-height: 1.2;
        }
        
        body, p, span, div {
          line-height: 1.5;
        }
      `}</style>

      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 p-4 overflow-auto">
        <div className="ampvibe-card p-6 flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ 
              background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              AmplifyCRM
            </h1>
            <p className="text-sm mt-1" style={{ color: "#666" }}>
              Powered by AmpVibe
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 overflow-auto">
            <div>
              <p className="text-xs font-semibold mb-2 px-2" style={{ color: "#1E3A8A" }}>
                MAIN
              </p>
              <div className="space-y-1">
                {navigation.map((item) => {
                  const active = isActive(item.page);
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      className={`ampvibe-button ${active ? 'active' : ''} flex items-center gap-3 px-4 py-3 w-full text-left`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2 px-2" style={{ color: "#1E3A8A" }}>
                SERVICE
              </p>
              <div className="space-y-1">
                {service.map((item) => {
                  const active = isActive(item.page);
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      className={`ampvibe-button ${active ? 'active' : ''} flex items-center gap-3 px-4 py-3 w-full text-left`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2 px-2" style={{ color: "#1E3A8A" }}>
                MARKETING
              </p>
              <div className="space-y-1">
                {marketing.map((item) => {
                  const active = isActive(item.page);
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      className={`ampvibe-button ${active ? 'active' : ''} flex items-center gap-3 px-4 py-3 w-full text-left`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2 px-2" style={{ color: "#1E3A8A" }}>
                INTEGRATIONS
              </p>
              <div className="space-y-1">
                {integrations.map((item) => {
                  const active = isActive(item.page);
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      className={`ampvibe-button ${active ? 'active' : ''} flex items-center gap-3 px-4 py-3 w-full text-left`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2 px-2" style={{ color: "#1E3A8A" }}>
                CRM SETTINGS
              </p>
              <div className="space-y-1">
                {settings.map((item) => {
                  const active = isActive(item.page);
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      className={`ampvibe-button ${active ? 'active' : ''} flex items-center gap-3 px-4 py-3 w-full text-left`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* User Info */}
          {user && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="ampvibe-inset w-10 h-10 rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.5)'
                }}>
                  <span className="font-semibold text-white">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#333" }}>
                    {user.full_name || "User"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#666" }}>
                    {user.role || "User"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ampvibe-button w-full px-4 py-2 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}