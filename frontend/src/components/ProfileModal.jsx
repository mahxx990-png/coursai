import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Award, BookOpen, Clock, CheckCircle2, LogOut, X, Sparkles } from 'lucide-react';

export default function ProfileModal({ user, isOpen, onClose, onLogout }) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col font-sans max-h-[85vh]"
      >
        {/* Header Profile Cover */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-700 border-2 border-white/20 flex items-center justify-center text-white font-serif text-2xl font-bold shadow-lg">
              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif font-bold text-xl tracking-wide">{user.name}</h2>
                <span className="px-2 py-0.5 rounded bg-blue-600/60 text-blue-100 text-[10px] font-serif font-bold tracking-widest uppercase">
                  Verified Student
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">{user.email}</p>
              <p className="text-[11px] text-blue-300 font-serif mt-1">Joined {user.joinedDate || 'July 2026'}</p>
            </div>
          </div>
        </div>

        {/* Academic Stats Bar */}
        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 p-4 gap-4 text-center">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-center space-x-1.5 text-blue-700 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-slate-500">
                Courses
              </span>
            </div>
            <span className="font-serif font-bold text-xl text-slate-900">{user.enrolledCoursesCount || 4}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-center space-x-1.5 text-emerald-600 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-slate-500">
                Quizzes Passed
              </span>
            </div>
            <span className="font-serif font-bold text-xl text-slate-900">{user.completedQuizzesCount || 12}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-center space-x-1.5 text-amber-600 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-slate-500">
                Academic XP
              </span>
            </div>
            <span className="font-serif font-bold text-xl text-slate-900">{user.totalXP || 1450}</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Course Track Progress */}
          <div>
            <h3 className="font-serif font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-700" />
              <span>Active Course Enrolments</span>
            </h3>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-serif">
                  <span className="font-bold text-slate-900">Python Programming: Complete Beginner Fundamentals</span>
                  <span className="text-blue-700 font-bold">85% Complete</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[85%]" />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-serif">
                  <span className="font-bold text-slate-900">HTML5 & Web Fundamentals Course</span>
                  <span className="text-blue-700 font-bold">60% Complete</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[60%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Academic Achievement Badges */}
          <div>
            <h3 className="font-serif font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Academic Badges</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-xs text-amber-950">Python Master</h4>
                  <p className="text-[10px] text-amber-800">Passed 5 Python Assessments</p>
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-xs text-blue-950">AI Scholar</h4>
                  <p className="text-[10px] text-blue-800">20+ AI Tutor Conversations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-serif font-bold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-950 text-white font-serif font-bold text-xs transition-colors shadow-md"
          >
            Close Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
}
