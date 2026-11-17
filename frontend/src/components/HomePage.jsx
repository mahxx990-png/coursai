import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, BookOpen, Filter, ArrowRight, User, ShieldCheck, Sparkles, MonitorPlay, Bookmark, Book } from 'lucide-react';
import Logo from './Logo';
import Header from './Header';
import dataset100 from '../../../backend/courses_dataset_100.json';
import AICourseMatchmaker from './AICourseMatchmaker';
import SkeletonCard from './SkeletonCard';

const INITIAL_COURSES = dataset100.map((item, index) => {
  let ytId = 'k9TUPpGqYTo';
  if (item.playlist_url && item.playlist_url.includes('list=')) {
    ytId = item.playlist_url.split('list=')[1].split('&')[0];
  }
  return {
    id: item.course_id,
    title: item.title,
    instructor: item.instructor,
    category: item.category || 'General',
    thumbnail: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
    description: item.description || `Master ${item.title} taught by ${item.instructor}. Interactive watch room, transcript-grounded AI tutor, and quizzes.`,
    video_count: 3,
    first_video_id: `${item.course_id}-lesson-1`,
    difficulty: index % 3 === 0 ? 'Advanced' : (index % 2 === 0 ? 'Intermediate' : 'Beginner'),
    language: index % 4 === 0 ? 'Arabic' : 'English',
  };
});

// Framer Motion variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
};

export default function HomePage({ user, onOpenAuth }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [isAIMatchmakerOpen, setIsAIMatchmakerOpen] = useState(false);
  const [aiRecommendedCourses, setAiRecommendedCourses] = useState(null);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);
  
  const [savedCourses, setSavedCourses] = useState(() => JSON.parse(localStorage.getItem('coursai_saved') || '[]'));
  const [enrolledCourses, setEnrolledCourses] = useState(() => JSON.parse(localStorage.getItem('coursai_enrolled') || '[]'));

  const toggleSaved = (e, courseId) => {
    e.stopPropagation();
    const newSaved = savedCourses.includes(courseId) 
      ? savedCourses.filter(id => id !== courseId)
      : [...savedCourses, courseId];
    setSavedCourses(newSaved);
    localStorage.setItem('coursai_saved', JSON.stringify(newSaved));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    // Simulate network delay for skeletons
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/courses`);
      if (res.ok) {
        const data = await res.json();
        if (data.courses && data.courses.length > 0) {
          const upgradedCourses = data.courses.map((c, idx) => ({
            ...c,
            thumbnail: c.thumbnail.replace('hqdefault.jpg', 'maxresdefault.jpg'),
            difficulty: idx % 3 === 0 ? 'Advanced' : (idx % 2 === 0 ? 'Intermediate' : 'Beginner'),
            language: idx % 4 === 0 ? 'Arabic' : 'English',
          }));
          setCourses(upgradedCourses);
        }
      } else {
        setCourses(INITIAL_COURSES);
      }
    } catch (err) {
      console.warn("Backend API offline. Displaying local dataset.");
      setCourses(INITIAL_COURSES);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];

  const filteredCourses = courses.filter(course => {
    if (aiRecommendedCourses) {
      return aiRecommendedCourses.includes(course.id);
    }

    const safeTitle = course.title || '';
    const safeInstructor = course.instructor || '';
    const safeDescription = course.description || '';

    const matchesSearch = 
      safeTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      safeInstructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      safeDescription.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || course.difficulty === selectedDifficulty;
    const matchesLanguage = selectedLanguage === 'All' || course.language === selectedLanguage;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesLanguage;
  }).sort((a, b) => {
    if (sortBy === 'videos_desc') return (b.video_count || 0) - (a.video_count || 0);
    if (sortBy === 'videos_asc') return (a.video_count || 0) - (b.video_count || 0);
    // Default newest (just keep original order for now)
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      
      {/* Unified Global Header */}
      <Header 
        leftContent={
          <div className="hidden sm:block text-xs font-display font-medium text-slate-300 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <span className="text-primary-light font-bold">{courses.length}</span> Courses
          </div>
        }
        rightContent={
          <>
            {user && (
              <>
                <button
                  onClick={() => navigate('/library?tab=enrolled')}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full font-display font-medium text-xs border transition-all bg-white/5 text-slate-200 border-white/10 hover:bg-white/10 hover:shadow-glow"
                  title="My Courses"
                >
                  <Book className="w-4 h-4" />
                  <span className="hidden lg:inline">My Courses</span>
                </button>
                <button
                  onClick={() => navigate('/library?tab=saved')}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full font-display font-medium text-xs border transition-all bg-white/5 text-slate-200 border-white/10 hover:bg-white/10 hover:shadow-glow"
                  title="Saved Courses"
                >
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden lg:inline">Saved</span>
                </button>
                <div className="hidden sm:block h-6 w-px bg-white/10 mx-1"></div>
              </>
            )}

            {user && user.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-display font-medium border border-white/10 transition-all hover:shadow-glow group"
              >
                <ShieldCheck className="w-4 h-4 text-primary-light group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-3 px-2 py-1 pr-4 rounded-full bg-primary-DEFAULT/10 border border-primary-DEFAULT/30 hover:bg-primary-DEFAULT/20 hover:border-primary-light transition-all shadow-glow group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-DEFAULT to-indigo-700 text-white font-display font-bold text-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <span className="font-display font-medium text-sm text-primary-light hidden sm:inline">
                  {user.name}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-primary-DEFAULT hover:bg-primary-hover text-white font-display font-medium text-sm transition-all shadow-glow-strong group"
              >
                <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Sign In</span>
              </button>
            )}
          </>
        }
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-12 pb-24 pt-28">
        
        {/* Hero Section */}
        <section className="relative pt-16 pb-8 flex flex-col items-center text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 max-w-3xl"
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary-DEFAULT/10 border border-primary-DEFAULT/20 text-primary-light text-xs font-display font-semibold uppercase tracking-widest mb-4">
              Next-Gen Learning Platform
            </span>
            <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-tight px-4">
              Master new skills with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-indigo-400">AI-Grounded Tutors</span>
            </h1>
            <p className="text-slate-400 font-sans text-lg max-w-2xl mx-auto leading-relaxed">
              Explore interactive YouTube courses. Dive into Watch Rooms equipped with transcript-aware AI, instant quizzes, and deep focus mode.
            </p>
          </motion.div>

          {/* Search and FYP */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3, type: "spring" }}
            className="w-full max-w-3xl flex items-center gap-2 sm:gap-3 px-2 sm:px-0"
          >
            <div className="relative flex-1 group min-w-0">
              <div className="absolute inset-0 bg-primary-DEFAULT/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center bg-dark-900/80 backdrop-blur-xl border border-white/10 rounded-full overflow-hidden shadow-glass p-1.5 sm:p-2">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 ml-2 sm:ml-4 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (aiRecommendedCourses) setAiRecommendedCourses(null);
                  }}
                  placeholder="Search courses..."
                  className="w-full bg-transparent border-none px-2 py-2 sm:px-4 sm:py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none font-sans text-sm sm:text-lg min-w-0"
                />
                <button 
                  onClick={() => setIsAIMatchmakerOpen(true)}
                  className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-primary-DEFAULT to-indigo-600 hover:from-primary-hover hover:to-indigo-500 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-display font-bold text-white shadow-glow mr-1 sm:mr-2 transition-all transform hover:scale-105 flex-shrink-0"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline whitespace-nowrap">Ask AI</span>
                </button>
              </div>
            </div>

            <button 
              onClick={() => navigate('/fyp')}
              className="flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 p-3 sm:p-4 rounded-full text-white shadow-glow-strong transition-all transform hover:scale-110 border border-white/20 group"
              title="For You Page (TikTok mode)"
            >
              <MonitorPlay className="w-5 h-5 sm:w-6 sm:h-6 fill-current group-hover:animate-pulse" />
            </button>
          </motion.div>

          {/* Categories */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center flex-wrap gap-3 pt-6"
          >
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full font-display text-sm transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-primary-DEFAULT text-white shadow-glow'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Advanced Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-4xl mt-6 flex flex-wrap items-center justify-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-display text-slate-400">Filters:</span>
            </div>
            
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-dark-900 border border-white/10 rounded-full px-4 py-1.5 text-sm font-display text-slate-300 focus:outline-none focus:border-primary-DEFAULT"
            >
              <option value="All">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-dark-900 border border-white/10 rounded-full px-4 py-1.5 text-sm font-display text-slate-300 focus:outline-none focus:border-primary-DEFAULT"
            >
              <option value="All">All Languages</option>
              <option value="English">English</option>
              <option value="Arabic">Arabic</option>
            </select>

            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-dark-900 border border-white/10 rounded-full px-4 py-1.5 text-sm font-display text-slate-300 focus:outline-none focus:border-primary-DEFAULT"
            >
              <option value="newest">Sort: Newest</option>
              <option value="videos_desc">Most Lessons</option>
              <option value="videos_asc">Fewest Lessons</option>
            </select>
          </motion.div>
        </section>

        {/* AI Matchmaker */}
        <AnimatePresence>
          {isAIMatchmakerOpen && (
            <AICourseMatchmaker 
              onClose={() => setIsAIMatchmakerOpen(false)}
              localCourses={courses}
              onSelectCourse={(id) => navigate(`/watch/${id}`)}
              onResults={(courseIds) => {
                setAiRecommendedCourses(courseIds);
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            />
          )}
        </AnimatePresence>

        {/* FYP Mode was moved to its own route */}

        {/* Course Confirmation Modal */}
        <AnimatePresence>
          {selectedCourseForModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
                onClick={() => setSelectedCourseForModal(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl relative z-10 shadow-glow-strong border border-white/10"
              >
                <div className="w-16 h-16 rounded-full bg-primary-DEFAULT/20 flex items-center justify-center mb-6 border border-primary-DEFAULT/30 shadow-glow">
                  <BookOpen className="w-8 h-8 text-primary-light" />
                </div>
                
                <h3 className="text-2xl font-display font-bold text-white mb-2 leading-tight">
                  تأكيد التسجيل في الكورس
                </h3>
                <p className="text-sm text-slate-400 mb-8 font-sans leading-relaxed">
                  أنت على وشك الدخول إلى <strong className="text-white">{selectedCourseForModal.title}</strong>. هل ترغب في التسجيل رسمياً لمتابعة تقدمك أم ترغب في المطالعة فقط؟
                </p>
                
                <div className="flex flex-col space-y-3">
                  <button 
                    onClick={() => {
                      // Here you would typically dispatch an API call to enroll
                      navigate(`/watch/${selectedCourseForModal.first_video_id || 'python-setup-vars'}`);
                      setSelectedCourseForModal(null);
                    }}
                    className="w-full py-3.5 rounded-xl bg-primary-DEFAULT hover:bg-primary-hover text-white font-display font-semibold transition-all shadow-glow hover:shadow-glow-strong flex items-center justify-center gap-2 group"
                  >
                    <span>تأكيد التسجيل</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <button 
                    onClick={() => {
                      navigate(`/watch/${selectedCourseForModal.first_video_id || 'python-setup-vars'}`);
                      setSelectedCourseForModal(null);
                    }}
                    className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-display font-medium transition-colors"
                  >
                    مطالعة فقط
                  </button>
                  
                  <button 
                    onClick={() => setSelectedCourseForModal(null)}
                    className="w-full py-3 rounded-xl bg-transparent hover:bg-white/5 text-slate-500 hover:text-slate-300 font-display transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Course Grid Header */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between border-b border-white/10 pb-4"
        >
          <h3 className="font-display font-bold text-2xl text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary-light" />
            Featured Courses
          </h3>
          <span className="text-slate-400 text-sm font-display">{isLoading ? '-' : filteredCourses.length} results</span>
        </motion.div>

        {/* Course Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
            </motion.div>
          ) : filteredCourses.length > 0 ? (
            <motion.div 
              key="grid"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredCourses.map((course) => (
                <motion.div
                  variants={cardVariant}
                  key={course.id}
                  className="group relative glass-panel rounded-2xl overflow-hidden flex flex-col hover:border-primary-DEFAULT/50 transition-colors duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-dark-950">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-80" />
                    
                    {/* Hover Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-dark-950/40 backdrop-blur-[2px]">
                      <div className="w-14 h-14 rounded-full bg-primary-DEFAULT text-white flex items-center justify-center shadow-glow-strong transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-6 h-6 ml-1" />
                      </div>
                    </div>
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-dark-900/80 backdrop-blur-md text-primary-light text-[10px] font-display font-bold uppercase tracking-wider border border-white/10">
                        {course.category}
                      </span>
                      {course.difficulty && (
                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 backdrop-blur-md text-indigo-300 text-[10px] font-display font-bold uppercase tracking-wider border border-indigo-500/30">
                          {course.difficulty}
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => toggleSaved(e, course.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all z-10 ${
                        savedCourses.includes(course.id)
                          ? 'bg-pink-500/80 text-white border-pink-400 shadow-glow'
                          : 'bg-dark-900/80 text-slate-300 border-white/10 hover:bg-white/20'
                      }`}
                      title={savedCourses.includes(course.id) ? "Remove from saved" : "Save for later"}
                    >
                      <Bookmark className={`w-4 h-4 ${savedCourses.includes(course.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{course.instructor}</span>
                      </div>
                      {course.language && (
                        <span className="text-[10px] uppercase tracking-wider">{course.language}</span>
                      )}
                    </div>

                    <h4 className="font-display font-semibold text-lg text-white leading-snug mb-3 group-hover:text-primary-light transition-colors line-clamp-2">
                      {course.title}
                    </h4>

                    <p className="text-sm text-slate-400 line-clamp-2 mb-6 flex-1">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-4">
                      <span className="text-[11px] font-display font-medium text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        {course.video_count || 3} Lessons
                      </span>
                      
                      <button
                        onClick={() => setSelectedCourseForModal(course)}
                        className="text-primary-light font-display font-medium text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        Enter Course
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="glass-panel-heavy rounded-2xl p-16 text-center space-y-4 max-w-2xl mx-auto mt-12"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-slate-500" />
              </div>
              <h4 className="font-display font-bold text-2xl text-white">No Courses Found</h4>
              <p className="text-slate-400 font-sans">
                We couldn't find any courses matching "{searchQuery}". Try using different keywords or browse all categories.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setAiRecommendedCourses(null);
                }}
                className="mt-6 inline-block px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-display font-medium transition-colors"
              >
                Clear Search
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
