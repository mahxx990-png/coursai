import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, Waves, Hand, MessageSquare, PauseCircle } from 'lucide-react';

export default function VoiceCallModal({ isOpen, onClose, instructor, videoId, language = 'ar' }) {
  const [isMuted, setIsMuted] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...'); // Connecting, Listening, Speaking, Thinking, Muted, Error
  const [aiText, setAiText] = useState('');
  
  const recognitionRef = useRef(null);
  const aiTextRef = useRef(''); 
  const accumulatedTranscriptRef = useRef('');
  const utteranceRef = useRef(null); // Fix choppy audio by preventing GC
  const [voiceGender, setVoiceGender] = useState('female');
  const [callLang, setCallLang] = useState(language);
  const callLangRef = useRef(callLang);
  useEffect(() => { callLangRef.current = callLang; }, [callLang]);
  useEffect(() => { setCallLang(language); }, [language]);

  // Refs for resolving stale closures inside SpeechRecognition callbacks
  const isMutedRef = useRef(isMuted);
  const continuousModeRef = useRef(continuousMode);
  const callStatusRef = useRef(callStatus);
  const voiceGenderRef = useRef(voiceGender);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { continuousModeRef.current = continuousMode; }, [continuousMode]);
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);
  useEffect(() => { voiceGenderRef.current = voiceGender; }, [voiceGender]);

  useEffect(() => {
    // Load voices proactively
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    
    if (isOpen) {
      setCallStatus('Connecting...');
      setAiText('');
      aiTextRef.current = '';
      accumulatedTranscriptRef.current = '';
      
      const connectTimer = setTimeout(() => {
        const welcomeText = language === 'ar' 
          ? "مرحباً! أنا معلمك الذكي. أنا جاهز لمناقشة الدرس معك، ماذا تود أن تعرف؟"
          : "Hello! I'm your AI Tutor. I'm ready to discuss the lesson with you. What would you like to know?";
        speakText(welcomeText);
      }, 1500);

      return () => {
        clearTimeout(connectTimer);
        window.speechSynthesis.cancel();
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e){}
        }
      };
    }
  }, [isOpen, callLang]);

  // Toggle Mute
  useEffect(() => {
    if (!isOpen) return;

    if (isMuted) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }
      if (callStatus === 'Listening') {
        setCallStatus('Muted');
        setAiText(language === 'ar' ? 'المايكروفون مغلق.' : 'Microphone is muted.');
      }
    } else {
      if (callStatus === 'Muted') {
        startListening();
      }
    }
  }, [isMuted]);

  const getBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const targetLang = language === 'ar' ? 'ar' : 'en';
    const availableVoices = voices.filter(v => v.lang.startsWith(targetLang));
    
    const femaleKeywords = ['female', 'zaira', 'zeina', 'salma', 'hoda', 'aria', 'jenny', 'samantha', 'victoria'];
    const maleKeywords = ['male', 'tarik', 'maged', 'naayf', 'shakir', 'nizar', 'guy', 'christopher', 'daniel'];
    const keywords = voiceGenderRef.current === 'female' ? femaleKeywords : maleKeywords;

    // 1. Try to find a voice that matches target lang AND gender AND is High Quality
    let best = availableVoices.find(v => {
      const name = v.name.toLowerCase();
      return keywords.some(k => name.includes(k)) && (name.includes('neural') || name.includes('premium') || name.includes('natural'));
    });

    // 2. Try to find a voice that matches target lang AND gender
    if (!best) {
      best = availableVoices.find(v => {
        const name = v.name.toLowerCase();
        return keywords.some(k => name.includes(k));
      });
    }

    // 3. Try to find ANY high quality voice in target lang (e.g., Google Arabic)
    if (!best) {
      best = availableVoices.find(v => {
        const name = v.name.toLowerCase();
        return name.includes('google') || name.includes('neural') || name.includes('natural');
      });
    }

    return best || availableVoices[0] || voices[0];
  };

  const speakText = (text) => {
    setCallStatus('Speaking');
    setAiText(text);
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance; // Prevent GC
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      
      const bestVoice = getBestVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      
      utterance.onend = () => {
        if (!isMutedRef.current) {
          startListening();
        } else {
          setCallStatus('Muted');
          setAiText(language === 'ar' ? 'المايكروفون مغلق.' : 'Microphone is muted.');
        }
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => { if(!isMutedRef.current) startListening(); }, 3000);
    }
  };

  const interruptAI = () => {
    if (utteranceRef.current) {
      utteranceRef.current.onend = null; // Prevent double firing
    }
    window.speechSynthesis.cancel();
    
    if (!isMutedRef.current) {
      startListening();
    } else {
      setCallStatus('Muted');
      setAiText(language === 'ar' ? 'المايكروفون مغلق.' : 'Microphone is muted.');
    }
  };

  const startListening = () => {
    if (isMutedRef.current) return;
    
    setCallStatus('Listening');
    setAiText(language === 'ar' ? 'أنا أستمع...' : 'Listening...');
    aiTextRef.current = '';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = continuousModeRef.current;
      recognition.interimResults = true;
      recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          accumulatedTranscriptRef.current += ' ' + finalTranscript;
        }

        const currentDisplay = accumulatedTranscriptRef.current + ' ' + interimTranscript;
        setAiText(currentDisplay);
        aiTextRef.current = currentDisplay;
        
        if (!continuousModeRef.current && event.results[event.results.length - 1].isFinal) {
          recognition.stop();
          const query = accumulatedTranscriptRef.current.trim();
          accumulatedTranscriptRef.current = '';
          if (query) handleUserQuery(query);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setCallStatus('Listening');
          setAiText(language === 'ar' ? 'أنا أستمع...' : 'Listening...');
        }
      };
      
      recognition.onend = () => {
        if (continuousModeRef.current && callStatusRef.current === 'Listening' && !isMutedRef.current) {
          try { recognition.start(); } catch(e){}
        }
      };

      try {
        recognition.start();
      } catch(e) {}
    } else {
      setCallStatus('Error');
      setAiText(language === 'ar' ? 'التعرف على الصوت غير مدعوم في متصفحك.' : 'Speech Recognition not supported.');
    }
  };

  const manualSendContinuous = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }
    const query = accumulatedTranscriptRef.current.trim() || aiTextRef.current.trim();
    accumulatedTranscriptRef.current = '';
    if (query && query !== 'أنا أستمع...' && query !== 'Listening...') {
      handleUserQuery(query);
    } else {
      startListening();
    }
  };

  const handleUserQuery = async (query) => {
    if (!query.trim()) {
      startListening();
      return;
    }
    
    setCallStatus('Thinking...');
    
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/tutor/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId || 'python-setup-vars',
          question: query + (language === 'ar' ? ' (Please answer in Arabic)' : ' (Please answer in English)')
        })
      });

      if (!response.ok) throw new Error("Network error");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      
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
              if (parsed.content) fullText += parsed.content;
            } catch (err) {}
          }
        }
      }
      
      speakText(fullText || (language === 'ar' ? "عذراً، لم أتمكن من العثور على إجابة." : "Sorry, I couldn't find an answer."));
      
    } catch (err) {
      speakText(language === 'ar' ? "يبدو أن هناك مشكلة في الاتصال. أنا حالياً في وضع المحاكاة." : "Connection issue. Running in simulation mode.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-dark-950/90 backdrop-blur-xl"
      />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-lg bg-dark-900 border border-white/10 rounded-[3rem] p-8 shadow-2xl flex flex-col items-center justify-between min-h-[550px]"
      >
        {/* Header & Mini Controls */}
        <div className="w-full flex items-center justify-between">
          <div className="w-10"></div> {/* Spacer */}
          <div className="text-center space-y-1">
            <h2 className="text-white font-display font-bold text-2xl tracking-wide">Coursai AI</h2>
            <p className="text-primary-light text-sm font-sans flex items-center justify-center gap-2">
              <span className={`w-2 h-2 rounded-full ${callStatus === 'Muted' || callStatus === 'Error' ? 'bg-red-500' : 'bg-primary-light animate-pulse'}`} />
              {callStatus}
            </p>
          </div>
          
          <button 
            onClick={() => {
              setContinuousMode(!continuousMode);
              if (!continuousMode) accumulatedTranscriptRef.current = ''; // Reset when turning on
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-glow ${
              continuousMode ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
            title={language === 'ar' ? 'وضع عدم المقاطعة' : 'Do Not Interrupt Mode'}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Visualizer / Avatar */}
        <div className="relative flex items-center justify-center my-12">
          {callStatus === 'Speaking' && (
            <>
              <div className="absolute w-40 h-40 bg-primary-DEFAULT/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute w-56 h-56 bg-primary-DEFAULT/10 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              <div className="absolute w-72 h-72 bg-primary-DEFAULT/5 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
            </>
          )}

          {callStatus === 'Listening' && (
            <div className="absolute w-40 h-40 bg-indigo-500/20 rounded-full animate-pulse" style={{ animationDuration: '1.5s' }} />
          )}

          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-dark-800 to-dark-950 border-2 border-primary-DEFAULT/50 flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.3)] z-10">
            <Waves className={`w-12 h-12 ${callStatus === 'Speaking' ? 'text-primary-light' : 'text-slate-400'}`} />
          </div>

          {/* Interrupt AI Button */}
          <AnimatePresence>
            {callStatus === 'Speaking' && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={interruptAI}
                className="absolute -right-4 -top-4 w-12 h-12 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center shadow-lg border border-red-400/50 z-20 group"
                title={language === 'ar' ? 'توقف!' : 'Stop AI'}
              >
                <Hand className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* AI Subtitles / Text */}
        <div className="w-full h-32 flex flex-col items-center justify-center text-center px-4 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.p
              key={aiText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-slate-200 font-sans text-lg leading-relaxed"
            >
              {aiText}
            </motion.p>
          </AnimatePresence>
          
          {/* Send Button for Continuous Mode */}
          {continuousMode && callStatus === 'Listening' && accumulatedTranscriptRef.current.length > 5 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={manualSendContinuous}
              className="mt-4 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-full text-white font-display text-sm shadow-glow transition-all"
            >
              {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
            </motion.button>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="w-full flex items-center justify-center gap-8 mt-4">
          <button 
            onClick={() => setCallLang(prev => prev === 'ar' ? 'en' : 'ar')}
            className="w-16 h-16 rounded-full bg-white/5 text-slate-300 flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 text-2xl font-bold shadow-lg"
            title={callLang === 'ar' ? 'تغيير اللغة (EN/AR)' : 'Toggle Language (EN/AR)'}
          >
            {callLang === 'ar' ? 'عع' : 'EN'}
          </button>
          
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isMuted 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/10'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button 
            onClick={onClose}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg hover:shadow-red-500/50 transition-all hover:scale-105"
          >
            <PhoneOff className="w-8 h-8" />
          </button>

          <button 
            onClick={() => {
              const newGender = voiceGender === 'female' ? 'male' : 'female';
              setVoiceGender(newGender);
              voiceGenderRef.current = newGender; // Force immediate update
              // Speak a quick test if not in a call
              if (callStatus !== 'Speaking' && callStatus !== 'Listening' && callStatus !== 'Thinking...') {
                const utterance = new SpeechSynthesisUtterance(callLang === 'ar' ? (newGender === 'male' ? 'صوت رجل' : 'صوت امرأة') : (newGender === 'male' ? 'Male Voice' : 'Female Voice'));
                utterance.lang = callLang === 'ar' ? 'ar-SA' : 'en-US';
                utterance.voice = getBestVoice();
                window.speechSynthesis.speak(utterance);
              }
            }}
            className="w-16 h-16 rounded-full bg-white/5 text-slate-300 flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 text-3xl shadow-lg"
            title={language === 'ar' ? 'تبديل الصوت (رجل/امرأة)' : 'Toggle Voice Gender'}
          >
            {voiceGender === 'female' ? '👩' : '👨'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
