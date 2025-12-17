import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Palette, Sparkles, Save, CheckCircle } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function ChatSettings() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settingsId, setSettingsId] = useState(null);

  const [formData, setFormData] = useState({
    primary_color: "#00A86B",
    secondary_color: "#00C87A",
    openai_api_key: "",
    gpt_model: "gpt-4o-mini",
    gpt_assistant_id: "",
    ai_enabled: false,
    auto_reply_enabled: false,
    system_prompt: "You are a helpful customer service assistant."
  });

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['chat-settings'],
    queryFn: () => base44.entities.Chat_Settings.list()
  });

  useEffect(() => {
    if (settings.length > 0) {
      const existingSettings = settings[0];
      setSettingsId(existingSettings.id);
      setFormData({
        primary_color: existingSettings.primary_color || "#00A86B",
        secondary_color: existingSettings.secondary_color || "#00C87A",
        openai_api_key: existingSettings.openai_api_key || "",
        gpt_model: existingSettings.gpt_model || "gpt-4o-mini",
        gpt_assistant_id: existingSettings.gpt_assistant_id || "",
        ai_enabled: existingSettings.ai_enabled || false,
        auto_reply_enabled: existingSettings.auto_reply_enabled || false,
        system_prompt: existingSettings.system_prompt || "You are a helpful customer service assistant."
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
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-settings']);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (error) => {
      setIsSaving(false);
      alert('Failed to save settings: ' + error.message);
    }
  });

  const handleSave = () => {
    setIsSaving(true);
    saveMutation.mutate(formData);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Chat Widget Settings
            </h1>
            <p style={{ color: "#888" }}>
              Customize your chat widget appearance and AI assistant
            </p>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-2 ampvibe-card px-4 py-2" style={{ color: "#52c41a" }}>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Settings saved!</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* UI Customization */}
          <NeuroCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="ampvibe-button p-3 rounded-xl" style={{ background: formData.primary_color }}>
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                  UI Customization
                </h2>
                <p className="text-sm" style={{ color: "#888" }}>
                  Customize the chat widget colors
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                  Primary Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer"
                  />
                  <NeuroInput
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#00A86B"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                  Secondary Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer"
                  />
                  <NeuroInput
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    placeholder="#00C87A"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 ampvibe-inset p-6 rounded-lg">
              <p className="text-sm font-medium mb-4" style={{ color: "#666" }}>Preview</p>
              <div className="flex gap-4">
                <button
                  className="px-6 py-3 rounded-lg text-white font-medium"
                  style={{ background: `linear-gradient(135deg, ${formData.primary_color} 0%, ${formData.secondary_color} 100%)` }}
                >
                  Chat Button
                </button>
                <div
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ background: formData.primary_color }}
                >
                  Message Bubble
                </div>
              </div>
            </div>
          </NeuroCard>

          {/* AI Assistant Configuration */}
          <NeuroCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="ampvibe-button-primary p-3 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                  AI Assistant Configuration
                </h2>
                <p className="text-sm" style={{ color: "#888" }}>
                  Connect your OpenAI account and configure GPT
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between ampvibe-inset p-4 rounded-lg">
                <div>
                  <p className="font-medium" style={{ color: "#666" }}>Enable AI Assistant</p>
                  <p className="text-sm" style={{ color: "#aaa" }}>Turn on AI-powered responses</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.ai_enabled}
                  onChange={(e) => setFormData({ ...formData, ai_enabled: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between ampvibe-inset p-4 rounded-lg">
                <div>
                  <p className="font-medium" style={{ color: "#666" }}>Auto-Reply</p>
                  <p className="text-sm" style={{ color: "#aaa" }}>Automatically respond to messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_reply_enabled}
                  onChange={(e) => setFormData({ ...formData, auto_reply_enabled: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <NeuroInput
                label="OpenAI API Key"
                type="password"
                value={formData.openai_api_key}
                onChange={(e) => setFormData({ ...formData, openai_api_key: e.target.value })}
                placeholder="sk-..."
              />

              <NeuroSelect
                label="GPT Model"
                value={formData.gpt_model}
                onChange={(e) => setFormData({ ...formData, gpt_model: e.target.value })}
                options={[
                  { value: "gpt-4o", label: "GPT-4o (Most Capable)" },
                  { value: "gpt-4o-mini", label: "GPT-4o Mini (Balanced)" },
                  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
                  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Fastest)" }
                ]}
              />

              <NeuroInput
                label="Custom GPT Assistant ID (Optional)"
                value={formData.gpt_assistant_id}
                onChange={(e) => setFormData({ ...formData, gpt_assistant_id: e.target.value })}
                placeholder="asst_..."
              />

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                  System Prompt
                </label>
                <textarea
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  className="ampvibe-input w-full min-h-[120px]"
                  placeholder="Define how your AI assistant should behave..."
                />
              </div>

              <div className="ampvibe-inset p-4 rounded-lg">
                <p className="text-sm mb-2" style={{ color: "#666" }}>
                  <strong>How to get a Custom GPT Assistant ID:</strong>
                </p>
                <ol className="text-sm space-y-1 ml-4 list-decimal" style={{ color: "#888" }}>
                  <li>Go to <a href="https://platform.openai.com/assistants" target="_blank" className="text-blue-600">OpenAI Assistants</a></li>
                  <li>Create a new Assistant or select an existing one</li>
                  <li>Copy the Assistant ID (starts with "asst_")</li>
                  <li>Paste it in the field above</li>
                </ol>
              </div>
            </div>
          </NeuroCard>

          {/* Save Button */}
          <div className="flex justify-end">
            <NeuroButton variant="primary" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </NeuroButton>
          </div>
        </div>
      </div>
    </div>
  );
}