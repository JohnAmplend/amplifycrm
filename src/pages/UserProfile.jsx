import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  User, Mail, Bell, Zap, Settings, Camera, Save, X, 
  CheckCircle, Globe, Calendar, Clock, Palette, Layout,
  Smartphone, Monitor, Moon, Sun, Upload, Link as LinkIcon
} from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function UserProfile() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    team: "",
    territory: "",
    bio: "",
    time_zone: "",
    language: "en",
    date_format: "MM/DD/YYYY",
    profile_photo_url: "",
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    browser_notifications: true,
    task_reminders: true,
    deal_updates: true,
    ticket_assignments: true,
    mentions: true,
    daily_digest: false,
    weekly_report: false,
  });

  const [quickActions, setQuickActions] = useState([]);
  const [newActionName, setNewActionName] = useState("");
  const [newActionUrl, setNewActionUrl] = useState("");

  const [preferences, setPreferences] = useState({
    default_view_mode: "table",
    items_per_page: 20,
    theme_preference: "light",
    sidebar_collapsed: false,
  });

  useEffect(() => {
    base44.auth.me().then((user) => {
      setCurrentUser(user);
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        team: user.team || "",
        territory: user.territory || "",
        bio: user.bio || "",
        time_zone: user.time_zone || "",
        language: user.language || "en",
        date_format: user.date_format || "MM/DD/YYYY",
        profile_photo_url: user.profile_photo_url || "",
      });
      setNotificationPrefs(user.notification_preferences || notificationPrefs);
      setQuickActions(user.quick_actions || []);
      setPreferences({
        default_view_mode: user.default_view_mode || "table",
        items_per_page: user.items_per_page || 20,
        theme_preference: user.theme_preference || "light",
        sidebar_collapsed: user.sidebar_collapsed || false,
      });
    }).catch(() => {});
  }, []);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      setIsSaving(false);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
      // Refresh user data
      base44.auth.me().then(setCurrentUser);
    },
    onError: (error) => {
      setIsSaving(false);
      alert('Failed to save changes: ' + error.message);
    }
  });

  const handleSaveProfile = () => {
    setIsSaving(true);
    updateMutation.mutate(formData);
  };

  const handleSaveNotifications = () => {
    setIsSaving(true);
    updateMutation.mutate({ notification_preferences: notificationPrefs });
  };

  const handleSavePreferences = () => {
    setIsSaving(true);
    updateMutation.mutate(preferences);
  };

  const handleAddQuickAction = () => {
    if (!newActionName || !newActionUrl) return;
    
    const newAction = {
      id: Date.now().toString(),
      name: newActionName,
      url: newActionUrl,
      icon: "Zap"
    };
    
    const updatedActions = [...quickActions, newAction];
    setQuickActions(updatedActions);
    updateMutation.mutate({ quick_actions: updatedActions });
    
    setNewActionName("");
    setNewActionUrl("");
  };

  const handleRemoveQuickAction = (actionId) => {
    const updatedActions = quickActions.filter(a => a.id !== actionId);
    setQuickActions(updatedActions);
    updateMutation.mutate({ quick_actions: updatedActions });
  };

  const handleConnectGmail = async () => {
    try {
      const response = await base44.functions.invoke('gmail/getGmailAuthUrl', {});
      if (response.data?.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (err) {
      alert('Failed to start Gmail connection: ' + err.message);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "gmail", label: "Gmail Integration", icon: Mail },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "shortcuts", label: "Quick Actions", icon: Zap },
    { id: "preferences", label: "Preferences", icon: Settings },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Account Settings
            </h1>
            <p style={{ color: "#888" }}>
              Manage your profile, integrations, and preferences
            </p>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-2 ampvibe-card px-4 py-2" style={{ color: "#52c41a" }}>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Changes saved successfully!</span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <NeuroCard>
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`ampvibe-button w-full flex items-center gap-3 px-4 py-3 text-left ${
                        activeTab === tab.id ? 'active' : ''
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </NeuroCard>

            {/* User Info Card */}
            <NeuroCard className="mt-6">
              <div className="text-center">
                <div className="ampvibe-inset w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)',
                  border: '3px solid rgba(255, 255, 255, 0.5)'
                }}>
                  {formData.profile_photo_url ? (
                    <img src={formData.profile_photo_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {formData.full_name?.charAt(0) || formData.email?.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="font-bold mb-1" style={{ color: "#666" }}>
                  {formData.full_name || "User"}
                </h3>
                <p className="text-sm mb-2" style={{ color: "#888" }}>
                  {currentUser?.role || "User"}
                </p>
                <p className="text-xs" style={{ color: "#aaa" }}>
                  {formData.email}
                </p>
              </div>
            </NeuroCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <NeuroCard>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                    Profile Information
                  </h2>
                  {!isEditing ? (
                    <NeuroButton onClick={() => setIsEditing(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </NeuroButton>
                  ) : (
                    <div className="flex gap-2">
                      <NeuroButton onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </NeuroButton>
                      <NeuroButton variant="primary" onClick={handleSaveProfile} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </NeuroButton>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NeuroInput
                    label="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!isEditing}
                  />
                  <NeuroInput
                    label="Email"
                    value={formData.email}
                    disabled
                  />
                  <NeuroInput
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                  <NeuroInput
                    label="Team"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    disabled={!isEditing}
                  />
                  <NeuroInput
                    label="Territory"
                    value={formData.territory}
                    onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                    disabled={!isEditing}
                  />
                  <NeuroSelect
                    label="Time Zone"
                    value={formData.time_zone}
                    onChange={(e) => setFormData({ ...formData, time_zone: e.target.value })}
                    disabled={!isEditing}
                    options={[
                      { value: "America/New_York", label: "Eastern Time" },
                      { value: "America/Chicago", label: "Central Time" },
                      { value: "America/Denver", label: "Mountain Time" },
                      { value: "America/Los_Angeles", label: "Pacific Time" },
                      { value: "Europe/London", label: "London" },
                      { value: "Europe/Paris", label: "Paris" },
                      { value: "Asia/Tokyo", label: "Tokyo" },
                    ]}
                  />
                  <NeuroSelect
                    label="Language"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    disabled={!isEditing}
                    options={[
                      { value: "en", label: "English" },
                      { value: "es", label: "Spanish" },
                      { value: "fr", label: "French" },
                      { value: "de", label: "German" },
                    ]}
                  />
                  <NeuroSelect
                    label="Date Format"
                    value={formData.date_format}
                    onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
                    disabled={!isEditing}
                    options={[
                      { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                      { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                      { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                    ]}
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      className="ampvibe-input w-full min-h-[100px]"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </NeuroCard>
            )}

            {/* Gmail Integration Tab */}
            {activeTab === "gmail" && (
              <NeuroCard>
                <h2 className="text-2xl font-bold mb-6" style={{ color: "#666" }}>
                  Gmail Integration
                </h2>

                {currentUser?.gmail_connected ? (
                  <div className="space-y-6">
                    <div className="ampvibe-inset p-6 rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="ampvibe-card p-4 rounded-lg">
                          <Mail className="w-8 h-8" style={{ color: "#00A86B" }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold" style={{ color: "#666" }}>Connected Account</h3>
                            <span className="ampvibe-button px-2 py-1 text-xs" style={{ color: "#52c41a" }}>
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Active
                            </span>
                          </div>
                          <p className="text-sm mb-4" style={{ color: "#888" }}>
                            {currentUser.gmail_email}
                          </p>
                          <div className="flex gap-3">
                            <NeuroButton size="sm">
                              Sync Now
                            </NeuroButton>
                            <NeuroButton size="sm">
                              Disconnect
                            </NeuroButton>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ampvibe-inset p-6 rounded-lg">
                      <h4 className="font-bold mb-4" style={{ color: "#666" }}>Sync Settings</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-5 h-5" />
                          <span style={{ color: "#666" }}>Auto-sync emails every hour</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-5 h-5" />
                          <span style={{ color: "#666" }}>Match emails to contacts automatically</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-5 h-5" />
                          <span style={{ color: "#666" }}>Match emails to deals by subject/content</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5" />
                          <span style={{ color: "#666" }}>Create activity records for all synced emails</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="ampvibe-inset w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Mail className="w-10 h-10" style={{ color: "#888" }} />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: "#666" }}>
                      Connect Your Gmail Account
                    </h3>
                    <p className="mb-6 max-w-md mx-auto" style={{ color: "#888" }}>
                      Integrate your Gmail to automatically sync emails with contacts, deals, and create activity timelines. 
                      All synced data is secure and only accessible to you.
                    </p>
                    <NeuroButton variant="primary" onClick={handleConnectGmail}>
                      <Mail className="w-5 h-5 mr-2" />
                      Connect Gmail Account
                    </NeuroButton>
                    
                    <div className="mt-8 ampvibe-inset p-6 rounded-lg text-left max-w-2xl mx-auto">
                      <h4 className="font-bold mb-3" style={{ color: "#666" }}>What you'll get:</h4>
                      <ul className="space-y-2" style={{ color: "#888" }}>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#52c41a" }} />
                          <span>Automatic email association with contacts and deals</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#52c41a" }} />
                          <span>AI-powered email-to-property matching using address detection</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#52c41a" }} />
                          <span>Drag-and-drop emails to deals manually</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#52c41a" }} />
                          <span>Complete activity timeline on every record</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#52c41a" }} />
                          <span>Secure OAuth 2.0 authentication</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </NeuroCard>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <NeuroCard>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                    Notification Preferences
                  </h2>
                  <NeuroButton variant="primary" onClick={handleSaveNotifications} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </NeuroButton>
                </div>

                <div className="space-y-6">
                  <div className="ampvibe-inset p-6 rounded-lg">
                    <h3 className="font-bold mb-4" style={{ color: "#666" }}>Notification Channels</h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5" style={{ color: "#888" }} />
                          <div>
                            <p className="font-medium" style={{ color: "#666" }}>Email Notifications</p>
                            <p className="text-sm" style={{ color: "#aaa" }}>Receive notifications via email</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationPrefs.email_notifications}
                          onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email_notifications: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Monitor className="w-5 h-5" style={{ color: "#888" }} />
                          <div>
                            <p className="font-medium" style={{ color: "#666" }}>Browser Notifications</p>
                            <p className="text-sm" style={{ color: "#aaa" }}>Desktop push notifications</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationPrefs.browser_notifications}
                          onChange={(e) => setNotificationPrefs({ ...notificationPrefs, browser_notifications: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="ampvibe-inset p-6 rounded-lg">
                    <h3 className="font-bold mb-4" style={{ color: "#666" }}>Activity Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span style={{ color: "#666" }}>Task Reminders</span>
                        <input
                          type="checkbox"
                          checked={notificationPrefs.task_reminders}
                          onChange={(e) => setNotificationPrefs({ ...notificationPrefs, task_reminders: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span style={{ color: "#666" }}>Deal Updates</span>
                        <input
                          type="checkbox"
                          checked={notificationPrefs.deal_updates}
                          onChange={(e) => setNotificationPrefs({ ...notificationPrefs, deal_updates: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span style={{ color: "#666" }}>Ticket Assignments</span>
                        <input
                          type="checkbox"
                          checked={notificationPrefs.ticket_assignments}
                          onChange={(e) => setNotificationPrefs({ ...notificationPrefs, ticket_assignments: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span style={{ color: "#666" }}>@Mentions</span>
                        <input
                          type="checkbox"
                          checked={notificationPrefs.mentions}
                          onChange={(e) => setNotificationPrefs({ ...notificationPrefs, mentions: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="ampvibe-inset p-6 rounded-lg">
                    <h3 className="font-bold mb-4" style={{ color: "#666" }}>Digest Emails</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium" style={{ color: "#666" }}>Daily Digest</p>
                          <p className="text-sm" style={{ color: "#aaa" }}>Summary of activities sent every morning</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationPrefs.daily_digest}
                          onChange={(e) => setNotificationPrefs({ ...notificationPrefs, daily_digest: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium" style={{ color: "#666" }}>Weekly Report</p>
                          <p className="text-sm" style={{ color: "#aaa" }}>Performance summary sent every Monday</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationPrefs.weekly_report}
                          onChange={(e) => setNotificationPrefs({ ...notificationPrefs, weekly_report: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </NeuroCard>
            )}

            {/* Quick Actions Tab */}
            {activeTab === "shortcuts" && (
              <NeuroCard>
                <h2 className="text-2xl font-bold mb-6" style={{ color: "#666" }}>
                  Quick Actions & Shortcuts
                </h2>

                <div className="ampvibe-inset p-6 rounded-lg mb-6">
                  <h3 className="font-bold mb-4" style={{ color: "#666" }}>Add New Quick Action</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <NeuroInput
                      label="Action Name"
                      value={newActionName}
                      onChange={(e) => setNewActionName(e.target.value)}
                      placeholder="e.g., Create Deal, Log Call"
                    />
                    <NeuroInput
                      label="Page URL"
                      value={newActionUrl}
                      onChange={(e) => setNewActionUrl(e.target.value)}
                      placeholder="e.g., Deals?action=new"
                    />
                  </div>
                  <NeuroButton onClick={handleAddQuickAction}>
                    <Zap className="w-4 h-4 mr-2" />
                    Add Quick Action
                  </NeuroButton>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold mb-4" style={{ color: "#666" }}>Your Quick Actions</h3>
                  {quickActions.length === 0 ? (
                    <div className="text-center py-12 ampvibe-inset rounded-lg">
                      <Zap className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
                      <p style={{ color: "#aaa" }}>No quick actions yet. Add your first one above!</p>
                    </div>
                  ) : (
                    quickActions.map((action) => (
                      <div key={action.id} className="ampvibe-inset p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5" style={{ color: "#00A86B" }} />
                          <div>
                            <p className="font-medium" style={{ color: "#666" }}>{action.name}</p>
                            <p className="text-sm" style={{ color: "#aaa" }}>{action.url}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveQuickAction(action.id)}
                          className="ampvibe-button p-2"
                        >
                          <X className="w-4 h-4" style={{ color: "#f5222d" }} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </NeuroCard>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <NeuroCard>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                    Display & Behavior Preferences
                  </h2>
                  <NeuroButton variant="primary" onClick={handleSavePreferences} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </NeuroButton>
                </div>

                <div className="space-y-6">
                  <div className="ampvibe-inset p-6 rounded-lg">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "#666" }}>
                      <Layout className="w-5 h-5" />
                      Default View Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <NeuroSelect
                        label="Default View Mode"
                        value={preferences.default_view_mode}
                        onChange={(e) => setPreferences({ ...preferences, default_view_mode: e.target.value })}
                        options={[
                          { value: "table", label: "Table View" },
                          { value: "kanban", label: "Kanban Board" },
                          { value: "list", label: "List View" },
                        ]}
                      />
                      <NeuroSelect
                        label="Items Per Page"
                        value={preferences.items_per_page}
                        onChange={(e) => setPreferences({ ...preferences, items_per_page: parseInt(e.target.value) })}
                        options={[
                          { value: "10", label: "10 items" },
                          { value: "20", label: "20 items" },
                          { value: "30", label: "30 items" },
                          { value: "50", label: "50 items" },
                          { value: "100", label: "100 items" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="ampvibe-inset p-6 rounded-lg">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "#666" }}>
                      <Palette className="w-5 h-5" />
                      Appearance
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-3" style={{ color: "#666" }}>
                          Theme Preference
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => setPreferences({ ...preferences, theme_preference: "light" })}
                            className={`ampvibe-button p-4 flex flex-col items-center gap-2 ${
                              preferences.theme_preference === "light" ? 'active' : ''
                            }`}
                          >
                            <Sun className="w-6 h-6" />
                            <span className="text-sm">Light</span>
                          </button>
                          <button
                            onClick={() => setPreferences({ ...preferences, theme_preference: "dark" })}
                            className={`ampvibe-button p-4 flex flex-col items-center gap-2 ${
                              preferences.theme_preference === "dark" ? 'active' : ''
                            }`}
                          >
                            <Moon className="w-6 h-6" />
                            <span className="text-sm">Dark</span>
                          </button>
                          <button
                            onClick={() => setPreferences({ ...preferences, theme_preference: "auto" })}
                            className={`ampvibe-button p-4 flex flex-col items-center gap-2 ${
                              preferences.theme_preference === "auto" ? 'active' : ''
                            }`}
                          >
                            <Monitor className="w-6 h-6" />
                            <span className="text-sm">Auto</span>
                          </button>
                        </div>
                      </div>

                      <label className="flex items-center justify-between cursor-pointer">
                        <span style={{ color: "#666" }}>Collapse Sidebar by Default</span>
                        <input
                          type="checkbox"
                          checked={preferences.sidebar_collapsed}
                          onChange={(e) => setPreferences({ ...preferences, sidebar_collapsed: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </NeuroCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}