import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Send, Loader2, X, Play, User, ArrowRight } from 'lucide-react';

export default function AICourseMatchmaker({ onResults, onClose, localCourses = [], onSelectCourse }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi there! I'm your AI Course Advisor. Tell me what you'd like to learn, how much time you have, and your current skill level, and I'll find the perfect courses for you!" }
  ]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage = prompt;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/ai-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: data.response,
          courses: data.recommended_courses || []
        }]);
        if (data.recommended_courses && onResults) {
          onResults(data.recommended_courses);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I encountered an error connecting to my brain. Let's try again later." }]);
      }
    } catch (err) {
      console.warn("Backend API offline for AI Matchmaker. Using local fallback.");
      // Local fallback logic
      const promptLower = userMessage.toLowerCase();
      let recommended = [];
      
      if (localCourses.length > 0) {
        localCourses.forEach(c => {
          if ((c.category && c.category.toLowerCase().includes(promptLower)) || 
              (c.title && c.title.toLowerCase().split(' ').some(word => word.length > 3 && promptLower.includes(word)))) {
            recommended.push(c.id);
          }
        });
        
        if (recommended.length === 0) {
          recommended = [localCourses[0].id];
        }
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `I found ${recommended.length} course(s) that might match your interests based on your keywords (Our backend AI service is currently offline, so I'm using a local search).`,
        courses: recommended
      }]);
      
      if (onResults && recommended.length > 0) {
        onResults(recommended.slice(0, 3));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0, scale: 0.95 }}
      animate={{ opacity: 1, height: 'auto', scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto mb-10 overflow-hidden"
    >
      <div className="glass-panel rounded-3xl border border-primary-DEFAULT/30 shadow-glow-strong relative bg-dark-900/90 backdrop-blur-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-primary-DEFAULT/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-DEFAULT/20 flex items-center justify-center border border-primary-light/30">
              <Sparkles className="w-5 h-5 text-primary-light" />
            </div>
            <div>
              <h3 className="text-white font-display font-bold text-lg">AI Course Matchmaker</h3>
              <p className="text-primary-light/80 text-xs font-sans">Powered by Coursai Intelligence</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-primary-DEFAULT text-white rounded-tr-sm' 
                    : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant' && (
                    <Bot className="w-4 h-4 text-primary-light mb-2 inline-block mr-2" />
                  )}
                  <p className="text-sm font-sans leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  
                  {/* Inline Course Cards */}
                  {msg.courses && msg.courses.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-4">
                      {msg.courses.map(courseId => {
                        const course = localCourses.find(c => c.id === courseId);
                        if (!course) return null;
                        return (
                          <div key={course.id} className="w-full sm:w-64 bg-dark-950 rounded-xl overflow-hidden border border-white/5 shadow-glass group hover:border-primary-DEFAULT/50 transition-colors duration-300 flex flex-col">
                            <div className="relative aspect-video bg-dark-900 overflow-hidden">
                              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                              <div className="absolute top-2 left-2 bg-dark-900/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-primary-light font-display font-bold uppercase tracking-wider border border-white/10">
                                {course.category}
                              </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium mb-2">
                                <User className="w-3 h-3 text-slate-500" />
                                <span className="truncate">{course.instructor}</span>
                              </div>
                              <h4 className="font-display font-semibold text-sm text-white mb-2 line-clamp-2 leading-snug group-hover:text-primary-light transition-colors">
                                {course.title}
                              </h4>
                              <p className="text-xs text-slate-400 line-clamp-2 mb-4 flex-1">
                                {course.description}
                              </p>
                              <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-3">
                                <span className="text-[10px] font-display font-medium text-slate-400 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                                  {course.video_count || 3} Lessons
                                </span>
                                <button
                                  onClick={() => onSelectCourse && onSelectCourse(course.first_video_id || 'python-setup-vars')}
                                  className="text-primary-light font-display font-medium text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                                >
                                  Enter Course
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 text-primary-light animate-spin" />
                  <span className="text-sm text-slate-400 animate-pulse">Analyzing courses...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-dark-950/50 border-t border-white/10">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. I have 2 hours on weekends to learn Python data structures..."
              disabled={isLoading}
              className="w-full bg-dark-900 border border-white/10 rounded-full pl-5 pr-14 py-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary-DEFAULT/50 focus:shadow-glow transition-all font-sans text-sm"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-primary-DEFAULT hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary-DEFAULT flex items-center justify-center text-white transition-colors"
            >
              <Send className="w-4 h-4 ml-1" />
            </button>
          </form>
        </div>
        
      </div>
    </motion.div>
  );
}
