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
  Settings
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [showSettings, setShowSettings] = React.useState(false);

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

  const integrations = [
    { name: "RingCentral", icon: Phone, page: "RingCentral" },
  ];

  const isActive = (page) => {
    return location.pathname === createPageUrl(page);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#e8e8e8" }}>
      <style>{`
        .neuro-card {
          background: #e8e8e8;
          border-radius: 20px;
          box-shadow: 8px 8px 16px #bebebe, -8px -8px 16px #ffffff;
        }
        
        .neuro-inset {
          background: #e8e8e8;
          border-radius: 20px;
          box-shadow: inset 6px 6px 12px #bebebe, inset -6px -6px 12px #ffffff;
        }
        
        .neuro-button {
          background: #e8e8e8;
          border-radius: 12px;
          box-shadow: 5px 5px 10px #bebebe, -5px -5px 10px #ffffff;
          border: none;
          transition: all 0.2s ease;
        }
        
        .neuro-button:hover {
          box-shadow: 3px 3px 6px #bebebe, -3px -3px 6px #ffffff;
        }
        
        .neuro-button:active, .neuro-button.active {
          box-shadow: inset 3px 3px 6px #bebebe, inset -3px -3px 6px #ffffff;
        }
        
        .neuro-input {
          background: #e8e8e8;
          border-radius: 12px;
          box-shadow: inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff;
          border: none;
          padding: 12px 16px;
          outline: none;
          color: #666;
        }
        
        .neuro-input:focus {
          box-shadow: inset 6px 6px 12px #bebebe, inset -6px -6px 12px #ffffff;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: #bebebe #e8e8e8;
        }
        
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: #e8e8e8;
        }
        
        *::-webkit-scrollbar-thumb {
          background: #bebebe;
          border-radius: 4px;
        }
      `}</style>

      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 p-4">
        <div className="neuro-card p-6 h-full flex flex-col">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: "#666" }}>
              AmplifyCRM
            </h1>
            <p className="text-sm mt-1" style={{ color: "#999" }}>
              Phase 2: Integrations
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6">
            <div>
              <p className="text-xs font-semibold mb-2 px-2" style={{ color: "#aaa" }}>
                MAIN
              </p>
              <div className="space-y-1">
                {navigation.map((item) => {
                  const active = isActive(item.page);
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      className={`neuro-button ${active ? 'active' : ''} flex items-center gap-3 px-4 py-3 w-full text-left`}
                      style={{ color: active ? "#555" : "#888" }}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2 px-2" style={{ color: "#aaa" }}>
                INTEGRATIONS
              </p>
              <div className="space-y-1">
                {integrations.map((item) => {
                  const active = isActive(item.page);
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      className={`neuro-button ${active ? 'active' : ''} flex items-center gap-3 px-4 py-3 w-full text-left`}
                      style={{ color: active ? "#555" : "#888" }}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2 px-2" style={{ color: "#aaa" }}>
                CRM SETTINGS
              </p>
              <div className="space-y-1">
                <Link
                  to={createPageUrl("AppSync")}
                  className={`neuro-button ${isActive("AppSync") ? 'active' : ''} flex items-center gap-3 px-4 py-3 w-full text-left`}
                  style={{ color: isActive("AppSync") ? "#555" : "#888" }}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">App Sync</span>
                </Link>
                <Link
                  to={createPageUrl("APISettings")}
                  className={`neuro-button ${isActive("APISettings") ? 'active' : ''} flex items-center gap-3 px-4 py-3 w-full text-left`}
                  style={{ color: isActive("APISettings") ? "#555" : "#888" }}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">API Settings</span>
                </Link>
              </div>
            </div>
          </nav>

          {/* User Info */}
          {user && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: "#d0d0d0" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="neuro-inset w-10 h-10 rounded-full flex items-center justify-center">
                  <span className="font-semibold" style={{ color: "#666" }}>
                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#666" }}>
                    {user.full_name || "User"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#999" }}>
                    {user.role || "User"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="neuro-button w-full px-4 py-2 flex items-center justify-center gap-2"
                style={{ color: "#888" }}
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