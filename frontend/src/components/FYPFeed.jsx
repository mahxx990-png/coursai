import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Share2, Bookmark, Play, ArrowRight, User } from 'lucide-react';
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
    description: item.description || `Master ${item.title} taught by ${item.instructor}. Interactive watch room, transcript-grounded AI tutor, and quizzes.`,
    video_count: 3,
    first_video_id: `${item.course_id}-lesson-1`,
    difficulty: index % 3 === 0 ? 'Advanced' : (index % 2 === 0 ? 'Intermediate' : 'Beginner'),
    language: index % 4 === 0 ? 'Arabic' : 'English',
  };
});

export default function FYPFeed() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const [savedCourses, setSavedCourses] = useState(() => JSON.parse(localStorage.getItem('coursai_saved') || '[]'));

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

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPosition = containerRef.current.scrollTop;
    const windowHeight = window.innerHeight;
    const index = Math.round(scrollPosition / windowHeight);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[100] bg-black text-white overflow-hidden flex flex-col"
      >
        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-white/20 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex space-x-6 text-sm font-display font-bold text-white/70">
            <span className="cursor-pointer hover:text-white transition">Following</span>
            <span className="text-white border-b-2 border-white pb-1">For You</span>
          </div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Scrollable Feed */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative"
          style={{ scrollBehavior: 'smooth' }}
        >
          {courses.map((course, index) => (
            <div 
              key={course.id} 
              className="h-screen w-full snap-center snap-always relative flex items-center justify-center bg-black"
            >
              {/* Background Image / Video Mock */}
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />
              <div className="absolute inset-0 bg-black/20" /> {/* Slight dark overlay */}

              {/* Main Content Area */}
              <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 md:pb-12 md:px-8 flex items-end justify-between">
                
                {/* Left Side: Info */}
                <div className="flex-1 max-w-3xl">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-DEFAULT to-indigo-600 flex items-center justify-center border border-white/20">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-display font-bold text-lg">@{course.instructor.replace(/\s+/g, '').toLowerCase()}</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display leading-tight">
                      {course.title}
                    </h2>
                    
                    <p className="text-sm sm:text-base text-white/90 line-clamp-3 font-sans max-w-2xl">
                      {course.description}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold">
                        {course.category}
                      </span>
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold">
                        {course.video_count || 3} Lessons
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <button 
                        onClick={() => navigate(`/watch/${course.first_video_id || 'python-setup-vars'}`)}
                        className="flex items-center justify-center space-x-2 bg-primary-DEFAULT hover:bg-primary-hover px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold transition-all shadow-glow group w-full sm:w-auto text-sm sm:text-base"
                      >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                        <span>Start Learning</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                    
                  </motion.div>
                </div>

                {/* Right Side: Actions */}
                <div className="flex flex-col items-center justify-end space-y-6 pb-12">
                  <div className="relative group">
                    <button className="p-3 rounded-full bg-dark-900/40 backdrop-blur-md hover:bg-white/10 transition-colors group relative flex flex-col items-center gap-1">
                      <Heart className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-display font-medium text-white shadow-sm">Like</span>
                    </button>
                  </div>
                  
                  <button className="p-3 rounded-full bg-dark-900/40 backdrop-blur-md hover:bg-white/10 transition-colors group relative flex flex-col items-center gap-1">
                    <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-display font-medium text-white shadow-sm">Chat</span>
                  </button>

                  <button className="p-3 rounded-full bg-dark-900/40 backdrop-blur-md hover:bg-white/10 transition-colors group relative flex flex-col items-center gap-1">
                    <Share2 className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-display font-medium text-white shadow-sm">Share</span>
                  </button>
                  
                  <button 
                    onClick={(e) => toggleSaved(e, course.id)}
                    className="p-3 rounded-full bg-dark-900/40 backdrop-blur-md hover:bg-white/10 transition-colors group relative flex flex-col items-center gap-1"
                  >
                    <Bookmark className={`w-6 h-6 group-hover:scale-110 transition-transform ${savedCourses.includes(course.id) ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                    <span className="text-xs font-display font-medium text-white shadow-sm">Save</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
