import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, Send, Loader2, Plus, Trash2, Download,
  MessageSquare, Bot, User, Copy, Check, RotateCcw, X
} from "lucide-react";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroSelect from "../components/crm/NeuroSelect";
import { createPageUrl } from "@/utils";

export default function AmplifyAI() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([
    { id: 1, name: "New Chat", messages: [] }
  ]);
  const [activeConversationId, setActiveConversationId] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, activeConversationId]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const models = [
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast & Cost-effective)" },
    { value: "gpt-4o", label: "GPT-4o (Advanced)" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo (Powerful)" },
  ];

  const examplePrompts = [
    "Write a cold email to a real estate investor",
    "Analyze my sales pipeline and suggest improvements",
    "Create a follow-up sequence for new leads",
    "Draft a proposal for a commercial property deal",
    "Summarize best practices for CRM management",
    "Help me prioritize my deals for this week"
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setConversations(prev => prev.map(conv => 
      conv.id === activeConversationId 
        ? { ...conv, messages: [...conv.messages, userMessage] }
        : conv
    ));

    if (activeConversation.messages.length === 0) {
      const conversationName = inputValue.slice(0, 50) + (inputValue.length > 50 ? "..." : "");
      setConversations(prev => prev.map(conv =>
        conv.id === activeConversationId
          ? { ...conv, name: conversationName }
          : conv
      ));
    }

    setInputValue("");
    setIsLoading(true);

    try {
      const { data } = await base44.functions.invoke('aiAssistant', {
        action: "chat",
        prompt: inputValue,
        model: selectedModel,
        context: {}
      });

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: typeof data.response === 'string' ? data.response : JSON.stringify(data.response, null, 2),
        timestamp: new Date().toISOString(),
        usage: data.usage
      };

      setConversations(prev => prev.map(conv =>
        conv.id === activeConversationId
          ? { ...conv, messages: [...conv.messages, aiMessage] }
          : conv
      ));
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setConversations(prev => prev.map(conv =>
        conv.id === activeConversationId
          ? { ...conv, messages: [...conv.messages, errorMessage] }
          : conv
      ));
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

  const createNewConversation = () => {
    const newId = Math.max(...conversations.map(c => c.id)) + 1;
    const newConv = { id: newId, name: "New Chat", messages: [] };
    setConversations(prev => [...prev, newConv]);
    setActiveConversationId(newId);
  };

  const deleteConversation = (id) => {
    if (conversations.length === 1) return;
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(conversations[0].id);
    }
  };

  const clearCurrentConversation = () => {
    setConversations(prev => prev.map(conv =>
      conv.id === activeConversationId
        ? { ...conv, messages: [], name: "New Chat" }
        : conv
    ));
  };

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadConversation = () => {
    const text = activeConversation.messages
      .map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConversation.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className="h-screen flex" style={{ background: 'linear-gradient(135deg, #F5F7FA 0%, #E6F0FA 100%)' }}>
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col" style={{ 
        background: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(30, 58, 138, 0.1)'
      }}>
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(30, 58, 138, 0.1)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="ampvibe-button-primary p-3 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#666" }}>Amplify AI</h2>
                <p className="text-xs" style={{ color: "#aaa" }}>Powered by ChatGPT</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="ampvibe-button p-2 hover:bg-red-50 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" style={{ color: "#666" }} />
            </button>
          </div>
          <NeuroButton onClick={createNewConversation} className="w-full flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            New Chat
          </NeuroButton>
        </div>

        {/* Model Selection */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(30, 58, 138, 0.1)' }}>
          <NeuroSelect
            label="Model"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            options={models}
          />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`ampvibe-button p-3 flex items-start gap-3 cursor-pointer group ${
                activeConversationId === conv.id ? 'active' : ''
              }`}
              onClick={() => setActiveConversationId(conv.id)}
            >
              <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#666" }}>
                  {conv.name}
                </p>
                <p className="text-xs" style={{ color: "#aaa" }}>
                  {conv.messages.length} messages
                </p>
              </div>
              {conversations.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-4 h-4" style={{ color: "#f5222d" }} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="ampvibe-card m-4 mb-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5" style={{ color: "#00A86B" }} />
            <div>
              <h3 className="font-bold" style={{ color: "#666" }}>{activeConversation.name}</h3>
              <p className="text-xs" style={{ color: "#aaa" }}>
                {activeConversation.messages.length > 0 
                  ? `${activeConversation.messages.length} messages` 
                  : 'Start a conversation'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeConversation.messages.length > 0 && (
              <>
                <NeuroButton size="sm" onClick={downloadConversation}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </NeuroButton>
                <NeuroButton size="sm" onClick={clearCurrentConversation}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </NeuroButton>
              </>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {activeConversation.messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="ampvibe-inset w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Sparkles className="w-10 h-10" style={{ color: "#00A86B" }} />
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: "#666" }}>
                  Welcome to Amplify AI
                </h3>
                <p className="text-lg mb-8" style={{ color: "#888" }}>
                  Your AI-powered CRM assistant. Ask me anything!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {examplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputValue(prompt)}
                      className="ampvibe-card text-left p-4 hover:scale-105 transition-transform"
                    >
                      <p className="text-sm font-medium" style={{ color: "#666" }}>
                        {prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex gap-4 items-start"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    msg.role === 'user' 
                      ? 'ampvibe-inset' 
                      : 'ampvibe-button-primary'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-5 h-5" style={{ color: "#666" }} />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-sm" style={{ color: "#666" }}>
                        {msg.role === 'user' ? 'You' : 'Amplify AI'}
                      </span>
                      {msg.usage && (
                        <span className="text-xs ampvibe-button px-2 py-0.5 rounded" style={{ color: "#aaa" }}>
                          {msg.usage.total_tokens} tokens
                        </span>
                      )}
                    </div>
                    <div 
                      className={`ampvibe-card p-4 ${msg.isError ? 'border border-red-300' : ''}`}
                      style={msg.isError ? { borderColor: '#ff4d4f' } : {}}
                    >
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap" style={{ color: "#666" }}>
                        {msg.content}
                      </div>
                    </div>
                    {msg.role === 'assistant' && !msg.isError && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="ampvibe-button px-3 py-1 text-xs flex items-center gap-2"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-4 items-start">
                <div className="ampvibe-button-primary w-10 h-10 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-sm mb-2 block" style={{ color: "#666" }}>
                    Amplify AI
                  </span>
                  <div className="ampvibe-card p-4">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#00A86B" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 border-t" style={{ 
          borderColor: 'rgba(30, 58, 138, 0.1)',
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(20px)'
        }}>
          <div className="max-w-4xl mx-auto">
            <div className="ampvibe-card p-4 flex gap-3 items-end">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Amplify AI..."
                className="flex-1 bg-transparent outline-none resize-none"
                style={{ color: "#666", minHeight: "60px", maxHeight: "200px" }}
                rows="2"
                disabled={isLoading}
              />
              <NeuroButton
                variant="primary"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </NeuroButton>
            </div>
            <p className="text-xs text-center mt-3" style={{ color: "#aaa" }}>
              Amplify AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}