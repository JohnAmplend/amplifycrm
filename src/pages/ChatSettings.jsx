import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Settings, Palette, Sparkles, Save, CheckCircle, Layout, 
  MessageSquare, Type, Image, Zap, Globe, Lock, AlertCircle,
  Sliders, Eye, Code, Shield, Users
} from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function ChatSettings() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [activeTab, setActiveTab] = useState("appearance");

  const [formData, setFormData] = useState({
    // AI Settings
    openai_api_key: "",
    gpt_model: "gpt-4o-mini",
    gpt_assistant_id: "",
    ai_enabled: false,
    auto_reply_enabled: false,
    system_prompt: "You are a helpful customer service assistant.",
    
    // Colors
    primary_color: "#00A86B",
    secondary_color: "#00C87A",
    user_bubble_color: "#4a90e2",
    bot_bubble_color: "#f3f4f6",
    header_bg_color: "#00A86B",
    header_text_color: "#ffffff",
    text_color_user: "#ffffff",
    text_color_bot: "#333333",
    link_color: "#4a90e2",
    input_bg_color: "#ffffff",
    
    // Layout
    widget_position: "bottom-right",
    widget_width: "400px",
    widget_height: "600px",
    border_radius: 16,
    shadow_depth: "soft",
    background_type: "gradient",
    opacity: 0.95,
    theme_mode: "light",
    
    // Header
    header_enabled: true,
    header_height: 60,
    logo_url: "",
    logo_size: 24,
    brand_name: "Chat with us",
    brand_tagline: "We typically reply instantly",
    header_gradient: true,
    header_divider: false,
    close_button_style: "icon",
    
    // Messages
    bubble_border_radius: 12,
    bubble_padding: 12,
    bubble_shadow: false,
    message_spacing: 12,
    timestamp_display: true,
    timestamp_format: "12h",
    message_alignment: "left",
    group_messages: true,
    typing_indicator: "dots",
    
    // Typography
    font_family: "Poppins, sans-serif",
    font_weight: "normal",
    font_size_user: 14,
    font_size_bot: 14,
    line_height: 1.5,
    
    // Input
    input_placeholder: "Type your message...",
    input_height: 50,
    input_border_radius: 8,
    multiline_input: true,
    character_limit: 1000,
    enter_key_sends: true,
    attachments_enabled: false,
    
    // Buttons
    quick_replies_enabled: true,
    button_style: "solid",
    button_shape: "rounded",
    
    // Animations
    open_animation: "scale",
    message_animation: "fade",
    smooth_scroll: true,
    reduced_motion: false,
    
    // Behavior
    auto_open: false,
    auto_open_delay: 3,
    auto_open_scroll: 0,
    exit_intent_trigger: false,
    persist_conversation: true,
    inactivity_timeout: 30,
    welcome_message: "Hi! How can we help you today?",
    welcome_delay: 1,
    
    // Personalization
    show_user_name: true,
    show_user_avatar: false,
    bot_avatar_url: "",
    avatar_shape: "circle",
    personalized_greeting: true,
    
    // Media
    images_enabled: true,
    videos_enabled: false,
    audio_enabled: false,
    rich_cards_enabled: false,
    
    // Links
    links_new_tab: true,
    track_clicks: true,
    link_previews: false,
    
    // Accessibility
    screen_reader_support: true,
    keyboard_navigation: true,
    
    // Localization
    default_language: "en",
    auto_detect_language: false,
    rtl_support: false,
    
    // Error States
    offline_message: "We're currently offline. Please leave a message.",
    error_message: "Oops! Something went wrong. Please try again.",
    
    // Performance
    lazy_load: true,
    message_limit: 100,
    
    // Privacy
    consent_banner: false,
    consent_text: "",
    privacy_link: "",
    
    // Security
    captcha_enabled: false,
    rate_limit_messages: 10,
    
    // White Label
    remove_branding: false,
    custom_domain: "",
    
    // Debug
    debug_mode: false,
    custom_css: ""
  });

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['chat-settings'],
    queryFn: () => base44.entities.Chat_Settings.list()
  });

  useEffect(() => {
    if (settings.length > 0) {
      const s = settings[0];
      setSettingsId(s.id);
      setFormData({
        openai_api_key: s.openai_api_key || "",
        gpt_model: s.gpt_model || "gpt-4o-mini",
        gpt_assistant_id: s.gpt_assistant_id || "",
        ai_enabled: s.ai_enabled || false,
        auto_reply_enabled: s.auto_reply_enabled || false,
        system_prompt: s.system_prompt || "You are a helpful customer service assistant.",
        primary_color: s.primary_color || "#00A86B",
        secondary_color: s.secondary_color || "#00C87A",
        user_bubble_color: s.user_bubble_color || "#4a90e2",
        bot_bubble_color: s.bot_bubble_color || "#f3f4f6",
        header_bg_color: s.header_bg_color || "#00A86B",
        header_text_color: s.header_text_color || "#ffffff",
        text_color_user: s.text_color_user || "#ffffff",
        text_color_bot: s.text_color_bot || "#333333",
        link_color: s.link_color || "#4a90e2",
        input_bg_color: s.input_bg_color || "#ffffff",
        widget_position: s.widget_position || "bottom-right",
        widget_width: s.widget_width || "400px",
        widget_height: s.widget_height || "600px",
        border_radius: s.border_radius || 16,
        shadow_depth: s.shadow_depth || "soft",
        background_type: s.background_type || "gradient",
        opacity: s.opacity || 0.95,
        theme_mode: s.theme_mode || "light",
        header_enabled: s.header_enabled !== false,
        header_height: s.header_height || 60,
        logo_url: s.logo_url || "",
        logo_size: s.logo_size || 24,
        brand_name: s.brand_name || "Chat with us",
        brand_tagline: s.brand_tagline || "We typically reply instantly",
        header_gradient: s.header_gradient !== false,
        header_divider: s.header_divider || false,
        close_button_style: s.close_button_style || "icon",
        bubble_border_radius: s.bubble_border_radius || 12,
        bubble_padding: s.bubble_padding || 12,
        bubble_shadow: s.bubble_shadow || false,
        message_spacing: s.message_spacing || 12,
        timestamp_display: s.timestamp_display !== false,
        timestamp_format: s.timestamp_format || "12h",
        message_alignment: s.message_alignment || "left",
        group_messages: s.group_messages !== false,
        typing_indicator: s.typing_indicator || "dots",
        font_family: s.font_family || "Poppins, sans-serif",
        font_weight: s.font_weight || "normal",
        font_size_user: s.font_size_user || 14,
        font_size_bot: s.font_size_bot || 14,
        line_height: s.line_height || 1.5,
        input_placeholder: s.input_placeholder || "Type your message...",
        input_height: s.input_height || 50,
        input_border_radius: s.input_border_radius || 8,
        multiline_input: s.multiline_input !== false,
        character_limit: s.character_limit || 1000,
        enter_key_sends: s.enter_key_sends !== false,
        attachments_enabled: s.attachments_enabled || false,
        quick_replies_enabled: s.quick_replies_enabled !== false,
        button_style: s.button_style || "solid",
        button_shape: s.button_shape || "rounded",
        open_animation: s.open_animation || "scale",
        message_animation: s.message_animation || "fade",
        smooth_scroll: s.smooth_scroll !== false,
        reduced_motion: s.reduced_motion || false,
        auto_open: s.auto_open || false,
        auto_open_delay: s.auto_open_delay || 3,
        auto_open_scroll: s.auto_open_scroll || 0,
        exit_intent_trigger: s.exit_intent_trigger || false,
        persist_conversation: s.persist_conversation !== false,
        inactivity_timeout: s.inactivity_timeout || 30,
        welcome_message: s.welcome_message || "Hi! How can we help you today?",
        welcome_delay: s.welcome_delay || 1,
        show_user_name: s.show_user_name !== false,
        show_user_avatar: s.show_user_avatar || false,
        bot_avatar_url: s.bot_avatar_url || "",
        avatar_shape: s.avatar_shape || "circle",
        personalized_greeting: s.personalized_greeting !== false,
        images_enabled: s.images_enabled !== false,
        videos_enabled: s.videos_enabled || false,
        audio_enabled: s.audio_enabled || false,
        rich_cards_enabled: s.rich_cards_enabled || false,
        links_new_tab: s.links_new_tab !== false,
        track_clicks: s.track_clicks !== false,
        link_previews: s.link_previews || false,
        screen_reader_support: s.screen_reader_support !== false,
        keyboard_navigation: s.keyboard_navigation !== false,
        default_language: s.default_language || "en",
        auto_detect_language: s.auto_detect_language || false,
        rtl_support: s.rtl_support || false,
        offline_message: s.offline_message || "We're currently offline. Please leave a message.",
        error_message: s.error_message || "Oops! Something went wrong. Please try again.",
        lazy_load: s.lazy_load !== false,
        message_limit: s.message_limit || 100,
        consent_banner: s.consent_banner || false,
        consent_text: s.consent_text || "",
        privacy_link: s.privacy_link || "",
        captcha_enabled: s.captcha_enabled || false,
        rate_limit_messages: s.rate_limit_messages || 10,
        remove_branding: s.remove_branding || false,
        custom_domain: s.custom_domain || "",
        debug_mode: s.debug_mode || false,
        custom_css: s.custom_css || ""
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settingsId) {
        return base44.entities.Chat_Settings.update(settingsId, data);
      } else {
        return base44.entities.Chat_Settings.create(data);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['chat-settings']);
      if (!settingsId) setSettingsId(data.id);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (error) => {
      setIsSaving(false);
      alert('Failed to save: ' + error.message);
    }
  });

  const handleSave = () => {
    setIsSaving(true);
    saveMutation.mutate(formData);
  };

  const tabs = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "layout", label: "Layout & Position", icon: Layout },
    { id: "messages", label: "Messages & Bubbles", icon: MessageSquare },
    { id: "typography", label: "Typography", icon: Type },
    { id: "input", label: "Input Field", icon: Settings },
    { id: "behavior", label: "Behavior & Flow", icon: Zap },
    { id: "personalization", label: "Personalization", icon: Users },
    { id: "media", label: "Media & Rich Content", icon: Image },
    { id: "accessibility", label: "Accessibility", icon: Eye },
    { id: "localization", label: "Localization", icon: Globe },
    { id: "security", label: "Security & Privacy", icon: Shield },
    { id: "ai", label: "AI Assistant", icon: Sparkles },
    { id: "advanced", label: "Advanced", icon: Code }
  ];

  const Toggle = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between ampvibe-inset p-4 rounded-lg">
      <div>
        <p className="font-medium" style={{ color: "#666" }}>{label}</p>
        {description && <p className="text-sm" style={{ color: "#aaa" }}>{description}</p>}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="w-5 h-5" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Chat Widget Settings
            </h1>
            <p style={{ color: "#888" }}>
              Complete control over your chatbot appearance and behavior
            </p>
          </div>
          <div className="flex gap-3">
            {saveSuccess && (
              <div className="flex items-center gap-2 ampvibe-card px-4 py-2" style={{ color: "#52c41a" }}>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Saved!</span>
              </div>
            )}
            <NeuroButton variant="primary" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save All Settings'}
            </NeuroButton>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <NeuroCard>
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`ampvibe-button w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${
                        activeTab === tab.id ? 'active' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </NeuroCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <NeuroCard>
              {activeTab === "appearance" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Color Scheme</h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>Primary Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={formData.primary_color} onChange={(e) => setFormData({...formData, primary_color: e.target.value})} className="w-12 h-10 rounded-lg" />
                        <NeuroInput value={formData.primary_color} onChange={(e) => setFormData({...formData, primary_color: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>Secondary Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={formData.secondary_color} onChange={(e) => setFormData({...formData, secondary_color: e.target.value})} className="w-12 h-10 rounded-lg" />
                        <NeuroInput value={formData.secondary_color} onChange={(e) => setFormData({...formData, secondary_color: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>User Bubble Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={formData.user_bubble_color} onChange={(e) => setFormData({...formData, user_bubble_color: e.target.value})} className="w-12 h-10 rounded-lg" />
                        <NeuroInput value={formData.user_bubble_color} onChange={(e) => setFormData({...formData, user_bubble_color: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>Bot Bubble Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={formData.bot_bubble_color} onChange={(e) => setFormData({...formData, bot_bubble_color: e.target.value})} className="w-12 h-10 rounded-lg" />
                        <NeuroInput value={formData.bot_bubble_color} onChange={(e) => setFormData({...formData, bot_bubble_color: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <NeuroSelect
                    label="Theme Mode"
                    value={formData.theme_mode}
                    onChange={(e) => setFormData({...formData, theme_mode: e.target.value})}
                    options={[
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                      { value: "auto", label: "Auto (System)" }
                    ]}
                  />

                  <NeuroSelect
                    label="Shadow Depth"
                    value={formData.shadow_depth}
                    onChange={(e) => setFormData({...formData, shadow_depth: e.target.value})}
                    options={[
                      { value: "none", label: "None" },
                      { value: "soft", label: "Soft" },
                      { value: "strong", label: "Strong" }
                    ]}
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>Opacity ({formData.opacity})</label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="1" 
                      step="0.05" 
                      value={formData.opacity} 
                      onChange={(e) => setFormData({...formData, opacity: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {activeTab === "layout" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Position & Size</h2>
                  
                  <NeuroSelect
                    label="Widget Position"
                    value={formData.widget_position}
                    onChange={(e) => setFormData({...formData, widget_position: e.target.value})}
                    options={[
                      { value: "bottom-right", label: "Bottom Right" },
                      { value: "bottom-left", label: "Bottom Left" },
                      { value: "embedded", label: "Embedded" },
                      { value: "full-page", label: "Full Page" }
                    ]}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <NeuroInput label="Widget Width" value={formData.widget_width} onChange={(e) => setFormData({...formData, widget_width: e.target.value})} placeholder="400px" />
                    <NeuroInput label="Widget Height" value={formData.widget_height} onChange={(e) => setFormData({...formData, widget_height: e.target.value})} placeholder="600px" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>Border Radius ({formData.border_radius}px)</label>
                    <input type="range" min="0" max="30" value={formData.border_radius} onChange={(e) => setFormData({...formData, border_radius: parseInt(e.target.value)})} className="w-full" />
                  </div>

                  <Toggle 
                    checked={formData.header_enabled} 
                    onChange={(e) => setFormData({...formData, header_enabled: e.target.checked})}
                    label="Show Header"
                  />
                </div>
              )}

              {activeTab === "messages" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Message Bubbles</h2>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>Bubble Border Radius ({formData.bubble_border_radius}px)</label>
                    <input type="range" min="0" max="30" value={formData.bubble_border_radius} onChange={(e) => setFormData({...formData, bubble_border_radius: parseInt(e.target.value)})} className="w-full" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>Message Spacing ({formData.message_spacing}px)</label>
                    <input type="range" min="4" max="24" value={formData.message_spacing} onChange={(e) => setFormData({...formData, message_spacing: parseInt(e.target.value)})} className="w-full" />
                  </div>

                  <NeuroSelect
                    label="Timestamp Format"
                    value={formData.timestamp_format}
                    onChange={(e) => setFormData({...formData, timestamp_format: e.target.value})}
                    options={[
                      { value: "12h", label: "12 Hour" },
                      { value: "24h", label: "24 Hour" },
                      { value: "relative", label: "Relative (2m ago)" }
                    ]}
                  />

                  <NeuroSelect
                    label="Typing Indicator"
                    value={formData.typing_indicator}
                    onChange={(e) => setFormData({...formData, typing_indicator: e.target.value})}
                    options={[
                      { value: "dots", label: "Animated Dots" },
                      { value: "text", label: "Text Only" },
                      { value: "animation", label: "Full Animation" }
                    ]}
                  />

                  <Toggle checked={formData.timestamp_display} onChange={(e) => setFormData({...formData, timestamp_display: e.target.checked})} label="Show Timestamps" />
                  <Toggle checked={formData.group_messages} onChange={(e) => setFormData({...formData, group_messages: e.target.checked})} label="Group Consecutive Messages" />
                  <Toggle checked={formData.bubble_shadow} onChange={(e) => setFormData({...formData, bubble_shadow: e.target.checked})} label="Bubble Shadow" />
                </div>
              )}

              {activeTab === "typography" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Text Styling</h2>
                  
                  <NeuroInput label="Font Family" value={formData.font_family} onChange={(e) => setFormData({...formData, font_family: e.target.value})} />

                  <NeuroSelect
                    label="Font Weight"
                    value={formData.font_weight}
                    onChange={(e) => setFormData({...formData, font_weight: e.target.value})}
                    options={[
                      { value: "normal", label: "Normal" },
                      { value: "medium", label: "Medium" },
                      { value: "bold", label: "Bold" }
                    ]}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>User Font Size ({formData.font_size_user}px)</label>
                      <input type="range" min="10" max="20" value={formData.font_size_user} onChange={(e) => setFormData({...formData, font_size_user: parseInt(e.target.value)})} className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>Bot Font Size ({formData.font_size_bot}px)</label>
                      <input type="range" min="10" max="20" value={formData.font_size_bot} onChange={(e) => setFormData({...formData, font_size_bot: parseInt(e.target.value)})} className="w-full" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>Line Height ({formData.line_height})</label>
                    <input type="range" min="1" max="2" step="0.1" value={formData.line_height} onChange={(e) => setFormData({...formData, line_height: parseFloat(e.target.value)})} className="w-full" />
                  </div>
                </div>
              )}

              {activeTab === "input" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Input Field</h2>
                  
                  <NeuroInput label="Placeholder Text" value={formData.input_placeholder} onChange={(e) => setFormData({...formData, input_placeholder: e.target.value})} />

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>Input Height ({formData.input_height}px)</label>
                    <input type="range" min="40" max="80" value={formData.input_height} onChange={(e) => setFormData({...formData, input_height: parseInt(e.target.value)})} className="w-full" />
                  </div>

                  <NeuroInput label="Character Limit" type="number" value={formData.character_limit} onChange={(e) => setFormData({...formData, character_limit: parseInt(e.target.value)})} />

                  <Toggle checked={formData.multiline_input} onChange={(e) => setFormData({...formData, multiline_input: e.target.checked})} label="Multiline Input" />
                  <Toggle checked={formData.enter_key_sends} onChange={(e) => setFormData({...formData, enter_key_sends: e.target.checked})} label="Enter Key Sends Message" />
                  <Toggle checked={formData.attachments_enabled} onChange={(e) => setFormData({...formData, attachments_enabled: e.target.checked})} label="Enable File Attachments" />
                </div>
              )}

              {activeTab === "behavior" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Chat Behavior</h2>
                  
                  <Toggle checked={formData.auto_open} onChange={(e) => setFormData({...formData, auto_open: e.target.checked})} label="Auto-open on Page Load" />

                  {formData.auto_open && (
                    <NeuroInput label="Auto-open Delay (seconds)" type="number" value={formData.auto_open_delay} onChange={(e) => setFormData({...formData, auto_open_delay: parseInt(e.target.value)})} />
                  )}

                  <Toggle checked={formData.exit_intent_trigger} onChange={(e) => setFormData({...formData, exit_intent_trigger: e.target.checked})} label="Trigger on Exit Intent" />
                  <Toggle checked={formData.persist_conversation} onChange={(e) => setFormData({...formData, persist_conversation: e.target.checked})} label="Persist Conversation Across Sessions" />

                  <NeuroInput label="Inactivity Timeout (minutes)" type="number" value={formData.inactivity_timeout} onChange={(e) => setFormData({...formData, inactivity_timeout: parseInt(e.target.value)})} />

                  <NeuroInput label="Welcome Message" value={formData.welcome_message} onChange={(e) => setFormData({...formData, welcome_message: e.target.value})} />
                  
                  <NeuroInput label="Welcome Delay (seconds)" type="number" value={formData.welcome_delay} onChange={(e) => setFormData({...formData, welcome_delay: parseInt(e.target.value)})} />

                  <NeuroSelect
                    label="Open Animation"
                    value={formData.open_animation}
                    onChange={(e) => setFormData({...formData, open_animation: e.target.value})}
                    options={[
                      { value: "fade", label: "Fade" },
                      { value: "slide", label: "Slide" },
                      { value: "scale", label: "Scale" }
                    ]}
                  />

                  <Toggle checked={formData.smooth_scroll} onChange={(e) => setFormData({...formData, smooth_scroll: e.target.checked})} label="Smooth Scrolling" />
                  <Toggle checked={formData.reduced_motion} onChange={(e) => setFormData({...formData, reduced_motion: e.target.checked})} label="Reduced Motion (Accessibility)" />
                </div>
              )}

              {activeTab === "personalization" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Personalization</h2>
                  
                  <NeuroInput label="Brand Name" value={formData.brand_name} onChange={(e) => setFormData({...formData, brand_name: e.target.value})} />
                  <NeuroInput label="Brand Tagline" value={formData.brand_tagline} onChange={(e) => setFormData({...formData, brand_tagline: e.target.value})} />
                  <NeuroInput label="Logo URL" value={formData.logo_url} onChange={(e) => setFormData({...formData, logo_url: e.target.value})} />
                  <NeuroInput label="Bot Avatar URL" value={formData.bot_avatar_url} onChange={(e) => setFormData({...formData, bot_avatar_url: e.target.value})} />

                  <NeuroSelect
                    label="Avatar Shape"
                    value={formData.avatar_shape}
                    onChange={(e) => setFormData({...formData, avatar_shape: e.target.value})}
                    options={[
                      { value: "circle", label: "Circle" },
                      { value: "square", label: "Square" }
                    ]}
                  />

                  <Toggle checked={formData.show_user_name} onChange={(e) => setFormData({...formData, show_user_name: e.target.checked})} label="Show User Name" />
                  <Toggle checked={formData.show_user_avatar} onChange={(e) => setFormData({...formData, show_user_avatar: e.target.checked})} label="Show User Avatar" />
                  <Toggle checked={formData.personalized_greeting} onChange={(e) => setFormData({...formData, personalized_greeting: e.target.checked})} label="Personalized Greetings" />
                </div>
              )}

              {activeTab === "media" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Media & Rich Content</h2>
                  
                  <Toggle checked={formData.images_enabled} onChange={(e) => setFormData({...formData, images_enabled: e.target.checked})} label="Enable Images" />
                  <Toggle checked={formData.videos_enabled} onChange={(e) => setFormData({...formData, videos_enabled: e.target.checked})} label="Enable Videos" />
                  <Toggle checked={formData.audio_enabled} onChange={(e) => setFormData({...formData, audio_enabled: e.target.checked})} label="Enable Audio Messages" />
                  <Toggle checked={formData.rich_cards_enabled} onChange={(e) => setFormData({...formData, rich_cards_enabled: e.target.checked})} label="Enable Rich Cards" />
                  <Toggle checked={formData.links_new_tab} onChange={(e) => setFormData({...formData, links_new_tab: e.target.checked})} label="Open Links in New Tab" />
                  <Toggle checked={formData.track_clicks} onChange={(e) => setFormData({...formData, track_clicks: e.target.checked})} label="Track Link Clicks" />
                  <Toggle checked={formData.link_previews} onChange={(e) => setFormData({...formData, link_previews: e.target.checked})} label="Show Link Previews" />
                </div>
              )}

              {activeTab === "accessibility" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Accessibility</h2>
                  
                  <Toggle checked={formData.screen_reader_support} onChange={(e) => setFormData({...formData, screen_reader_support: e.target.checked})} label="Screen Reader Support" description="ARIA labels and semantic HTML" />
                  <Toggle checked={formData.keyboard_navigation} onChange={(e) => setFormData({...formData, keyboard_navigation: e.target.checked})} label="Keyboard Navigation" description="Navigate with Tab, Enter, Escape" />
                  <Toggle checked={formData.reduced_motion} onChange={(e) => setFormData({...formData, reduced_motion: e.target.checked})} label="Reduced Motion" description="Disable animations for accessibility" />
                </div>
              )}

              {activeTab === "localization" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Language & Localization</h2>
                  
                  <NeuroSelect
                    label="Default Language"
                    value={formData.default_language}
                    onChange={(e) => setFormData({...formData, default_language: e.target.value})}
                    options={[
                      { value: "en", label: "English" },
                      { value: "es", label: "Spanish" },
                      { value: "fr", label: "French" },
                      { value: "de", label: "German" },
                      { value: "ar", label: "Arabic" },
                      { value: "he", label: "Hebrew" }
                    ]}
                  />

                  <Toggle checked={formData.auto_detect_language} onChange={(e) => setFormData({...formData, auto_detect_language: e.target.checked})} label="Auto-detect User Language" />
                  <Toggle checked={formData.rtl_support} onChange={(e) => setFormData({...formData, rtl_support: e.target.checked})} label="RTL Language Support" description="Right-to-left languages like Arabic/Hebrew" />
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Security & Privacy</h2>
                  
                  <Toggle checked={formData.captcha_enabled} onChange={(e) => setFormData({...formData, captcha_enabled: e.target.checked})} label="Enable CAPTCHA" description="Prevent spam and bot abuse" />
                  
                  <NeuroInput label="Rate Limit (messages/min)" type="number" value={formData.rate_limit_messages} onChange={(e) => setFormData({...formData, rate_limit_messages: parseInt(e.target.value)})} />

                  <Toggle checked={formData.consent_banner} onChange={(e) => setFormData({...formData, consent_banner: e.target.checked})} label="Show Consent Banner" />

                  {formData.consent_banner && (
                    <>
                      <NeuroInput label="Consent Text" value={formData.consent_text} onChange={(e) => setFormData({...formData, consent_text: e.target.value})} placeholder="We use cookies to improve your experience" />
                      <NeuroInput label="Privacy Policy Link" value={formData.privacy_link} onChange={(e) => setFormData({...formData, privacy_link: e.target.value})} placeholder="https://example.com/privacy" />
                    </>
                  )}

                  <NeuroInput label="Offline Message" value={formData.offline_message} onChange={(e) => setFormData({...formData, offline_message: e.target.value})} />
                  <NeuroInput label="Error Message" value={formData.error_message} onChange={(e) => setFormData({...formData, error_message: e.target.value})} />
                </div>
              )}

              {activeTab === "ai" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>AI Assistant Configuration</h2>
                  
                  <Toggle checked={formData.ai_enabled} onChange={(e) => setFormData({...formData, ai_enabled: e.target.checked})} label="Enable AI Assistant" description="Use OpenAI to power responses" />
                  <Toggle checked={formData.auto_reply_enabled} onChange={(e) => setFormData({...formData, auto_reply_enabled: e.target.checked})} label="Auto-reply with AI" description="Automatically respond to messages" />

                  <NeuroInput label="OpenAI API Key" type="password" value={formData.openai_api_key} onChange={(e) => setFormData({...formData, openai_api_key: e.target.value})} placeholder="sk-..." />

                  <NeuroSelect
                    label="GPT Model"
                    value={formData.gpt_model}
                    onChange={(e) => setFormData({...formData, gpt_model: e.target.value})}
                    options={[
                      { value: "gpt-4o", label: "GPT-4o (Most Capable)" },
                      { value: "gpt-4o-mini", label: "GPT-4o Mini (Balanced)" },
                      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
                      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Fastest)" }
                    ]}
                  />

                  <NeuroInput label="Custom GPT Assistant ID" value={formData.gpt_assistant_id} onChange={(e) => setFormData({...formData, gpt_assistant_id: e.target.value})} placeholder="asst_..." />

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>System Prompt</label>
                    <textarea value={formData.system_prompt} onChange={(e) => setFormData({...formData, system_prompt: e.target.value})} className="ampvibe-input w-full min-h-[120px]" />
                  </div>

                  <div className="ampvibe-inset p-4 rounded-lg">
                    <p className="text-sm mb-2 font-medium" style={{ color: "#666" }}>How to use Custom GPT:</p>
                    <ol className="text-sm space-y-1 ml-4 list-decimal" style={{ color: "#888" }}>
                      <li>Visit <a href="https://platform.openai.com/assistants" target="_blank" className="text-blue-600">OpenAI Assistants</a></li>
                      <li>Create or select your GPT Assistant</li>
                      <li>Copy the Assistant ID (starts with "asst_")</li>
                      <li>Paste it above</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeTab === "advanced" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Advanced Settings</h2>
                  
                  <Toggle checked={formData.lazy_load} onChange={(e) => setFormData({...formData, lazy_load: e.target.checked})} label="Lazy Load Widget" description="Load widget only when needed" />
                  
                  <NeuroInput label="Message History Limit" type="number" value={formData.message_limit} onChange={(e) => setFormData({...formData, message_limit: parseInt(e.target.value)})} />

                  <Toggle checked={formData.remove_branding} onChange={(e) => setFormData({...formData, remove_branding: e.target.checked})} label="Remove Platform Branding" description="White-label the chat widget" />
                  
                  <NeuroInput label="Custom Domain" value={formData.custom_domain} onChange={(e) => setFormData({...formData, custom_domain: e.target.value})} placeholder="chat.yourdomain.com" />

                  <Toggle checked={formData.debug_mode} onChange={(e) => setFormData({...formData, debug_mode: e.target.checked})} label="Debug Mode" description="Show console logs and errors" />

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>Custom CSS</label>
                    <textarea value={formData.custom_css} onChange={(e) => setFormData({...formData, custom_css: e.target.value})} className="ampvibe-input w-full min-h-[200px] font-mono text-sm" placeholder=".chat-bubble { ... }" />
                  </div>
                </div>
              )}
            </NeuroCard>
          </div>
        </div>
      </div>
    </div>
  );
}