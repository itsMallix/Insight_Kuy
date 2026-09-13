'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Trash2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useExcelStore } from '@/hooks/useExcelStore';
import { createDataContext } from '@/utils/excelParser';
import styles from './AIChatPanel.module.css';

const QUICK_PROMPTS = [
  '📊 Rangkum data dari sheet ini',
  '🔍 Apa insight utama dari data ini?',
  '🏆 Top 5 item berdasarkan active users',
  '📈 Analisis engagement rate',
  '💡 Apa yang bisa ditingkatkan?',
];

export default function AIChatPanel() {
  const {
    chatOpen, setChatOpen, chatHistory, addChatMessage,
    updateLastChatMessage, clearChat, activeFile, activeSheet,
    activeSheetData,
  } = useExcelStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (chatOpen) inputRef.current?.focus();
  }, [chatOpen]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading || !activeFile || !activeSheetData) return;

    const userMessage = { role: 'user', content: text, timestamp: Date.now() };
    addChatMessage(userMessage);
    setInput('');
    setLoading(true);

    // Add placeholder AI message
    addChatMessage({ role: 'ai', content: '', timestamp: Date.now(), loading: true });

    try {
      const dataContext = createDataContext(activeFile, activeSheet);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          dataContext,
          chatHistory: chatHistory.slice(-6).map((m) => ({
            role: m.role === 'ai' ? 'model' : 'user',
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      updateLastChatMessage({ content: data.response, loading: false });
    } catch (err) {
      updateLastChatMessage({
        content: '❌ Terjadi error saat menghubungi AI. Pastikan API key sudah diset di `.env.local`.',
        loading: false,
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!chatOpen) return null;

  return (
    <div className={styles.panel} id="ai-chat-panel">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Sparkles size={18} strokeWidth={2.5} />
          <span>AI Chat</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={clearChat} title="Clear chat">
            <Trash2 size={16} />
          </button>
          <button className={styles.iconBtn} onClick={() => setChatOpen(false)} title="Close">
            <X size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Context indicator */}
      {activeFile && (
        <div className={styles.context}>
          📂 {activeFile.name} → {activeSheet}
        </div>
      )}

      {/* Messages */}
      <div className={styles.messages}>
        {chatHistory.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🤖</div>
            <h4>Hai! Saya InsightKuy AI</h4>
            <p>Tanyakan apa saja tentang data kamu!</p>
            <div className={styles.quickPrompts}>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className={styles.quickPromptBtn}
                  onClick={() => sendMessage(prompt)}
                  disabled={!activeSheetData}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div
            key={i}
            className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}
          >
            <div className={styles.messageBubble}>
              {msg.loading ? (
                <div className={styles.typingIndicator}>
                  <span />
                  <span />
                  <span />
                </div>
              ) : msg.role === 'ai' ? (
                <div className={styles.markdown}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className={styles.inputArea} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className={styles.chatInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={activeSheetData ? 'Tanya tentang data...' : 'Upload file dulu...'}
          disabled={loading || !activeSheetData}
          id="chat-input"
        />
        <button
          type="submit"
          className={`${styles.sendBtn} ${input.trim() && !loading ? styles.sendBtnActive : ''}`}
          disabled={!input.trim() || loading || !activeSheetData}
          id="chat-send"
        >
          <Send size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
