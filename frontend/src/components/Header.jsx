import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';
import Logo from './Logo';

export default function Header({ leftContent, rightContent, centerContent }) {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [xp, setXp] = useState(parseInt(localStorage.getItem('coursai_xp') || '0', 10));
  const [streak, setStreak] = useState(parseInt(localStorage.getItem('coursai_streak') || '1', 10));

  useEffect(() => {
    const handleStorageChange = () => {
      setXp(parseInt(localStorage.getItem('coursai_xp') || '0', 10));
      setStreak(parseInt(localStorage.getItem('coursai_streak') || '1', 10));
    };
    
    // Listen to custom event for immediate update in the same tab
    window.addEventListener('coursai_xp_update', handleStorageChange);
    return () => {
      window.removeEventListener('coursai_xp_update', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 20);
    });
  }, [scrollY]);

  // Dynamic animations based on scroll
  const headerY = useTransform(scrollY, [0, 50], [0, 10]);
  const headerWidth = useTransform(scrollY, [0, 50], ['100%', '95%']);

  return (
    <motion.div 
      style={{ y: headerY }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 sm:pt-6 pointer-events-none transition-all duration-300"
    >
      <motion.header
        style={{ width: headerWidth }}
        animate={{
          backgroundColor: isScrolled ? 'rgba(11, 15, 25, 0.7)' : 'rgba(11, 15, 25, 0.2)',
          backdropFilter: isScrolled ? 'blur(24px)' : 'blur(12px)',
          borderColor: isScrolled ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          boxShadow: isScrolled 
            ? '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(56, 189, 248, 0.1)' 
            : '0 4px 20px rgba(0,0,0,0.2)',
        }}
        transition={{ duration: 0.3 }}
        className="pointer-events-auto max-w-7xl mx-auto rounded-full border px-5 py-3 md:px-6 md:py-3.5 flex items-center justify-between gap-4"
      >
        <div className="flex items-center space-x-4 md:space-x-6 min-w-0">
          <Logo size="sm" />
          {leftContent && (
            <>
              <div className="hidden sm:block h-6 w-px bg-white/10" />
              <div className="hidden sm:flex items-center gap-3">
                {leftContent}
              </div>
            </>
          )}
        </div>

        {centerContent && (
          <div className="hidden lg:flex items-center justify-center flex-1 mx-4">
            {centerContent}
          </div>
        )}

        <div className="flex items-center space-x-3 shrink-0">
          {/* Gamification Badges */}
          <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 space-x-3">
            <div className="flex items-center gap-1.5 text-orange-400 font-display font-bold text-sm" title="Day Streak">
              <Flame className="w-4 h-4 fill-orange-400" />
              <span>{streak}</span>
            </div>
            <div className="w-px h-4 bg-white/20"></div>
            <div className="flex items-center gap-1.5 text-yellow-400 font-display font-bold text-sm" title="Experience Points">
              <Zap className="w-4 h-4 fill-yellow-400" />
              <span>{xp}</span>
            </div>
          </div>
          {rightContent}
        </div>
      </motion.header>
    </motion.div>
  );
}
