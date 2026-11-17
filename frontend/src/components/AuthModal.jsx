import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Mail, Lock, User, ArrowRight, X, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !fullName)) {
      setError('Please fill in all required fields.');
      return;
    }

    const userData = {
      name: isSignUp ? fullName : email.split('@')[0].replace('.', ' ').toUpperCase(),
      email: email,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      enrolledCoursesCount: 3,
      completedQuizzesCount: 8,
      totalXP: 1250,
      joinedDate: 'July 2026'
    };

    onLoginSuccess(userData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-md glass-panel-heavy rounded-3xl border border-white/10 shadow-glow overflow-hidden flex flex-col font-sans relative"
          >
            {/* Background Glow inside modal */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-DEFAULT/20 rounded-full blur-[60px] pointer-events-none" />

            {/* Header Banner */}
            <div className="bg-dark-900/60 border-b border-white/5 p-6 md:p-8 relative z-10">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-DEFAULT to-indigo-600 flex items-center justify-center shadow-glow">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl text-white tracking-wide">COURSAI</h2>
                  <p className="text-[10px] text-primary-light font-display font-semibold uppercase tracking-widest">
                    Academic Environment
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-300 font-sans mt-2 leading-relaxed">
                {isSignUp
                  ? 'Create a student profile to save your course progress & quiz scores.'
                  : 'Sign in to access your interactive watch room & AI tutor history.'}
              </p>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 relative z-10 bg-dark-950/50">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-display font-medium text-center">
                  {error}
                </div>
              )}

              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-display font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      placeholder="Sami Al-Otaibi"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-dark-900/50 pl-11 pr-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT text-sm text-white placeholder:text-slate-600 font-sans transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-display font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    placeholder="student@coursai.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-dark-900/50 pl-11 pr-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT text-sm text-white placeholder:text-slate-600 font-sans transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-display font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-dark-900/50 pl-11 pr-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT text-sm text-white placeholder:text-slate-600 font-sans transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-primary-DEFAULT hover:bg-primary-hover text-white font-display font-bold text-sm transition-all shadow-glow flex items-center justify-center space-x-2 border border-primary-light/20 group"
                >
                  <span>{isSignUp ? 'Create Student Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-sm text-slate-400 hover:text-white transition-colors font-sans"
                >
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Create One"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
