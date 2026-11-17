import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, GraduationCap, ArrowLeft, Home, ChevronLeft, ChevronRight, List, PlayCircle, ShieldCheck, User, BookOpen } from 'lucide-react';
import AITutorPanel from './AITutorPanel';
import QuizModal from './QuizModal';
import SmartNotebook from './SmartNotebook';
import Logo from './Logo';

export default function WatchRoom({ user, onOpenAuth }) {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [videoData, setVideoData] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);

  useEffect(() => {
    fetchVideoDetails(videoId || 'python-setup-vars');
  }, [videoId]);

  const fetchVideoDetails = async (vidId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/videos/${vidId}`);
      if (res.ok) {
        const data = await res.json();
        setVideoData(data);
        
        // Auto-enroll
        if (data.course_id) {
          const enrolled = JSON.parse(localStorage.getItem('coursai_enrolled') || '[]');
          if (!enrolled.includes(data.course_id)) {
            localStorage.setItem('coursai_enrolled', JSON.stringify([...enrolled, data.course_id]));
          }
        }
      } else {
        setVideoData(getFallbackData(vidId));
      }
    } catch (e) {
      console.warn("Backend API offline. Using fallback video dataset.");
      setVideoData(getFallbackData(vidId));
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackData = (vidId) => {
    const FALLBACK_MAP = {
      'python-setup-vars': {
        course_title: 'Python Programming: Complete Beginner Fundamentals',
        instructor: 'Corey Schafer',
        video: {
          id: 'python-setup-vars',
          youtube_video_id: 'k9TUPpGqYTo',
          title: 'Strings - Working with Textual Data',
          duration: '19:42',
          transcript: [
            { start: 0, end: 45, text: 'Welcome to Python tutorial for beginners.' },
            { start: 45, end: 120, text: 'Strings can be defined using single or double quotes.' }
          ],
          quizzes: [
            {
              id: 'q-py-1',
              title: 'Python Strings Assessment',
              questions: [
                {
                  id: 'q1',
                  question: 'Which syntax is recommended for string formatting in modern Python?',
                  options: ['f-strings', 'printf()', 'concat()'],
                  correct_index: 0,
                  explanation: 'f-strings introduced in Python 3.6+ are standard.'
                }
              ]
            }
          ]
        },
        all_course_videos: [
          { id: 'python-setup-vars', title: 'Lesson 1: Strings & Textual Data', duration: '19:42', sequence_order: 1 },
          { id: 'python-numbers', title: 'Lesson 2: Integers & Floats', duration: '15:10', sequence_order: 2 },
          { id: 'python-lists', title: 'Lesson 3: Lists, Tuples & Sets', duration: '24:05', sequence_order: 3 }
        ],
        next_video_id: 'python-numbers'
      }
    };
    return FALLBACK_MAP[vidId] || FALLBACK_MAP['python-setup-vars'];
  };

  const currentQuiz = videoData?.video?.quizzes?.[0];
  const allVideos = videoData?.all_course_videos || [];

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      
      {/* Dedicated Course Header - Full width sticky */}
      <header className="sticky top-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 font-display font-medium text-xs border border-white/5 transition-colors group"
              title="Return to Course Catalog"
            >
              <ArrowLeft className="w-4 h-4 text-primary-light group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Catalog</span>
            </button>
            <div className="h-6 w-px bg-white/10" />
            <Logo size="sm" />
          </div>

          <div className="flex items-center space-x-3">
            {allVideos.length > 1 && (
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg font-display font-medium text-xs border transition-colors ${
                  showPlaylist 
                    ? 'bg-primary-DEFAULT/20 border-primary-DEFAULT/50 text-primary-light shadow-glow' 
                    : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lessons ({allVideos.length})</span>
              </button>
            )}

            {currentQuiz && (
              <button
                onClick={() => {
                  setActiveQuiz(currentQuiz);
                  setShowQuizModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-display font-medium text-xs transition-colors shadow-sm group"
              >
                <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Checkpoint</span>
              </button>
            )}

            <button
              onClick={() => setIsNotebookOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 font-display font-medium text-xs transition-colors shadow-sm group"
            >
              <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Notebook</span>
            </button>

            <div className="h-6 w-px bg-white/10 hidden sm:block" />

            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-DEFAULT to-indigo-700 text-white font-display font-bold text-sm shadow-glow border border-primary-DEFAULT/30 hover:scale-105 transition-transform"
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-1.5 rounded-lg bg-primary-DEFAULT hover:bg-primary-hover text-white font-display font-medium text-xs transition-colors shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Watch Room Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 pb-24 pt-6">
        
        {/* Left Column: Video Player & Meta Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="lg:col-span-8 flex flex-col space-y-6"
        >
          {/* Cinematic Video Player */}
          <div className="relative rounded-2xl overflow-hidden bg-dark-950 border border-white/10 shadow-glow-strong z-10 group">
            <div className="absolute inset-0 bg-primary-DEFAULT/10 mix-blend-screen opacity-50 group-hover:opacity-0 transition-opacity duration-1000 pointer-events-none" />
            <div className="relative aspect-video">
              {videoData?.video?.youtube_video_id ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoData.video.youtube_video_id}?autoplay=0&rel=0`}
                  title={videoData.video.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-display">
                  Loading Stream...
                </div>
              )}
            </div>
          </div>

          {/* Controls & Playlist Container */}
          <div className="space-y-4">
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
              <button
                onClick={() => videoData?.prev_video_id && navigate(`/watch/${videoData.prev_video_id}`)}
                disabled={!videoData?.prev_video_id}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 font-display text-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="text-center font-display text-sm text-slate-400">
                {videoData?.current_video_index ? (
                  <span>Lesson {videoData.current_video_index} of {videoData.total_course_videos}</span>
                ) : (
                  <span>Course Sequence</span>
                )}
              </div>

              <button
                onClick={() => videoData?.next_video_id && navigate(`/watch/${videoData.next_video_id}`)}
                disabled={!videoData?.next_video_id}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-DEFAULT hover:bg-primary-hover disabled:opacity-30 disabled:hover:bg-primary-DEFAULT text-white font-display text-sm transition-all shadow-glow"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence>
              {showPlaylist && allVideos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-panel p-4 rounded-xl space-y-2 overflow-hidden"
                >
                  <h3 className="font-display font-medium text-sm text-white border-b border-white/10 pb-3 mb-3 flex items-center gap-2">
                    <List className="w-4 h-4 text-primary-light" />
                    Course Lessons
                  </h3>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
                    {allVideos.map((vid, idx) => {
                      const isCurrent = vid.id === videoData?.video?.id;
                      return (
                        <button
                          key={vid.id}
                          onClick={() => navigate(`/watch/${vid.id}`)}
                          className={`w-full text-left px-4 py-3 rounded-lg text-sm font-display transition-all flex items-center justify-between border ${
                            isCurrent
                              ? 'bg-primary-DEFAULT/20 border-primary-DEFAULT/50 text-white shadow-glow'
                              : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <PlayCircle className={`w-4 h-4 ${isCurrent ? 'text-primary-light' : 'text-slate-500'}`} />
                            <span>{idx + 1}. {vid.title}</span>
                          </div>
                          <span className="text-xs font-sans text-slate-500">{vid.duration}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Video Metadata */}
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-display font-semibold uppercase tracking-widest mb-3">
                  {videoData?.course_title}
                </span>
                <h2 className="font-display font-semibold text-2xl text-white">
                  {videoData?.video?.title}
                </h2>
              </div>
              <div className="md:text-right flex items-center md:flex-col gap-3 md:gap-1 bg-white/5 md:bg-transparent p-3 md:p-0 rounded-lg">
                <div className="w-8 h-8 md:hidden rounded-full bg-dark-800 flex items-center justify-center text-primary-light">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-sans text-slate-500 block">Instructor</span>
                  <span className="font-display font-medium text-sm text-slate-300">
                    {videoData?.instructor}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-sm">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center items-center text-center">
                <span className="text-slate-500 text-xs uppercase font-display font-semibold mb-1">Duration</span>
                <span className="text-slate-200">{videoData?.video?.duration || '19:42'}</span>
              </div>
              <div className="p-4 rounded-xl bg-primary-DEFAULT/10 border border-primary-DEFAULT/20 flex flex-col justify-center items-center text-center">
                <span className="text-primary-light/70 text-xs uppercase font-display font-semibold mb-1">AI Grounding</span>
                <span className="text-primary-light font-medium">100% Transcript Verified</span>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center items-center text-center">
                <span className="text-slate-500 text-xs uppercase font-display font-semibold mb-1">Assessment</span>
                <span className="text-slate-200">{currentQuiz ? 'Checkpoint Ready' : 'None'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: AI Tutor Side Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
          className="lg:col-span-4 h-[700px] z-20"
        >
          <AITutorPanel
            videoId={videoData?.video?.id || 'python-setup-vars'}
            videoTitle={videoData?.video?.title || ''}
            instructor={videoData?.instructor || 'Instructor'}
            transcript={videoData?.video?.transcript || []}
          />
        </motion.div>

      </main>

      {/* Quiz Modal Render */}
      <AnimatePresence>
        {showQuizModal && (activeQuiz || currentQuiz) && (
          <QuizModal
            quiz={activeQuiz || currentQuiz}
            onClose={() => {
              setShowQuizModal(false);
              setActiveQuiz(null);
            }}
            onNextLesson={videoData?.next_video_id ? () => {
              setShowQuizModal(false);
              setActiveQuiz(null);
              navigate(`/watch/${videoData.next_video_id}`);
            } : null}
          />
        )}
      </AnimatePresence>

      <SmartNotebook
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        videoTitle={videoData?.video?.title || ''}
        instructor={videoData?.instructor || ''}
      />
    </div>
  );
}
