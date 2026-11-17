import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, ChevronLeft, ChevronRight, PenTool, Type, Eraser, Sparkles, Download, Save } from 'lucide-react';

export default function SmartNotebook({ isOpen, onClose, videoTitle, instructor }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState([{ id: 0, text: '', drawing: null }]);
  const [mode, setMode] = useState('text'); // 'text', 'draw', 'erase'
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#38bdf8'; // Primary light color
      ctxRef.current = ctx;
      
      // Load current page drawing if it exists
      if (pages[currentPage].drawing) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = pages[currentPage].drawing;
      }
    }
  }, [isOpen, currentPage, mode]);

  const saveCanvasState = () => {
    if (!canvasRef.current) return;
    const newPages = [...pages];
    newPages[currentPage].drawing = canvasRef.current.toDataURL();
    setPages(newPages);
  };

  const startDrawing = (e) => {
    if (mode === 'text' || !ctxRef.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || mode === 'text' || !ctxRef.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    if (mode === 'erase') {
      ctxRef.current.globalCompositeOperation = 'destination-out';
      ctxRef.current.lineWidth = 20;
    } else {
      ctxRef.current.globalCompositeOperation = 'source-over';
      ctxRef.current.lineWidth = 3;
      ctxRef.current.strokeStyle = '#38bdf8';
    }
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    ctxRef.current?.closePath();
    setIsDrawing(false);
    saveCanvasState();
  };

  const handleTextChange = (e) => {
    const newPages = [...pages];
    newPages[currentPage].text = e.target.value;
    setPages(newPages);
  };

  const addNewPage = () => {
    setPages([...pages, { id: pages.length, text: '', drawing: null }]);
    setCurrentPage(pages.length);
  };

  const nextPage = () => {
    if (currentPage < pages.length - 1) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleAISummarize = async () => {
    setIsSummarizing(true);
    // Simulate AI summary generation
    setTimeout(() => {
      const summaryText = `\n\n[AI Summary for ${videoTitle}]\nThis lesson by ${instructor} covers the fundamental concepts of the topic. Key takeaways:\n- Master the core syntax.\n- Understand the primary use cases.\n- Practice with real-world examples to solidify understanding.`;
      
      const newPages = [...pages];
      newPages[currentPage].text += summaryText;
      setPages(newPages);
      setIsSummarizing(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-dark-950/80 backdrop-blur-md"
      />

      {/* Notebook Container */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-5xl h-[80vh] bg-dark-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(56,189,248,0.15)]"
      >
        {/* Binder Rings Simulation (Center of the notebook look) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 flex flex-col justify-evenly py-8 z-20 pointer-events-none opacity-40">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-full h-2 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-full shadow-md" />
          ))}
        </div>

        {/* Notebook Header */}
        <div className="h-16 bg-dark-800 border-b border-white/10 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-DEFAULT/20 flex items-center justify-center text-primary-light border border-primary-DEFAULT/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-display font-bold text-lg leading-tight">My Smart Notebook</h2>
              <p className="text-slate-400 text-xs font-sans">Lesson: {videoTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleAISummarize}
              disabled={isSummarizing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-display font-medium transition-all shadow-glow disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isSummarizing ? 'Writing...' : 'Ask AI to Summarize'}
            </button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notebook Body (Pages) */}
        <div className="flex-1 flex bg-[#1e2433] relative">
          
          {/* Left Page (Tools & Metadata) */}
          <div className="w-1/2 p-8 border-r border-dark-950/50 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-opacity-5">
            <h3 className="text-primary-light font-display font-bold text-2xl mb-6">Tools & Controls</h3>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setMode('text')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${mode === 'text' ? 'bg-primary-DEFAULT/20 border-primary-DEFAULT/50 text-white' : 'bg-dark-800/50 border-white/5 text-slate-400 hover:bg-dark-800'}`}
              >
                <Type className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-display font-semibold">Keyboard Typing</div>
                  <div className="text-xs opacity-70">Type notes directly on the page</div>
                </div>
              </button>

              <button 
                onClick={() => setMode('draw')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${mode === 'draw' ? 'bg-indigo-500/20 border-indigo-500/50 text-white' : 'bg-dark-800/50 border-white/5 text-slate-400 hover:bg-dark-800'}`}
              >
                <PenTool className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-display font-semibold">Freehand Drawing</div>
                  <div className="text-xs opacity-70">Use pen or mouse to draw</div>
                </div>
              </button>

              <button 
                onClick={() => setMode('erase')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${mode === 'erase' ? 'bg-pink-500/20 border-pink-500/50 text-white' : 'bg-dark-800/50 border-white/5 text-slate-400 hover:bg-dark-800'}`}
              >
                <Eraser className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-display font-semibold">Eraser</div>
                  <div className="text-xs opacity-70">Remove drawings from canvas</div>
                </div>
              </button>
            </div>

            <div className="mt-auto">
              <button className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-display transition-all">
                <Download className="w-4 h-4" />
                Export Notes as PDF
              </button>
            </div>
          </div>

          {/* Right Page (Active Workspace) */}
          <div className="w-1/2 relative bg-[#1a1f2e] bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] bg-opacity-20 shadow-inner">
            {/* Lined paper effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #38bdf8 31px, #38bdf8 32px)', marginTop: '40px' }} />
            
            <div className="absolute inset-0 p-8 pt-10">
              {/* Text Layer */}
              <textarea
                value={pages[currentPage].text}
                onChange={handleTextChange}
                placeholder="Start typing your notes here..."
                className={`w-full h-full bg-transparent resize-none focus:outline-none text-slate-200 font-sans text-lg leading-[32px] z-10 relative ${mode !== 'text' ? 'pointer-events-none' : ''}`}
                style={{ lineHeight: '32px' }}
              />
            </div>
            
            {/* Drawing Layer */}
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              className={`absolute inset-0 w-full h-full z-20 ${mode === 'text' ? 'pointer-events-none' : 'cursor-crosshair'}`}
            />
          </div>
        </div>

        {/* Notebook Footer (Pagination) */}
        <div className="h-14 bg-dark-800 border-t border-white/10 flex items-center justify-center gap-6 z-30">
          <button 
            onClick={prevPage}
            disabled={currentPage === 0}
            className="p-2 rounded-full hover:bg-white/5 disabled:opacity-30 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-slate-400 font-display text-sm font-medium">
            Page {currentPage + 1} of {pages.length}
          </span>
          
          <button 
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className="p-2 rounded-full hover:bg-white/5 disabled:opacity-30 text-slate-300 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button 
            onClick={addNewPage}
            className="ml-4 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-display text-slate-300 transition-colors"
          >
            + New Page
          </button>
        </div>
      </motion.div>
    </div>
  );
}
