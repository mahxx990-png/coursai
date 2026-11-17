import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  FileText,
  User,
  Zap,
  BarChart3,
  Calendar,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Header from './Header';
import CertificateModal from './CertificateModal';

export default function ProfilePage({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCert, setSelectedCert] = useState(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 font-sans relative">
        <div className="absolute inset-0 bg-primary-DEFAULT/10 blur-[100px] pointer-events-none" />
        <div className="glass-panel-heavy p-8 rounded-2xl border border-white/10 shadow-glow max-w-md w-full text-center space-y-5 relative z-10">
          <Logo size="lg" className="justify-center" />
          <h2 className="font-display font-bold text-2xl text-white">Student Sign In Required</h2>
          <p className="text-sm text-slate-400">Please sign in to view your academic profile and certificates.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-lg bg-primary-DEFAULT hover:bg-primary-hover text-white font-display font-medium text-sm transition-all shadow-glow"
          >
            Return to Catalog
          </button>
        </div>
      </div>
    );
  }

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user]);

  const fetchEnrolledCourses = async () => {
    setIsLoading(true);
    try {
      const enrolledIds = JSON.parse(localStorage.getItem('coursai_enrolled') || '[]');
      const res = await fetch(`http://${window.location.hostname}:5000/api/courses`);
      if (res.ok) {
        const data = await res.json();
        if (data.courses) {
          const mappedCourses = data.courses
            .filter(c => enrolledIds.includes(c.id))
            .map((c, index) => ({
              ...c,
              thumbnail: c.thumbnail.replace('hqdefault.jpg', 'maxresdefault.jpg'),
              progress: [85, 60, 40, 20, 10][index % 5],
              completedLessons: [3, 2, 1, 0, 0][index % 5],
              totalLessons: c.video_count || 3,
              lastStudied: ['Today', 'Yesterday', '3 days ago', 'Last week'][index % 4],
              final_exam_passed: index === 0,
              grade: index === 0 ? '95%' : null
            }));
          setEnrolledCourses(mappedCourses);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch enrolled courses', e);
    } finally {
      setIsLoading(false);
    }
  };

  const CERTIFICATES = [
    {
      id: 'cert-py-101',
      title: 'Certified Python Programming Scholar',
      issuedDate: 'July 20, 2026',
      instructor: 'Corey Schafer',
      grade: '95%',
      code: 'CRS-PY-884912'
    }
  ];

  const AI_CHAT_LOGS = [
    {
      id: 'log-1',
      course: 'Python Fundamentals',
      lesson: 'Strings - Working with Textual Data',
      question: 'How do f-strings handle variable expressions inside brackets?',
      date: 'July 21, 2026',
      groundedSnippet: 'f-strings evaluate expressions at runtime directly using Python bytecode...'
    },
    {
      id: 'log-2',
      course: 'HTML5 Course',
      lesson: 'Semantic Elements',
      question: 'What is the main semantic purpose of <article> vs <section>?',
      date: 'July 19, 2026',
      groundedSnippet: '<article> represents self-contained independent content suitable for syndication...'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative pb-24">
      {/* Unified Global Header */}
      <Header 
        leftContent={
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 font-display font-medium text-xs border border-white/10 transition-all hover:shadow-glow group"
          >
            <ArrowLeft className="w-4 h-4 text-primary-light group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Catalog</span>
          </button>
        }
        centerContent={
          <div className="flex items-center space-x-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-DEFAULT to-indigo-600 text-white flex items-center justify-center shadow-glow">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] text-primary-light font-display font-semibold uppercase tracking-widest leading-none">
              Academic Profile
            </span>
          </div>
        }
        rightContent={
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-display font-medium text-xs transition-colors shadow-sm group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        }
      />

      {/* Main Student Profile Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-10 relative z-10 pt-28">
        
        {/* Profile Hero Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl border border-white/10 p-8 md:p-10 text-white overflow-hidden glass-panel-heavy shadow-glow-strong"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-DEFAULT/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center space-y-5 md:space-y-0 md:space-x-8 text-center md:text-left">
              {/* Student Avatar */}
              <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-DEFAULT to-indigo-700 flex items-center justify-center text-white font-display text-5xl font-bold shadow-glow border border-white/20 shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>

              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h2 className="font-display font-bold text-3xl md:text-4xl text-white">{user.name}</h2>
                  <ShieldCheck className="w-6 h-6 text-primary-light hidden md:block" />
                </div>
                <p className="text-sm text-slate-400 font-sans">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  <span className="px-4 py-1.5 rounded-full bg-primary-DEFAULT/20 border border-primary-DEFAULT/40 text-primary-light text-[11px] font-display font-medium uppercase tracking-wider">
                    Computer Science Track
                  </span>
                  <span className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-display font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Honor Roll
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Joined Meta */}
            <div className="text-center md:text-right space-y-2 font-display bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Student ID</span>
              <span className="font-mono text-sm font-bold text-white tracking-widest">STU-2026-8890</span>
              <p className="text-xs text-slate-400 font-sans mt-1">Joined {user.joinedDate || 'July 2026'}</p>
            </div>
          </div>
        </motion.div>

        {/* Academic Stats Metric Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-display font-medium uppercase tracking-wider text-slate-400 block mb-1">
                Enrolled
              </span>
              <span className="font-display font-bold text-2xl text-white">{enrolledCourses.length} Tracks</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-display font-medium uppercase tracking-wider text-slate-400 block mb-1">
                Completed
              </span>
              <span className="font-display font-bold text-2xl text-white">12 Quizzes</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-primary-DEFAULT/10 border border-primary-DEFAULT/20 flex items-center justify-center text-primary-light">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-display font-medium uppercase tracking-wider text-slate-400 block mb-1">
                Total XP
              </span>
              <span className="font-display font-bold text-2xl text-white">1,850 XP</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-display font-medium uppercase tracking-wider text-slate-400 block mb-1">
                Certificates
              </span>
              <span className="font-display font-bold text-2xl text-white">{CERTIFICATES.length} Verified</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Tab Navigation Menu */}
        <div className="glass-panel rounded-2xl p-2 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-display font-medium text-sm transition-all ${
              activeTab === 'courses'
                ? 'bg-primary-DEFAULT text-white shadow-glow'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Courses</span>
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-display font-medium text-sm transition-all ${
              activeTab === 'certificates'
                ? 'bg-primary-DEFAULT text-white shadow-glow'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Diplomas</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-display font-medium text-sm transition-all ${
              activeTab === 'analytics'
                ? 'bg-primary-DEFAULT text-white shadow-glow'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>AI Tutor Logs</span>
          </button>
        </div>

        {/* Tabs Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary-light" />
                  Recent Courses
                </h3>
                <button 
                  onClick={() => navigate('/library?tab=enrolled')}
                  className="text-sm font-display font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  View Library <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-10 text-slate-400 font-display">Loading courses...</div>
              ) : enrolledCourses.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-display">No courses enrolled yet. <button onClick={() => navigate('/')} className="text-primary-light hover:underline ml-1">Explore catalog</button></div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {enrolledCourses.map((course) => (
                    <div
                      key={course.id}
                      className="glass-panel rounded-2xl p-6 space-y-5 flex flex-col justify-between group hover:border-primary-DEFAULT/30 transition-colors"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-display font-medium uppercase tracking-wider text-primary-light bg-primary-DEFAULT/10 px-3 py-1.5 rounded-full border border-primary-DEFAULT/20">
                            {course.category}
                          </span>
                        <span className="text-xs text-slate-500 font-sans">Last studied {course.lastStudied}</span>
                      </div>

                      <h4 className="font-display font-bold text-xl text-white leading-snug group-hover:text-primary-light transition-colors">
                        {course.title}
                      </h4>
                      <p className="text-sm text-slate-400 font-sans">Instructor: {course.instructor}</p>

                      {/* Progress Bar */}
                      <div className="space-y-2.5 pt-3">
                        <div className="flex justify-between text-xs font-display font-medium text-slate-300">
                          <span>Overall Progress</span>
                          <span className="text-primary-light">{course.progress}%</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-dark-900 overflow-hidden shadow-inner border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-primary-DEFAULT to-indigo-400 rounded-full transition-all duration-700 ease-out shadow-glow"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 font-sans">
                          {course.completedLessons} of {course.totalLessons} Lessons Completed
                        </p>
                      </div>
                    </div>

                    <div className="pt-5 flex items-center justify-between border-t border-white/10 mt-auto">
                      {course.final_exam_passed ? (
                        <span className="text-xs font-display font-medium text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Exam Passed ({course.grade})</span>
                        </span>
                      ) : (
                        <span className="text-xs font-display text-slate-500 italic bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                          Exam Pending
                        </span>
                      )}

                      <button
                        onClick={() => navigate(`/watch/${course.first_video_id}`)}
                        className="px-5 py-2.5 rounded-xl bg-primary-DEFAULT hover:bg-primary-hover text-white font-display font-medium text-sm shadow-glow transition-all flex items-center gap-2 group/btn"
                      >
                        <span>Continue</span>
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </motion.div>
          )}

          {activeTab === 'certificates' && (
            <motion.div
              key="certs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Official Verified Diplomas</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CERTIFICATES.map((cert) => (
                  <div
                    key={cert.id}
                    className="glass-panel-heavy rounded-2xl border border-amber-500/20 p-8 space-y-6 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
                    
                    <div className="flex items-start justify-between border-b border-amber-500/20 pb-4 relative z-10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-glow">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-lg text-white group-hover:text-amber-400 transition-colors">{cert.title}</h4>
                          <p className="text-xs text-slate-400 font-sans mt-0.5">Issued to {user.name}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-display text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                        Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-sans text-slate-300 relative z-10">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <span className="text-slate-500 block text-[10px] uppercase font-display font-medium mb-1">Instructor</span>
                        <span className="font-medium text-white">{cert.instructor}</span>
                      </div>
                      <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                        <span className="text-slate-500 block text-[10px] uppercase font-display font-medium mb-1">Grade Achieved</span>
                        <span className="font-bold text-emerald-400">{cert.grade}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <span className="text-slate-500 block text-[10px] uppercase font-display font-medium mb-1">Issue Date</span>
                        <span className="font-medium text-white">{cert.issuedDate}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <span className="text-slate-500 block text-[10px] uppercase font-display font-medium mb-1">Verification Code</span>
                        <span className="font-mono font-medium text-primary-light">{cert.code}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-amber-500/20 flex justify-end relative z-10">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-display font-medium text-sm border border-amber-500/30 transition-all shadow-glow"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Official Certificate</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary-light" />
                <span>AI Tutor Transcript Inquiries</span>
              </h3>

              <div className="space-y-4">
                {AI_CHAT_LOGS.map((log) => (
                  <div key={log.id} className="glass-panel p-6 rounded-2xl space-y-4 border-l-4 border-l-primary-DEFAULT">
                    <div className="flex items-center justify-between text-xs font-display">
                      <span className="font-medium text-primary-light bg-primary-DEFAULT/10 px-3 py-1 rounded-full border border-primary-DEFAULT/20">
                        {log.course} • {log.lesson}
                      </span>
                      <span className="text-slate-500">{log.date}</span>
                    </div>
                    <h4 className="font-display font-medium text-base text-white">"{log.question}"</h4>
                    <p className="text-sm text-slate-300 italic bg-dark-900/50 p-4 rounded-xl border border-white/5 font-sans leading-relaxed">
                      <span className="text-primary-light font-medium block mb-1 not-italic text-xs font-display uppercase tracking-widest">Grounded Extract</span>
                      "{log.groundedSnippet}"
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Render Official Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          studentName={user.name}
          isOpen={!!selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}
