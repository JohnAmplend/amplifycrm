
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
  BarChart3,
  FileText,
  Copy,
  Box,
  BarChart,
  Target,
  Zap,
  Bell,
  Menu,
  X,
  ChevronDown,
  RefreshCw, // Added RefreshCw icon
  Plus, // Added Plus icon for new campaign
  TestTube2, // Added TestTube2 icon for A/B Testing
  Shield, // Added Shield icon for Roles & Permissions
  Sparkles, // Added Sparkles icon for Data Enrichment
  User as UserIcon // Added UserIcon for profile
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import AIAssistant from "../components/crm/AIAssistant";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      try {
        const notifications = await base44.entities.Notifications.filter({ user_id: u.email, is_read: false });
        setUnreadNotifications(notifications.length);
      } catch (e) {}
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isActive = (page) => {
    return location.pathname === createPageUrl(page);
  };

  const megaMenuData = {
    'CRM & Sales': {
      sections: [
        {
          title: 'Core CRM',
          items: [
            { name: "Contacts", icon: Users, page: "Contacts" },
            { name: "Companies", icon: Building2, page: "Companies" },
            { name: "Deals", icon: DollarSign, page: "Deals" },
            { name: "Leads", icon: UserPlus, page: "Leads" }
          ]
        },
        {
          title: 'Activities',
          items: [
            { name: "All Activities", icon: Activity, page: "Activities" },
            { name: "Tasks", icon: CheckSquare, page: "Tasks" }
          ]
        },
        {
          title: 'Data Management',
          items: [
            { name: "Import", icon: Upload, page: "Import" },
            { name: "Documents", icon: FileText, page: "Documents" },
            { name: "Lead Scoring", icon: Target, page: "LeadScoring" }
          ]
        }
      ]
    },
    'Marketing': {
      sections: [
        {
          title: 'Email Marketing',
          items: [
            { name: "Campaigns", icon: Send, page: "Campaigns" },
            { name: "Create Campaign", icon: Plus, page: "EmailCampaignBuilder" },
            { name: "Email Templates", icon: Mail, page: "EmailTemplates" },
            { name: "Sequences", icon: Layers, page: "EmailSequences" },
            { name: "Contact Lists", icon: List, page: "ContactLists" },
            { name: "A/B Testing", icon: TestTube2, page: "ABTesting" }
          ]
        },
        {
          title: 'Website',
          items: [
            { name: "Forms", icon: Layers, page: "Forms" },
            { name: "Form Submissions", icon: Send, page: "FormSubmissions" },
            { name: "Website Tracking", icon: BarChart3, page: "WebsiteTracking" },
            { name: "Knowledge Base", icon: MessageSquare, page: "KnowledgeBase" }
          ]
        }
      ]
    },
    'Service': {
      sections: [
        {
          title: 'Ticketing',
          items: [
            { name: "Tickets Dashboard", icon: LayoutDashboard, page: "TicketsDashboard" },
            { name: "All Tickets", icon: Ticket, page: "AllTickets" },
            { name: "My Tickets", icon: Ticket, page: "MyTickets" }
          ]
        },
        {
          title: 'Support Tools',
          items: [
            { name: "Canned Responses", icon: MessageSquare, page: "CannedResponses" },
            { name: "SLA Policies", icon: Clock, page: "SLAPolicies" }
          ]
        }
      ]
    },
    'Analytics': {
      sections: [
        {
          title: 'Reporting',
          items: [
            { name: "Advanced Reports", icon: BarChart, page: "AdvancedReports" },
            { name: "Custom Reports", icon: FileText, page: "CustomReportBuilder" },
            { name: "Dashboards", icon: LayoutDashboard, page: "Dashboards" },
            { name: "Reports", icon: BarChart, page: "Reports" },
            { name: "Goals", icon: Target, page: "Goals" }
          ]
        },
        {
          title: 'Automation',
          items: [
            { name: "Workflows", icon: Zap, page: "Workflows" }
          ]
        },
        {
          title: 'Integrations',
          items: [
            { name: "Sync Status", icon: BarChart3, page: "SyncStatus" },
            { name: "HubSpot Sync", icon: RefreshCw, page: "HubSpotSync" },
            { name: "RingCentral", icon: Phone, page: "RingCentral" }
          ]
        }
      ]
    },
    'Settings': {
      sections: [
        {
          title: 'System',
          items: [
            { name: "Roles & Permissions", icon: Shield, page: "RolesPermissions" },
            { name: "Data Enrichment", icon: Sparkles, page: "DataEnrichment" }
          ]
        },
        {
          title: 'Advanced',
          items: [
            { name: "Duplicate Management", icon: Copy, page: "DuplicateManagement" },
            { name: "Custom Objects", icon: Box, page: "CustomObjects" }
          ]
        },
        {
          title: 'App Settings',
          items: [
            { name: "App Sync", icon: Settings, page: "AppSync" },
            { name: "API Settings", icon: Settings, page: "APISettings" }
          ]
        }
      ]
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ 
      background: 'linear-gradient(135deg, #F5F7FA 0%, #E6F0FA 100%)'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .ampvibe-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px rgba(30, 58, 138, 0.1); transition: all 0.3s ease-in-out; }
        .ampvibe-card:hover { box-shadow: 0 12px 40px rgba(30, 58, 138, 0.15); transform: translateY(-2px); }
        .ampvibe-inset { background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: inset 0 2px 8px rgba(30, 58, 138, 0.05); }
        .ampvibe-button { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 4px 16px rgba(30, 58, 138, 0.08); transition: all 0.3s ease-in-out; cursor: pointer; color: #333333; }
        .ampvibe-button:hover { background: rgba(255, 255, 255, 0.8); box-shadow: 0 6px 20px rgba(30, 58, 138, 0.12); transform: scale(1.02) translateY(-1px); }
        .ampvibe-button:active, .ampvibe-button.active { background: rgba(0, 168, 107, 0.15); border-color: rgba(0, 168, 107, 0.3); color: #00A86B; box-shadow: 0 2px 8px rgba(0, 168, 107, 0.2); }
        .ampvibe-button-primary { background: linear-gradient(135deg, #00A86B 0%, #00C87A 100%); color: white; border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 4px 16px rgba(0, 168, 107, 0.25); }
        .ampvibe-button-primary:hover { background: linear-gradient(135deg, #00C87A 0%, #00E089 100%); box-shadow: 0 6px 24px rgba(0, 168, 107, 0.35); transform: scale(1.05) translateY(-2px); }
        .ampvibe-input { background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.3); padding: 12px 16px; outline: none; color: #333333; box-shadow: inset 0 2px 8px rgba(30, 58, 138, 0.05); transition: all 0.3s ease-in-out; }
        .ampvibe-input:focus { background: rgba(255, 255, 255, 0.7); border-color: rgba(0, 168, 107, 0.5); box-shadow: 0 0 0 3px rgba(0, 168, 107, 0.1), inset 0 2px 8px rgba(30, 58, 138, 0.05); }
        .ampvibe-input::placeholder { color: rgba(51, 51, 51, 0.5); }
        * { scrollbar-width: thin; scrollbar-color: rgba(0, 168, 107, 0.3) rgba(255, 255, 255, 0.1); }
        *::-webkit-scrollbar { width: 8px; height: 8px; }
        *::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        *::-webkit-scrollbar-thumb { background: rgba(0, 168, 107, 0.3); border-radius: 10px; transition: all 0.3s ease; }
        *::-webkit-scrollbar-thumb:hover { background: rgba(0, 168, 107, 0.5); }
        h1, h2, h3, h4, h5, h6 { font-weight: 700; line-height: 1.2; }
        body, p, span, div { line-height: 1.5; }
        .mega-menu { position: absolute; top: 100%; left: 0; right: 0; opacity: 0; visibility: hidden; transition: all 0.3s ease; pointer-events: none; z-index: 1000; }
        .mega-menu.active { opacity: 1; visibility: visible; pointer-events: auto; }
        .nav-bar { position: sticky; top: 0; z-index: 999; }
      `}</style>

      {/* Top Navigation Bar */}
      <div className="ampvibe-card m-4 mb-0 nav-bar">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to={createPageUrl("Dashboard")}>
              <h1 className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity" style={{ 
                background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                AmplifyCRM
              </h1>
            </Link>

            {/* Desktop Mega Menu */}
            <nav className="hidden lg:flex items-center gap-1">
              {Object.keys(megaMenuData).map((category) => (
                <div 
                  key={category}
                  className="relative"
                  onMouseEnter={() => setActiveMegaMenu(category)}
                  onMouseLeave={() => setActiveMegaMenu(null)}
                >
                  <button className="ampvibe-button px-4 py-2 flex items-center gap-2">
                    {category}
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Mega Menu Dropdown */}
                  <div className={`mega-menu ${activeMegaMenu === category ? 'active' : ''}`}>
                    <div className="ampvibe-card mt-2 p-6 shadow-2xl" style={{ 
                      minWidth: '600px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(30px)',
                      WebkitBackdropFilter: 'blur(30px)'
                    }}>
                      <div className="grid grid-cols-2 gap-6">
                        {megaMenuData[category].sections.map((section) => (
                          <div key={section.title}>
                            <h3 className="font-bold mb-3 text-sm" style={{ color: "#1E3A8A" }}>
                              {section.title}
                            </h3>
                            <div className="space-y-1">
                              {section.items.map((item) => (
                                <Link
                                  key={item.page}
                                  to={createPageUrl(item.page)}
                                  className={`ampvibe-button ${isActive(item.page) ? 'active' : ''} flex items-center gap-3 px-3 py-2 w-full text-left text-sm`}
                                  onClick={() => setActiveMegaMenu(null)}
                                >
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.name}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden ampvibe-button p-2"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Notifications")} className="relative">
              <button className="ampvibe-button p-3 relative">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-3">
                <Link to={createPageUrl("UserProfile")}>
                  <div className="ampvibe-inset w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" style={{
                    background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)',
                    border: '2px solid rgba(255, 255, 255, 0.5)'
                  }}>
                    <span className="font-semibold text-white text-sm">
                      {user.full_name?.charAt(0) || user.email?.charAt(0)}
                    </span>
                  </div>
                </Link>
                <div className="min-w-0">
                  <Link to={createPageUrl("UserProfile")}>
                    <p className="text-sm font-medium truncate hover:opacity-80 transition-opacity cursor-pointer" style={{ color: "#333" }}>
                      {user.full_name || "User"}
                    </p>
                  </Link>
                  <p className="text-xs truncate" style={{ color: "#666" }}>
                    {user.role || "User"}
                  </p>
                </div>
                <button onClick={handleLogout} className="ampvibe-button p-2">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t px-4 py-4" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
            <Link
              to={createPageUrl("Dashboard")}
              className={`ampvibe-button ${isActive("Dashboard") ? 'active' : ''} flex items-center gap-3 px-4 py-3 w-full text-left text-sm mb-4`}
              onClick={() => setShowMobileMenu(false)}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="font-semibold">Dashboard</span>
            </Link>

            {Object.entries(megaMenuData).map(([category, data]) => (
              <div key={category} className="mb-4">
                <p className="text-xs font-semibold mb-2 px-2" style={{ color: "#1E3A8A" }}>
                  {category}
                </p>
                {data.sections.map((section) => (
                  <div key={section.title} className="mb-3">
                    <p className="text-xs font-medium mb-1 px-2" style={{ color: "#666" }}>
                      {section.title}
                    </p>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.page}
                          to={createPageUrl(item.page)}
                          className={`ampvibe-button ${isActive(item.page) ? 'active' : ''} flex items-center gap-3 px-4 py-2 w-full text-left text-sm`}
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {user && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                <Link
                  to={createPageUrl("UserProfile")}
                  className="flex items-center gap-3 mb-3"
                  onClick={() => setShowMobileMenu(false)}
                >
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
                </Link>
                <Link
                  to={createPageUrl("UserProfile")}
                  className="ampvibe-button w-full px-4 py-2 flex items-center justify-center gap-2 mb-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="text-sm">Account Settings</span>
                </Link>
                <button onClick={handleLogout} className="ampvibe-button w-full px-4 py-2 flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* AI Assistant - Global */}
      <AIAssistant />
    </div>
  );
}
