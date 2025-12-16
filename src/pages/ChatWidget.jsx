import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Send, X, Minimize2, Maximize2 } from "lucide-react";
import moment from "moment";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '' });
  const [hasProvidedInfo, setHasProvidedInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Get or create visitor ID
    let vid = localStorage.getItem('chat_visitor_id');
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem('chat_visitor_id', vid);
    }
    setVisitorId(vid);

    // Check for existing session
    const savedSessionId = localStorage.getItem('chat_session_id');
    if (savedSessionId) {
      setSessionId(savedSessionId);
      setHasProvidedInfo(true);
      loadMessages(savedSessionId);
    }
  }, []);

  useEffect(() => {
    if (sessionId && isOpen) {
      const interval = setInterval(() => {
        loadMessages(sessionId);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [sessionId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (sid) => {
    try {
      const response = await base44.functions.invoke('chat/getChatMessages', {
        session_id: sid
      });
      if (response.data?.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startChat = async () => {
    if (!visitorInfo.name || !visitorInfo.email) {
      alert('Please provide your name and email');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('chat/initiateChatSession', {
        website_url: window.location.href,
        visitor_id: visitorId,
        visitor_name: visitorInfo.name,
        visitor_email: visitorInfo.email
      });

      if (response.data?.session_id) {
        setSessionId(response.data.session_id);
        localStorage.setItem('chat_session_id', response.data.session_id);
        setHasProvidedInfo(true);
        loadMessages(response.data.session_id);
      }
    } catch (error) {
      alert('Failed to start chat: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !sessionId) return;

    const tempMessage = {
      id: Date.now(),
      message_content: messageText,
      sender_type: 'Visitor',
      sender_name: visitorInfo.name,
      created_date: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);
    setMessageText('');

    try {
      await base44.functions.invoke('chat/sendChatMessage', {
        session_id: sessionId,
        sender_type: 'Visitor',
        sender_id: visitorId,
        sender_name: visitorInfo.name,
        message_content: tempMessage.message_content
      });
      loadMessages(sessionId);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00A86B 0%, #00C87A 100%)',
            border: 'none',
            boxShadow: '0 4px 16px rgba(0, 168, 107, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare style={{ color: '#fff', width: '28px', height: '28px' }} />
        </button>
      ) : (
        <div style={{
          width: isMinimized ? '300px' : '380px',
          height: isMinimized ? '60px' : '550px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(30, 58, 138, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #00A86B 0%, #00C87A 100%)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MessageSquare style={{ color: '#fff', width: '24px', height: '24px' }} />
              <div>
                <p style={{ color: '#fff', fontWeight: 'bold', margin: 0 }}>Chat with us</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: 0 }}>
                  We typically reply instantly
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isMinimized ? (
                  <Maximize2 style={{ color: '#fff', width: '16px', height: '16px' }} />
                ) : (
                  <Minimize2 style={{ color: '#fff', width: '16px', height: '16px' }} />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ color: '#fff', width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Content */}
              {!hasProvidedInfo ? (
                <div style={{ padding: '24px', flex: 1 }}>
                  <h3 style={{ marginBottom: '16px', color: '#333' }}>Start a conversation</h3>
                  <input
                    type="text"
                    placeholder="Your name *"
                    value={visitorInfo.name}
                    onChange={(e) => setVisitorInfo({ ...visitorInfo, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginBottom: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Your email *"
                    value={visitorInfo.email}
                    onChange={(e) => setVisitorInfo({ ...visitorInfo, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginBottom: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={startChat}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #00A86B 0%, #00C87A 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Starting...' : 'Start Chat'}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{
                    flex: 1,
                    padding: '16px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {messages.map((msg) => {
                      const isVisitor = msg.sender_type === 'Visitor';
                      const isSystem = msg.sender_type === 'System';

                      if (isSystem) {
                        return (
                          <div key={msg.id} style={{ textAlign: 'center' }}>
                            <span style={{
                              fontSize: '12px',
                              padding: '6px 12px',
                              background: '#f3f4f6',
                              borderRadius: '12px',
                              color: '#888'
                            }}>
                              {msg.message_content}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: isVisitor ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{ maxWidth: '75%' }}>
                            <div style={{
                              padding: '10px 14px',
                              borderRadius: '12px',
                              background: isVisitor 
                                ? 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)'
                                : '#f3f4f6',
                              color: isVisitor ? '#fff' : '#333'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                fontWeight: '500',
                                marginBottom: '4px',
                                opacity: 0.8
                              }}>
                                {msg.sender_name}
                              </p>
                              <p style={{ margin: 0, fontSize: '14px' }}>
                                {msg.message_content}
                              </p>
                            </div>
                            <p style={{
                              margin: '4px 0 0',
                              fontSize: '11px',
                              color: '#aaa',
                              textAlign: isVisitor ? 'right' : 'left'
                            }}>
                              {moment(msg.created_date).format('h:mm A')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={sendMessage} style={{
                    padding: '16px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message..."
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      style={{
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #00A86B 0%, #00C87A 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: messageText.trim() ? 'pointer' : 'not-allowed',
                        opacity: messageText.trim() ? 1 : 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Send style={{ width: '18px', height: '18px' }} />
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}