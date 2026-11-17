import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Bookmark, Play, ArrowRight, User, ArrowLeft, ShieldCheck } from 'lucide-react';
import Header from './Header';
import SkeletonCard from './SkeletonCard';
import dataset100 from '../../../backend/courses_dataset_100.json';

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
    description: item.description,
    video_count: 3,
    first_video_id: `${item.course_id}-lesson-1`,
    difficulty: index % 3 === 0 ? 'Advanced' : (index % 2 === 0 ? 'Intermediate' : 'Beginner'),
    language: index % 4 === 0 ? 'Arabic' : 'English',
  };
});

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
};

export default function LibraryPage({ user, onOpenAuth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'enrolled';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [savedCourses, setSavedCourses] = useState(() => JSON.parse(localStorage.getItem('coursai_saved') || '[]'));
  const [enrolledCourses, setEnrolledCourses] = useState(() => JSON.parse(localStorage.getItem('coursai_enrolled') || '[]'));

  useEffect(() => {
    setActiveTab(queryParams.get('tab') || 'enrolled');
  }, [location.search]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
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
      setCourses(INITIAL_COURSES);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSaved = (e, courseId) => {
    e.stopPropagation();
    const newSaved = savedCourses.includes(courseId) 
      ? savedCourses.filter(id => id !== courseId)
      : [...savedCourses, courseId];
    setSavedCourses(newSaved);
    localStorage.setItem('coursai_saved', JSON.stringify(newSaved));
  };

  const displayedCourses = courses.filter(course => {
    if (activeTab === 'enrolled') return enrolledCourses.includes(course.id);
    if (activeTab === 'saved') return savedCourses.includes(course.id);
    return false;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <Header 
        leftContent={
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 font-display font-medium text-xs border border-white/5 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-primary-light group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Catalog</span>
          </button>
        }
        rightContent={
          <>
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

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
            My Library
          </h1>

          <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
            <button
              onClick={() => { setActiveTab('enrolled'); navigate('/library?tab=enrolled', { replace: true }); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-display text-sm font-semibold transition-all ${
                activeTab === 'enrolled'
                  ? 'bg-primary-DEFAULT text-white shadow-glow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Book className="w-4 h-4" />
              In Progress
            </button>
            <button
              onClick={() => { setActiveTab('saved'); navigate('/library?tab=saved', { replace: true }); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-display text-sm font-semibold transition-all ${
                activeTab === 'saved'
                  ? 'bg-pink-500 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${activeTab === 'saved' ? 'fill-current' : ''}`} />
              Saved
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </motion.div>
          ) : displayedCourses.length > 0 ? (
            <motion.div 
              key="grid"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {displayedCourses.map((course) => (
                <motion.div
                  variants={cardVariant}
                  key={course.id}
                  className="group relative glass-panel rounded-2xl overflow-hidden flex flex-col hover:border-primary-DEFAULT/50 transition-colors duration-300"
                >
                  <div className="relative aspect-video overflow-hidden bg-dark-950">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-80" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-dark-950/40 backdrop-blur-[2px]">
                      <div className="w-14 h-14 rounded-full bg-primary-DEFAULT text-white flex items-center justify-center shadow-glow-strong transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-6 h-6 ml-1" />
                      </div>
                    </div>
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-dark-900/80 backdrop-blur-md text-primary-light text-[10px] font-display font-bold uppercase tracking-wider border border-white/10">
                        {course.category}
                      </span>
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

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{course.instructor}</span>
                      </div>
                    </div>

                    <h4 className="font-display font-semibold text-lg text-white leading-snug mb-3 group-hover:text-primary-light transition-colors line-clamp-2">
                      {course.title}
                    </h4>

                    <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-4">
                      <span className="text-[11px] font-display font-medium text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        {course.video_count || 3} Lessons
                      </span>
                      
                      <button
                        onClick={() => navigate(`/watch/${course.first_video_id || 'python-setup-vars'}`)}
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
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                {activeTab === 'enrolled' ? (
                  <Book className="w-8 h-8 text-slate-400" />
                ) : (
                  <Bookmark className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <h3 className="text-xl font-display font-semibold text-white mb-2">
                {activeTab === 'enrolled' ? "You aren't studying any courses yet" : "No saved courses"}
              </h3>
              <p className="text-slate-400 mb-8 max-w-sm">
                {activeTab === 'enrolled' 
                  ? "Explore the catalog and enter a course to start learning."
                  : "Bookmark courses you're interested in to easily find them later."}
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-full bg-primary-DEFAULT hover:bg-primary-hover text-white font-display font-medium shadow-glow transition-all"
              >
                Browse Catalog
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
