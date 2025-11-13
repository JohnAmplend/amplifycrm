import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Sparkles, X, Send, Loader2, MessageSquare, 
  Mail, FileText, TrendingUp, CheckSquare, Lightbulb,
  MinusCircle, Maximize2
} from "lucide-react";
import NeuroButton from "./NeuroButton";
import NeuroCard from "./NeuroCard";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState("chat");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const aiActions = [
    { id: "chat", label: "Chat", icon: MessageSquare, description: "Ask anything" },
    { id: "draft_email", label: "Draft Email", icon: Mail, description: "Write professional emails" },
    { id: "summarize_contact", label: "Summarize", icon: FileText, description: "Summarize records" },
    { id: "analyze_data", label: "Analyze", icon: TrendingUp, description: "Data insights" },
    { id: "generate_task_list", label: "Tasks", icon: CheckSquare, description: "Generate task lists" },
    { id: "suggest_next_steps", label: "Next Steps", icon: Lightbulb, description: "Get suggestions" },
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const { data } = await base44.functions.invoke('aiAssistant', {
        action: selectedAction,
        prompt: inputValue,
        context: {}
      });

      const aiMessage = {
        role: "assistant",
        content: typeof data.response === 'string' ? data.response : JSON.stringify(data.response, null, 2),
        timestamp: new Date().toISOString(),
        usage: data.usage
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = {
    chat: [
      "How can I improve my sales process?",
      "What are best practices for CRM management?",
      "Help me prioritize my tasks today"
    ],
    draft_email: [
      "Write a follow-up email to a lead who hasn't responded",
      "Draft a thank you email after a successful demo",
      "Create a cold outreach email for new prospects"
    ],
    analyze_data: [
      "What trends do you see in my recent deals?",
      "Analyze my contact engagement patterns",
      "Show me insights from this quarter's performance"
    ]
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 ampvibe-button-primary p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-50"
        style={{ width: "60px", height: "60px" }}
      >
        <Sparkles className="w-7 h-7" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <NeuroCard className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setIsMinimized(false)}>
          <Sparkles className="w-5 h-5" style={{ color: "#00A86B" }} />
          <span className="font-medium" style={{ color: "#666" }}>AI Assistant</span>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="ampvibe-button p-1">
            <X className="w-4 h-4" />
          </button>
        </NeuroCard>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50" style={{ width: "420px", maxWidth: "calc(100vw - 48px)" }}>
      <NeuroCard className="flex flex-col" style={{ height: "600px", maxHeight: "calc(100vh - 100px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="ampvibe-button-primary p-2 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold" style={{ color: "#666" }}>AI Assistant</h3>
              <p className="text-xs" style={{ color: "#aaa" }}>Powered by ChatGPT</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsMinimized(true)} className="ampvibe-button p-2">
              <MinusCircle className="w-4 h-4" />
            </button>
            <button onClick={() => setIsOpen(false)} className="ampvibe-button p-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Selector */}
        <div className="p-3 border-b overflow-x-auto" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <div className="flex gap-2">
            {aiActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  className={`ampvibe-button px-3 py-2 flex items-center gap-2 whitespace-nowrap ${
                    selectedAction === action.id ? 'active' : ''
                  }`}
                  title={action.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: "#00A86B" }} />
              <h4 className="font-bold mb-2" style={{ color: "#666" }}>
                Hi! I'm your AI Assistant
              </h4>
              <p className="text-sm mb-4" style={{ color: "#888" }}>
                I can help with emails, summaries, data analysis, and more.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: "#aaa" }}>Try asking:</p>
                {(quickPrompts[selectedAction] || quickPrompts.chat).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputValue(prompt)}
                    className="ampvibe-inset w-full text-left px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity"
                    style={{ color: "#666" }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'ampvibe-button-primary text-white'
                    : msg.isError
                    ? 'ampvibe-inset border border-red-300'
                    : 'ampvibe-inset'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap" style={msg.role === 'assistant' && !msg.isError ? { color: "#666" } : {}}>
                  {msg.content}
                </div>
                {msg.usage && (
                  <div className="text-xs mt-2 opacity-50">
                    {msg.usage.total_tokens} tokens
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="ampvibe-inset rounded-lg p-3">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#00A86B" }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask me to ${aiActions.find(a => a.id === selectedAction)?.description.toLowerCase()}...`}
              className="ampvibe-input flex-1 resize-none"
              rows="2"
              disabled={isLoading}
            />
            <NeuroButton
              variant="primary"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </NeuroButton>
          </div>
        </div>
      </NeuroCard>
    </div>
  );
}