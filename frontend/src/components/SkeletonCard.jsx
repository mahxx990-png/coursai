import React from 'react';
import { motion } from 'framer-motion';

export default function SkeletonCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-900 rounded-3xl border border-white/10 overflow-hidden shadow-glass flex flex-col h-[400px]"
    >
      {/* Thumbnail Skeleton */}
      <div className="w-full h-48 bg-white/5 animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>

      <div className="p-6 flex flex-col flex-1 gap-4">
        {/* Category & Badge Skeleton */}
        <div className="flex justify-between items-center">
          <div className="w-24 h-6 bg-white/5 rounded-full animate-pulse" />
          <div className="w-16 h-6 bg-white/5 rounded-full animate-pulse" />
        </div>

        {/* Title Skeleton */}
        <div className="space-y-2 mt-2">
          <div className="w-full h-6 bg-white/5 rounded-md animate-pulse" />
          <div className="w-2/3 h-6 bg-white/5 rounded-md animate-pulse" />
        </div>

        {/* Instructor Skeleton */}
        <div className="w-1/2 h-4 bg-white/5 rounded-md animate-pulse mt-auto" />
      </div>
    </motion.div>
  );
}
