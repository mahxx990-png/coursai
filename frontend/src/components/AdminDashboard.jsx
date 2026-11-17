import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  BookOpen,
  User,
  Youtube,
  ArrowLeft,
  Check,
  AlertCircle,
  ShieldCheck,
  Search,
  Sparkles,
  RefreshCw,
  Award,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Video,
  Layers,
  Clock,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

export default function AdminDashboard({ onCourseAdded }) {
  const navigate = useNavigate();

  // Navigation tab: 'courses' | 'quizzes'
  const [activeTab, setActiveTab] = useState('courses');

  // Data states
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Course Form State
  const [courseTitle, setCourseTitle] = useState('');
  const [courseInstructor, setCourseInstructor] = useState('');
  const [courseCategory, setCourseCategory] = useState('Computer Science');
  const [courseYoutubeUrl, setCourseYoutubeUrl] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseThumbnail, setCourseThumbnail] = useState('');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Lesson Modal State
  const [lessonModalCourse, setLessonModalCourse] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonYoutube, setLessonYoutube] = useState('');
  const [lessonDuration, setLessonDuration] = useState('15:00');
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);

  // Quiz Form State
  const [targetCourseId, setTargetCourseId] = useState('');
  const [targetVideoId, setTargetVideoId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizIsGraded, setQuizIsGraded] = useState(false);
  const [quizPassingScore, setQuizPassingScore] = useState(70);
  const [questions, setQuestions] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      correct_index: 0,
      explanation: ''
    }
  ]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Expanded Quizzes in list
  const [expandedQuizIds, setExpandedQuizIds] = useState(new Set());
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [quizCourseFilter, setQuizCourseFilter] = useState('all');

  // Add Question to Existing Quiz Modal State
  const [activeQuizForQuestion, setActiveQuizForQuestion] = useState(null);
  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState(['', '', '', '']);
  const [newQCorrectIdx, setNewQCorrectIdx] = useState(0);
  const [newQExplanation, setNewQExplanation] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchCourses(), fetchQuizzes()]);
    setIsLoading(false);
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/courses');
      if (res.ok) {
        const data = await res.json();
        const list = data.courses || [];
        setCourses(list);
        if (list.length > 0 && !targetCourseId) {
          setTargetCourseId(list[0].id);
          if (list[0].videos && list[0].videos.length > 0) {
            setTargetVideoId(list[0].videos[0].id);
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch admin courses");
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/quizzes');
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (e) {
      console.warn("Could not fetch admin quizzes");
    }
  };

  const extractYoutubeId = (urlOrId) => {
    if (!urlOrId) return '';
    const str = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    const match = str.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    return str.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 11);
  };

  // -------------------------------------------------------------
  // Course Management Handlers
  // -------------------------------------------------------------
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseInstructor.trim()) {
      setErrorMsg('Course title and instructor name are required.');
      return;
    }

    setIsSubmittingCourse(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      title: courseTitle,
      instructor: courseInstructor,
      category: courseCategory,
      youtube_video_id: courseYoutubeUrl || 'k9TUPpGqYTo',
      description: courseDescription,
      thumbnail: courseThumbnail
    };

    try {
      const res = await fetch('http://localhost:5000/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg(`Course '${courseTitle}' published successfully!`);
        setCourseTitle('');
        setCourseInstructor('');
        setCourseYoutubeUrl('');
        setCourseDescription('');
        setCourseThumbnail('');
        await fetchCourses();
        if (onCourseAdded) onCourseAdded();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to create course');
      }
    } catch (e) {
      setErrorMsg('Error connecting to backend server.');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseTitleText) => {
    if (!window.confirm(`Are you sure you want to delete course '${courseTitleText}'?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/courses/${courseId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== courseId));
        setSuccessMsg(`Course '${courseTitleText}' deleted.`);
        fetchQuizzes();
      }
    } catch (e) {
      setErrorMsg('Failed to delete course.');
    }
  };

  // Add lesson to course
  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!lessonModalCourse || !lessonTitle.trim()) {
      setErrorMsg('Lesson title is required.');
      return;
    }

    setIsSubmittingLesson(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/courses/${lessonModalCourse.id}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonTitle,
          youtube_video_id: lessonYoutube || 'k9TUPpGqYTo',
          duration: lessonDuration || '15:00'
        })
      });

      if (res.ok) {
        setSuccessMsg(`Lesson '${lessonTitle}' added to '${lessonModalCourse.title}'!`);
        setLessonModalCourse(null);
        setLessonTitle('');
        setLessonYoutube('');
        setLessonDuration('15:00');
        fetchCourses();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to add lesson');
      }
    } catch (e) {
      setErrorMsg('Failed to add lesson.');
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  // -------------------------------------------------------------
  // Quiz Management Handlers
  // -------------------------------------------------------------
  const handleTargetCourseChange = (cId) => {
    setTargetCourseId(cId);
    const selected = courses.find(c => c.id === cId);
    if (selected && selected.videos && selected.videos.length > 0) {
      setTargetVideoId(selected.videos[0].id);
    } else {
      setTargetVideoId('');
    }
  };

  const handleAddQuestionField = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: '',
        options: ['', '', '', ''],
        correct_index: 0,
        explanation: ''
      }
    ]);
  };

  const handleRemoveQuestionField = (index) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (qIndex, field, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], [field]: value };
      return updated;
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      const newOpts = [...updated[qIndex].options];
      newOpts[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: newOpts };
      return updated;
    });
  };

  const handleGenerateAIQuiz = async () => {
    const course = courses.find(c => c.id === targetCourseId);
    const video = course?.videos?.find(v => v.id === targetVideoId);

    setIsGeneratingAI(true);
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/admin/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_title: course?.title || 'Course',
          video_title: video?.title || 'Lesson',
          category: course?.category || 'General'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setSuccessMsg(`Generated ${data.questions.length} questions using AI!`);
          if (!quizTitle.trim()) {
            setQuizTitle(`${video?.title || course?.title || 'Lesson'} Checkpoint Quiz`);
          }
        }
      }
    } catch (e) {
      setErrorMsg('Failed to auto-generate questions.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      setErrorMsg('Quiz title is required.');
      return;
    }

    const validQuestions = questions.filter(q => q.question.trim());
    if (validQuestions.length === 0) {
      setErrorMsg('Please add at least one question.');
      return;
    }

    setIsSubmittingQuiz(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      title: quizTitle,
      course_id: targetCourseId,
      video_id: targetVideoId,
      is_graded: quizIsGraded,
      passing_score_percent: Number(quizPassingScore),
      questions: validQuestions
    };

    try {
      const res = await fetch('http://localhost:5000/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg(`Quiz '${quizTitle}' published successfully!`);
        setQuizTitle('');
        setQuestions([
          {
            question: '',
            options: ['', '', '', ''],
            correct_index: 0,
            explanation: ''
          }
        ]);
        await fetchQuizzes();
        await fetchCourses();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to create quiz');
      }
    } catch (e) {
      setErrorMsg('Error connecting to backend server.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quizId, qTitle) => {
    if (!window.confirm(`Are you sure you want to delete quiz '${qTitle}'?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/quizzes/${quizId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setQuizzes(prev => prev.filter(q => q.id !== quizId));
        setSuccessMsg(`Quiz '${qTitle}' deleted.`);
        fetchCourses();
      }
    } catch (e) {
      setErrorMsg('Failed to delete quiz.');
    }
  };

  const handleAddQuestionToExistingQuiz = async (e) => {
    e.preventDefault();
    if (!activeQuizForQuestion || !newQText.trim()) {
      setErrorMsg('Question text is required.');
      return;
    }

    const validOpts = newQOptions.filter(o => o.trim());
    if (validOpts.length < 2) {
      setErrorMsg('Please provide at least 2 options.');
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/quizzes/${activeQuizForQuestion.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQText,
          options: validOpts,
          correct_index: newQCorrectIdx,
          explanation: newQExplanation
        })
      });

      if (res.ok) {
        setSuccessMsg('Question added successfully!');
        setActiveQuizForQuestion(null);
        setNewQText('');
        setNewQOptions(['', '', '', '']);
        setNewQCorrectIdx(0);
        setNewQExplanation('');
        fetchQuizzes();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to add question');
      }
    } catch (e) {
      setErrorMsg('Failed to add question.');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleDeleteQuestionFromQuiz = async (quizId, questionId) => {
    if (!window.confirm('Delete this question?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/quizzes/${quizId}/questions/${questionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSuccessMsg('Question deleted.');
        fetchQuizzes();
      }
    } catch (e) {
      setErrorMsg('Failed to delete question.');
    }
  };

  const toggleQuizExpanded = (qId) => {
    setExpandedQuizIds(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Filtered lists
  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(quizSearchQuery.toLowerCase()) ||
      (q.course_title && q.course_title.toLowerCase().includes(quizSearchQuery.toLowerCase())) ||
      (q.video_title && q.video_title.toLowerCase().includes(quizSearchQuery.toLowerCase()));
    const matchesCourse = quizCourseFilter === 'all' || q.course_id === quizCourseFilter;
    return matchesSearch && matchesCourse;
  });

  const totalQuestionsCount = quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0);
  const totalGradedCount = quizzes.filter(q => q.is_graded).length;

  const currentTargetCourse = courses.find(c => c.id === targetCourseId);
  const targetVideos = currentTargetCourse?.videos || [];

  const previewYoutubeId = extractYoutubeId(courseYoutubeUrl);

  return (
    <div className="min-h-screen flex flex-col font-sans relative pb-28">
      {/* Global Header */}
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
        rightContent={
          <div className="flex items-center space-x-2 bg-primary-DEFAULT/10 px-4 py-2 rounded-full border border-primary-DEFAULT/30 shadow-glow">
            <ShieldCheck className="w-4 h-4 text-primary-light" />
            <span className="font-display font-bold text-xs text-primary-light uppercase tracking-widest">
              Admin Portal
            </span>
          </div>
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8 relative z-10 pt-28">
        
        {/* Top Summary Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel-heavy rounded-3xl border border-white/10 p-6 sm:p-8 text-white shadow-glow flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-DEFAULT/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-primary-light bg-primary-DEFAULT/10 px-3 py-1 rounded-full border border-primary-DEFAULT/20">
                COURSE & ASSESSMENT MANAGEMENT
              </span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
              Academic Control Center (لوحة تحكم المشرف)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl font-sans leading-relaxed">
              إضافة وإدارة الكورسات، والدروس، وتصميم الاختبارات والكويزات التفاعلية مع دعم التوليد الذكي للأسئلة.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0 relative z-10 w-full md:w-auto">
            <div className="p-3.5 sm:p-4 bg-dark-900/60 rounded-2xl border border-white/10 text-center shadow-inner">
              <span className="text-[10px] font-display uppercase tracking-widest text-slate-400 block mb-1">Courses</span>
              <span className="font-display font-bold text-2xl sm:text-3xl text-white">{courses.length}</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-dark-900/60 rounded-2xl border border-white/10 text-center shadow-inner">
              <span className="text-[10px] font-display uppercase tracking-widest text-slate-400 block mb-1">Quizzes</span>
              <span className="font-display font-bold text-2xl sm:text-3xl text-primary-light">{quizzes.length}</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-dark-900/60 rounded-2xl border border-white/10 text-center shadow-inner">
              <span className="text-[10px] font-display uppercase tracking-widest text-slate-400 block mb-1">Questions</span>
              <span className="font-display font-bold text-2xl sm:text-3xl text-amber-400">{totalQuestionsCount}</span>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation Switches */}
        <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center space-x-2.5 px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all shadow-glow ${
              activeTab === 'courses'
                ? 'bg-primary-DEFAULT text-white border border-primary-light/50'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Courses & Lessons (الكورسات والدروس)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 ml-1.5">{courses.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center space-x-2.5 px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all shadow-glow ${
              activeTab === 'quizzes'
                ? 'bg-primary-DEFAULT text-white border border-primary-light/50'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Quizzes & Questions (الكويزات والأسئلة)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 ml-1.5">{quizzes.length}</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-display font-medium flex items-center justify-between shadow-glow"
            >
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg('')} className="text-emerald-500/50 hover:text-emerald-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-display font-medium flex items-center justify-between shadow-glow"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg('')} className="text-rose-500/50 hover:text-rose-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* TAB 1: COURSES & LESSONS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Add Course Form */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 glass-panel rounded-3xl border border-white/10 p-6 shadow-sm space-y-6 flex flex-col h-fit"
            >
              <div className="border-b border-white/10 pb-4">
                <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary-light" />
                  <span>Publish New Course</span>
                </h3>
                <span className="text-xs text-slate-400 font-sans mt-1 block">
                  إضافة كورس تعليمي جديد مع الدرس الأول تلقائياً
                </span>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-display font-medium text-slate-300 mb-1 uppercase tracking-wide">
                    Course Title (عنوان الكورس) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Master React & Redux 2026"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full bg-dark-900/50 px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT text-sm text-white placeholder:text-slate-600 font-sans transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-medium text-slate-300 mb-1 uppercase tracking-wide">
                    Instructor Name (اسم المدرب / القناة) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Corey Schafer or Elzero"
                    value={courseInstructor}
                    onChange={(e) => setCourseInstructor(e.target.value)}
                    className="w-full bg-dark-900/50 px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT text-sm text-white placeholder:text-slate-600 font-sans transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-medium text-slate-300 mb-1 uppercase tracking-wide">
                    Category Track (المسار التعليمي)
                  </label>
                  <select
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    className="w-full bg-dark-900/50 px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT text-sm text-white font-sans transition-all"
                  >
                    <option value="Computer Science">Computer Science (علوم الحاسب)</option>
                    <option value="Web Development">Web Development (تطوير الويب)</option>
                    <option value="Data Science">Data Science (علم البيانات)</option>
                    <option value="Artificial Intelligence">Artificial Intelligence (الذكاء الاصطناعي)</option>
                    <option value="Mobile Development">Mobile Development (تطبيقات الجوال)</option>
                    <option value="DevOps">DevOps & Cloud (الحوسبة السحابية)</option>
                    <option value="Cybersecurity">Cybersecurity (الأمن السيبراني)</option>
                    <option value="Databases">Databases (قواعد البيانات)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-display font-medium text-slate-300 mb-1 uppercase tracking-wide">
                    YouTube URL or Video ID (رابط يوتيوب أو معرف الفيديو)
                  </label>
                  <div className="relative">
                    <Youtube className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={courseYoutubeUrl}
                      onChange={(e) => setCourseYoutubeUrl(e.target.value)}
                      className="w-full bg-dark-900/50 pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT text-sm text-white placeholder:text-slate-600 font-mono transition-all"
                    />
                  </div>
                  {previewYoutubeId && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 aspect-video relative group">
                      <img 
                        src={`https://img.youtube.com/vi/${previewYoutubeId}/hqdefault.jpg`} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-dark-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white font-mono bg-dark-900/80 px-2 py-1 rounded">
                          ID: {previewYoutubeId}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-display font-medium text-slate-300 mb-1 uppercase tracking-wide">
                    Course Description (وصف الكورس)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="نبذة عن محتوى الكورس وما سيتعلمه الطالب..."
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    className="w-full bg-dark-900/50 px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT text-sm text-white placeholder:text-slate-600 font-sans transition-all resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingCourse}
                    className="w-full py-3 rounded-xl bg-primary-DEFAULT hover:bg-primary-hover text-white font-display font-bold text-sm shadow-glow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmittingCourse ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Publishing Course...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Publish Course (نشر الكورس)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Right: Existing Courses List */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 glass-panel rounded-3xl border border-white/10 p-6 shadow-sm flex flex-col space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary-light" />
                    <span>Catalog Courses ({courses.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-sans">
                    يمكنك إضافة دروس جديدة لكل كورس أو حذفه
                  </span>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-900/50 pl-10 pr-4 py-2 rounded-full border border-white/10 focus:outline-none focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT text-sm text-white placeholder:text-slate-500 font-sans transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                {filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-dark-900/50 border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0 relative border border-white/10">
                        {c.thumbnail ? (
                          <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-sm text-white truncate max-w-sm sm:max-w-md">
                          {c.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                          <span>{c.instructor}</span>
                          <span>•</span>
                          <span className="text-primary-light font-medium">{c.category}</span>
                          <span>•</span>
                          <span className="text-slate-300">{c.video_count || c.videos?.length || 1} Lessons</span>
                          <span>•</span>
                          <span className="text-amber-400 font-medium">{c.quiz_count || 0} Quizzes</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          setLessonModalCourse(c);
                          setLessonTitle('');
                          setLessonYoutube('');
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary-DEFAULT/10 hover:bg-primary-DEFAULT/20 text-primary-light text-xs font-display font-medium border border-primary-DEFAULT/20 transition-all"
                        title="Add Video Lesson"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Lesson</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('quizzes');
                          setTargetCourseId(c.id);
                          if (c.videos && c.videos.length > 0) {
                            setTargetVideoId(c.videos[0].id);
                          }
                          setQuizTitle(`${c.title} Checkpoint Quiz`);
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-display font-medium border border-amber-500/20 transition-all"
                        title="Create Quiz for this Course"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Add Quiz</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCourse(c.id, c.title)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors border border-rose-500/20"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredCourses.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-display">
                    No courses found matching your search.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: QUIZZES & QUESTIONS BUILDER (الكويزات والأسئلة) */}
        {/* ========================================================================= */}
        {activeTab === 'quizzes' && (
          <div className="space-y-8">
            
            {/* Top Quizzes Builder Card */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-white flex items-center gap-2">
                    <Award className="w-6 h-6 text-amber-400" />
                    <span>Create & Publish Quiz (إنشاء كويز جديد مع أسئلته)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
                    حدد الكورس والدرس المستهدف، ثم أضف الأسئلة والخيارات وحدد الإجابة الصحيحة.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAIQuiz}
                  disabled={isGeneratingAI}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 font-display font-bold text-xs border border-indigo-500/30 shadow-glow transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingAI ? 'animate-spin' : 'text-amber-400'}`} />
                  <span>{isGeneratingAI ? 'Generating AI Questions...' : '✨ Generate with AI (توليد بالذكاء الاصطناعي)'}</span>
                </button>
              </div>

              <form onSubmit={handleCreateQuiz} className="space-y-6">
                
                {/* Row 1: Target Course, Video & Settings */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-display font-medium text-slate-300 mb-1 uppercase tracking-wide">
                      Target Course (الكورس المستهدف) *
                    </label>
                    <select
                      value={targetCourseId}
                      onChange={(e) => handleTargetCourseChange(e.target.value)}
                      className="w-full bg-dark-900/60 px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-sm text-white font-sans transition-all"
                      required
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-display font-medium text-slate-300 mb-1 uppercase tracking-wide">
                      Target Lesson / Video (الدرس المحدد) *
                    </label>
                    <select
                      value={targetVideoId}
                      onChange={(e) => setTargetVideoId(e.target.value)}
                      className="w-full bg-dark-900/60 px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-sm text-white font-sans transition-all"
                      required
                    >
                      {targetVideos.map(v => (
                        <option key={v.id} value={v.id}>{v.title}</option>
                      ))}
                      {targetVideos.length === 0 && (
                        <option value="">No lessons available</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-display font-medium text-slate-300 mb-1 uppercase tracking-wide">
                      Quiz Title (عنوان الكويز) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Strings & Variables Assessment"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      className="w-full bg-dark-900/60 px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-sm text-white placeholder:text-slate-600 font-sans transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-display font-medium text-slate-300 mb-1 uppercase tracking-wide">
                      Assessment Type (نوع الكويز)
                    </label>
                    <select
                      value={quizIsGraded ? 'graded' : 'practice'}
                      onChange={(e) => setQuizIsGraded(e.target.value === 'graded')}
                      className="w-full bg-dark-900/60 px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-sm text-white font-sans transition-all"
                    >
                      <option value="practice">🟢 Practice Checkpoint (تدريبي)</option>
                      <option value="graded">🏆 Graded Final Exam (نهائي معتمد)</option>
                    </select>
                  </div>
                </div>

                {/* Questions Builder Section */}
                <div className="space-y-4 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary-light" />
                      <span>Questions List ({questions.length} أسئلة)</span>
                    </h4>

                    <button
                      type="button"
                      onClick={handleAddQuestionField}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-display font-medium border border-white/10 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary-light" />
                      <span>+ Add Another Question (إضافة سؤال جديد)</span>
                    </button>
                  </div>

                  {/* Question Cards */}
                  <div className="space-y-4">
                    {questions.map((q, qIdx) => (
                      <div 
                        key={qIdx} 
                        className="p-5 rounded-2xl bg-dark-900/50 border border-white/10 space-y-4 relative"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <span className="font-display font-bold text-xs uppercase tracking-wider text-primary-light flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-primary-DEFAULT/20 flex items-center justify-center text-xs">
                              {qIdx + 1}
                            </span>
                            <span>Question #{qIdx + 1}</span>
                          </span>

                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionField(qIdx)}
                              className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-400 mb-1">
                            Question Text (نص السؤال) *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Which syntax is used to define functions in Python?"
                            value={q.question}
                            onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                            className="w-full bg-dark-950/60 px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-sm text-white placeholder:text-slate-600 font-sans transition-all"
                            required
                          />
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          <label className="block text-[11px] font-display font-medium text-slate-400">
                            Options (الخيارات - حدد الدائرة الخضراء بجانب الإجابة الصحيحة):
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, optIdx) => (
                              <div 
                                key={optIdx} 
                                className={`flex items-center space-x-2.5 p-2 rounded-xl border transition-all ${
                                  q.correct_index === optIdx 
                                    ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30' 
                                    : 'bg-dark-950/40 border-white/5'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct-${qIdx}`}
                                  checked={q.correct_index === optIdx}
                                  onChange={() => handleQuestionChange(qIdx, 'correct_index', optIdx)}
                                  className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                                  title="Mark as Correct Answer"
                                />
                                <span className="font-mono text-xs text-slate-400 font-bold">
                                  {String.fromCharCode(65 + optIdx)}:
                                </span>
                                <input
                                  type="text"
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  value={opt}
                                  onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                  className="flex-1 bg-transparent border-none focus:outline-none text-xs text-white placeholder:text-slate-600 font-sans"
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Explanation */}
                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-400 mb-1">
                            Explanation (شرح سبب صحة الإجابة للطالب عند حل الكويز)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. In Python, the 'def' keyword introduces a function definition..."
                            value={q.explanation}
                            onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                            className="w-full bg-dark-950/60 px-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-xs text-slate-300 placeholder:text-slate-600 font-sans transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    disabled={isSubmittingQuiz}
                    className="px-8 py-3.5 rounded-xl bg-primary-DEFAULT hover:bg-primary-hover text-white font-display font-bold text-sm shadow-glow transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmittingQuiz ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Publishing Quiz...</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        <span>Publish Quiz to Course (حفظ ونشر الكويز)</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>

            {/* Bottom: Published Quizzes List & Question Manager */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Active Published Quizzes ({quizzes.length} كويز نشط)</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-sans">
                    اضغط على أي كويز لمعاينة أسئلته أو إضافة أسئلة جديدة إليه مباشرة
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <select
                    value={quizCourseFilter}
                    onChange={(e) => setQuizCourseFilter(e.target.value)}
                    className="w-full sm:w-48 bg-dark-900/60 px-3 py-2 rounded-full border border-white/10 text-xs text-white font-sans focus:outline-none"
                  >
                    <option value="all">All Courses (جميع الكورسات)</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search quizzes..."
                      value={quizSearchQuery}
                      onChange={(e) => setQuizSearchQuery(e.target.value)}
                      className="w-full bg-dark-900/60 pl-9 pr-4 py-2 rounded-full border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-xs text-white placeholder:text-slate-500 font-sans transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Quizzes Accordion List */}
              <div className="space-y-4">
                {filteredQuizzes.map((quiz) => {
                  const isExpanded = expandedQuizIds.has(quiz.id);
                  return (
                    <div 
                      key={quiz.id}
                      className="rounded-2xl bg-dark-900/50 border border-white/10 overflow-hidden transition-all"
                    >
                      {/* Accordion Header */}
                      <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => toggleQuizExpanded(quiz.id)}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            quiz.is_graded 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-primary-DEFAULT/20 text-primary-light border border-primary-DEFAULT/30'
                          }`}>
                            <Award className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-display font-bold text-sm sm:text-base text-white truncate">
                                {quiz.title}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-display font-bold uppercase tracking-wider ${
                                quiz.is_graded 
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                  : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                              }`}>
                                {quiz.is_graded ? 'Graded Exam' : 'Practice Checkpoint'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                              <span className="text-slate-300 font-medium">{quiz.course_title}</span>
                              <span>•</span>
                              <span>{quiz.video_title}</span>
                              <span>•</span>
                              <span className="text-primary-light font-bold">{quiz.questions?.length || 0} Questions</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setActiveQuizForQuestion(quiz);
                              setNewQText('');
                              setNewQOptions(['', '', '', '']);
                              setNewQCorrectIdx(0);
                              setNewQExplanation('');
                            }}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-display font-medium border border-emerald-500/20 transition-all"
                            title="Add Question to this Quiz"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Add Question</span>
                          </button>

                          <button
                            onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                            title="Delete Quiz"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => toggleQuizExpanded(quiz.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Questions Body */}
                      {isExpanded && (
                        <div className="p-5 border-t border-white/5 bg-dark-950/40 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">
                              Questions in this Quiz ({quiz.questions?.length || 0}):
                            </span>
                            <button
                              onClick={() => {
                                setActiveQuizForQuestion(quiz);
                                setNewQText('');
                                setNewQOptions(['', '', '', '']);
                              }}
                              className="text-xs text-primary-light hover:underline flex items-center gap-1 font-display"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add another question</span>
                            </button>
                          </div>

                          <div className="space-y-3">
                            {quiz.questions?.map((q, idx) => (
                              <div 
                                key={q.id || idx}
                                className="p-4 rounded-xl bg-dark-900/60 border border-white/5 space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start space-x-2">
                                    <span className="w-5 h-5 rounded-md bg-white/5 text-slate-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <p className="font-display font-medium text-sm text-white">
                                      {q.question}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteQuestionFromQuiz(quiz.id, q.id)}
                                    className="p-1 rounded text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                                    title="Delete Question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                  {q.options?.map((opt, optIdx) => {
                                    const isCorrect = optIdx === q.correct_index;
                                    return (
                                      <div 
                                        key={optIdx}
                                        className={`px-3 py-1.5 rounded-lg border flex items-center space-x-2 ${
                                          isCorrect
                                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                                            : 'bg-white/5 border-white/5 text-slate-400'
                                        }`}
                                      >
                                        <span className="font-mono text-[10px] font-bold">
                                          {String.fromCharCode(65 + optIdx)}:
                                        </span>
                                        <span>{opt}</span>
                                        {isCorrect && (
                                          <Check className="w-3 h-3 text-emerald-400 ml-auto" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {q.explanation && (
                                  <p className="text-[11px] text-slate-500 italic border-l-2 border-primary-DEFAULT/40 pl-2 mt-1">
                                    Explanation: {q.explanation}
                                  </p>
                                )}
                              </div>
                            ))}

                            {(!quiz.questions || quiz.questions.length === 0) && (
                              <div className="p-4 text-center text-xs text-slate-500 font-sans">
                                No questions added to this quiz yet.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredQuizzes.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-display">
                    No quizzes found matching your filters.
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD LESSON TO COURSE */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {lessonModalCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-panel-heavy rounded-3xl border border-white/10 p-6 shadow-glow space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-DEFAULT/20 flex items-center justify-center text-primary-light">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">Add Lesson</h3>
                    <p className="text-xs text-slate-400 truncate max-w-xs">{lessonModalCourse.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setLessonModalCourse(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddLesson} className="space-y-4">
                <div>
                  <label className="block text-xs font-display font-medium text-slate-300 mb-1">
                    Lesson Title (عنوان الدرس) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lesson 2: Components & Props"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full bg-dark-900/60 px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-sm text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-medium text-slate-300 mb-1">
                    YouTube URL or ID (رابط يوتيوب أو المعرف)
                  </label>
                  <div className="relative">
                    <Youtube className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      value={lessonYoutube}
                      onChange={(e) => setLessonYoutube(e.target.value)}
                      className="w-full bg-dark-900/60 pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-display font-medium text-slate-300 mb-1">
                    Duration (مدة الدرس التقريبية)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 18:45"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                    className="w-full bg-dark-900/60 px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-sm text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setLessonModalCourse(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-display font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLesson}
                    className="px-5 py-2 rounded-xl bg-primary-DEFAULT hover:bg-primary-hover text-white text-xs font-display font-bold shadow-glow flex items-center space-x-1.5"
                  >
                    {isSubmittingLesson ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Add Lesson</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: ADD QUESTION DIRECTLY TO EXISTING QUIZ */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeQuizForQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl glass-panel-heavy rounded-3xl border border-white/10 p-6 shadow-glow space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">Add Question to Quiz</h3>
                    <p className="text-xs text-slate-400 truncate max-w-xs">{activeQuizForQuestion.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveQuizForQuestion(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddQuestionToExistingQuiz} className="space-y-4">
                <div>
                  <label className="block text-xs font-display font-medium text-slate-300 mb-1">
                    Question Text (نص السؤال) *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter question..."
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    className="w-full bg-dark-900/60 px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-sm text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-display font-medium text-slate-300">
                    Options (حدد الإجابة الصحيحة بالدائرة الخضراء):
                  </label>
                  <div className="space-y-2">
                    {newQOptions.map((opt, optIdx) => (
                      <div 
                        key={optIdx}
                        className={`flex items-center space-x-2.5 p-2 rounded-xl border ${
                          newQCorrectIdx === optIdx 
                            ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30' 
                            : 'bg-dark-900/40 border-white/5'
                        }`}
                      >
                        <input
                          type="radio"
                          name="new-q-correct"
                          checked={newQCorrectIdx === optIdx}
                          onChange={() => setNewQCorrectIdx(optIdx)}
                          className="w-4 h-4 text-emerald-500 cursor-pointer accent-emerald-500"
                        />
                        <span className="font-mono text-xs text-slate-400 font-bold">
                          {String.fromCharCode(65 + optIdx)}:
                        </span>
                        <input
                          type="text"
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newQOptions];
                            updated[optIdx] = e.target.value;
                            setNewQOptions(updated);
                          }}
                          className="flex-1 bg-transparent border-none focus:outline-none text-xs text-white"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-display font-medium text-slate-300 mb-1">
                    Explanation (شرح سبب صحة الإجابة)
                  </label>
                  <input
                    type="text"
                    placeholder="Why this answer is correct..."
                    value={newQExplanation}
                    onChange={(e) => setNewQExplanation(e.target.value)}
                    className="w-full bg-dark-900/60 px-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT text-xs text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveQuizForQuestion(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-display font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuestion}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-display font-bold shadow-glow flex items-center space-x-1.5"
                  >
                    {isSubmittingQuestion ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Add Question</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
