import React from 'react';

export default function Logo({ 
  size = 'md', 
  className = '', 
  showSubtitle = false, 
  theme = 'dark', 
  variant, 
  textColor 
}) {
  const isLight = theme === 'light' || variant === 'light';
  const gradId = isLight ? 'brand-grad-light' : 'brand-grad-dark';

  const sizeClasses = {
    sm: { icon: 'w-6 h-6', title: 'text-xl', gap: 'space-x-1.5' },
    md: { icon: 'w-8 h-8', title: 'text-2xl', gap: 'space-x-2' },
    lg: { icon: 'w-10 h-10', title: 'text-3xl', gap: 'space-x-2.5' },
    xl: { icon: 'w-14 h-14', title: 'text-5xl', gap: 'space-x-3' }
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  const brandTitleColor = textColor || (isLight ? 'text-slate-900' : 'text-slate-100 print:text-slate-900');
  const aiGradient = isLight 
    ? 'from-sky-600 to-indigo-600' 
    : 'from-sky-400 to-indigo-500';

  return (
    <div className={`flex items-center ${currentSize.gap} cursor-pointer group ${className} select-none`}>
      {/* Brand Icon - Clean & Geometric */}
      <div className={`relative ${currentSize.icon} shrink-0 transition-transform duration-300 group-hover:scale-105 group-active:scale-95`}>
        <svg viewBox="0 0 32 32" fill="none" className={`w-full h-full ${isLight ? 'drop-shadow-sm' : 'drop-shadow-md'}`}>
          {/* Main 'C' Shape */}
          <path 
            d="M 23 9 A 10 10 0 1 0 23 23" 
            stroke={`url(#${gradId})`} 
            strokeWidth="5.5" 
            strokeLinecap="round" 
          />
          {/* AI Node Dot */}
          <circle 
            cx="21" 
            cy="16" 
            r="3.5" 
            fill={isLight ? '#0284C7' : '#38BDF8'} 
          />
          <defs>
            <linearGradient id={gradId} x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor={isLight ? '#0284C7' : '#38BDF8'} />
              <stop offset="1" stopColor={isLight ? '#4338CA' : '#4F46E5'} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Typography - Modern SaaS Style */}
      <div className="flex flex-col justify-center">
        <span className={`font-display font-bold tracking-tight ${brandTitleColor} leading-none ${currentSize.title}`}>
          Cours<span className={`text-transparent bg-clip-text bg-gradient-to-br ${aiGradient}`}>ai</span>
        </span>
        {showSubtitle && (
          <span className={`text-[10px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-500'} tracking-[0.15em] uppercase mt-0.5 ml-0.5`}>
            Education
          </span>
        )}
      </div>
    </div>
  );
}
