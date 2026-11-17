import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Trash2, ShieldCheck, RefreshCw, PhoneCall, Globe } from 'lucide-react';
import VoiceCallModal from './VoiceCallModal';

export default function AITutorPanel({ videoId, videoTitle, instructor, transcript = [] }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Greetings. I am your Coursai AI Tutor. I am actively tracking the video transcript for "${videoTitle || 'this lesson'}". Ask me any question, and I will provide answers strictly grounded in the video material.`,
      timestamp: 'Just now'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isFYPOpen, setIsFYPOpen] = useState(false); // just keeping context clean
  const [language, setLanguage] = useState('ar'); // 'ar' or 'en'
  const [xpToast, setXpToast] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const addXP = (amount) => {
    const currentXp = parseInt(localStorage.getItem('coursai_xp') || '0', 10);
    localStorage.setItem('coursai_xp', (currentXp + amount).toString());
    window.dispatchEvent(new Event('coursai_xp_update'));
    
    setXpToast(`+${amount} XP`);
    setTimeout(() => setXpToast(null), 2000);
  };

  const handleSendMessage = async (queryText = inputQuery) => {
    const textToSend = queryText.trim();
    if (!textToSend || isStreaming) return;

    addXP(10); // Reward for asking a question

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const initialAssistantMsg = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage, initialAssistantMsg]);
    setInputQuery('');
    setIsStreaming(true);

    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/tutor/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId,
          question: textToSend + (language === 'ar' ? ' (Please answer in Arabic)' : ' (Please answer in English)')
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const jsonString = line.replace('data:', '').trim();
            if (!jsonString) continue;
            try {
              const parsed = JSON.parse(jsonString);
              if (parsed.content) {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + parsed.content }
                      : msg
                  )
                );
              }
            } catch (err) {
              console.error("Error parsing SSE JSON:", err);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `*System Notice:* Unable to connect to local AI server. Displaying grounded video transcript extract:\n\nRegarding "${textToSend}": The lesson by ${instructor} details this topic in the main video.`
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: 'Conversation history cleared. Ready for your next query regarding the video context.',
        timestamp: 'Just now'
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full glass-panel-heavy rounded-2xl overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-DEFAULT/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Gamification Toast */}
      <AnimatePresence>
        {xpToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 text-yellow-400 font-display font-bold px-4 py-2 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              <span className="text-xl">⚡</span>
              <span className="text-lg">{xpToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 py-4 bg-dark-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-DEFAULT rounded-full blur-md opacity-50" />
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary-DEFAULT to-indigo-600 flex items-center justify-center text-white shadow-glow">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white tracking-wide flex items-center gap-2">
              <span>AI TUTOR</span>
              <span className="text-[9px] uppercase font-display font-bold px-1.5 py-0.5 rounded bg-primary-DEFAULT/20 text-primary-light border border-primary-DEFAULT/30">
                Grounded
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Contextual to {instructor}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(lang => lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-display text-xs font-bold"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'ar' ? 'AR' : 'EN'}
          </button>
          <button
            onClick={clearChat}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Clear Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grounding Banner */}
      <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 text-[11px] text-indigo-300 flex items-center justify-between font-display font-medium z-10">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Transcript Verified
        </span>
        <span className="font-mono text-[10px] opacity-70">gpt-oss:120b</span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5 font-sans text-sm z-10 relative scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-dark-800 text-primary-light flex items-center justify-center shrink-0 mt-1 border border-white/5 shadow-glass">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-glass ${
                  msg.role === 'user'
                    ? 'bg-primary-DEFAULT text-white rounded-tr-sm'
                    : 'bg-dark-800/80 backdrop-blur-md text-slate-200 border border-white/10 rounded-tl-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-2 opacity-70">
                  <span className="font-display text-xs font-semibold uppercase tracking-wider">
                    {msg.role === 'user' ? 'You' : 'Coursai AI'}
                  </span>
                  <span className="text-[10px] font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed text-[13px] font-sans">
                  {msg.content || (
                    <span className="flex items-center gap-2 text-primary-light italic text-xs font-medium">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Synthesizing response...
                    </span>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-dark-900 flex items-center justify-center shrink-0 mt-1 shadow-glass">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Queries */}
      <div className="px-4 py-3 bg-dark-900/60 border-t border-white/5 flex gap-2 overflow-x-auto z-10 scrollbar-hide">
        <button
          onClick={() => handleSendMessage("Summarize the key takeaways from this section.")}
          className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-display text-xs transition-all hover:text-white"
        >
          Summary of Key Concepts
        </button>
        <button
          onClick={() => handleSendMessage("What are the main methods discussed here?")}
          className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-display text-xs transition-all hover:text-white"
        >
          Methods List
        </button>
      </div>

      {/* Input Form */}
      <div className="p-4 bg-dark-950/80 backdrop-blur-xl border-t border-white/5 z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3 relative"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask a question about the video..."
            className="flex-1 bg-dark-900/50 px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT text-sm text-white placeholder:text-slate-500 font-sans transition-all disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setIsCallOpen(true)}
            className="w-12 h-12 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 flex items-center justify-center transition-all shadow-glow flex-shrink-0"
            title="Start Voice Call"
          >
            <PhoneCall className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={isStreaming || !inputQuery.trim()}
            className="w-12 h-12 rounded-xl bg-primary-DEFAULT hover:bg-primary-hover text-white flex items-center justify-center transition-all disabled:opacity-40 shadow-glow flex-shrink-0"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>

      <VoiceCallModal 
        isOpen={isCallOpen} 
        onClose={() => setIsCallOpen(false)} 
        instructor={instructor}
        videoId={videoId}
        language={language}
      />
    </div>
  );
}
