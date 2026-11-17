import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import HomePage from './components/HomePage';
import WatchRoom from './components/WatchRoom';
import ProfilePage from './components/ProfilePage';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import FYPFeed from './components/FYPFeed';
import LibraryPage from './components/LibraryPage';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Default logged in admin user state
  const [user, setUser] = useState({
    name: 'Sami Al-Otaibi',
    email: 'admin@coursai.edu',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    enrolledCoursesCount: 4,
    completedQuizzesCount: 12,
    totalXP: 1850,
    joinedDate: 'July 2026'
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: "easeIn" } }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-200 overflow-hidden relative selection:bg-primary-light/30">
      {/* Background ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-DEFAULT/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
              <HomePage
                user={user}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            </motion.div>
          } />

          <Route path="/fyp" element={<FYPFeed />} />

          <Route path="/library" element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
              <LibraryPage
                user={user}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            </motion.div>
          } />

          <Route path="/watch/:videoId" element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
              <WatchRoom
                user={user}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            </motion.div>
          } />

          <Route path="/profile" element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
              <ProfilePage
                user={user}
                onLogout={() => {
                  setUser(null);
                  navigate('/');
                }}
              />
            </motion.div>
          } />

          <Route path="/admin" element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
              <AdminDashboard
                onCourseAdded={() => {
                  // Callback when a new course is published by admin
                }}
              />
            </motion.div>
          } />
        </Routes>
      </AnimatePresence>

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(userData) => setUser({ ...userData, role: 'admin' })}
      />
    </div>
  );
}
