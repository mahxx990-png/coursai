import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Share2, Check, X, ShieldCheck, Printer, ExternalLink } from 'lucide-react';
import Logo from './Logo';

export default function CertificateModal({ certificate, studentName, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const certData = certificate || {
    title: 'Python Programming: Complete Beginner Fundamentals',
    instructor: 'Corey Schafer',
    issuedDate: 'July 22, 2026',
    grade: '95%',
    code: 'CRS-PY-884912-2026'
  };

  const nameToDisplay = studentName || 'Sami Al-Otaibi';

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Coursai Academic Certificate - ${nameToDisplay}`,
          text: `Verified Certificate of Completion for ${certData.title} on Coursai.`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col font-sans print:shadow-none print:border-none print:max-w-none print:rounded-none"
      >
        {/* Action Header Bar (Hidden in Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif font-bold text-base tracking-wide">
              Official Verified Academic Certificate
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleShare}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-serif font-bold text-xs border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-serif font-bold text-xs transition-colors shadow-md border border-blue-500"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL DIPLOMA CERTIFICATE BOARD (Printable Document) */}
        {/* ========================================================================= */}
        <div className="p-8 sm:p-12 bg-amber-50/30 text-slate-900 relative border-8 border-double border-blue-900/40 print:p-12 print:border-8 print:border-slate-900">
          
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-600 pointer-events-none" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-600 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-600 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-600 pointer-events-none" />

          {/* Background Watermark Crest */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Award className="w-[450px] h-[450px] text-blue-950" />
          </div>

          <div className="relative z-10 text-center space-y-6">
            
            {/* Header Identity */}
            <div className="flex justify-center mb-2">
              <Logo size="lg" theme="light" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-serif font-bold tracking-[0.25em] text-blue-900 uppercase block">
                COURSAI ACADEMIC ACADEMY OF COMPUTER SCIENCE
              </span>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-widest text-slate-900 uppercase border-b border-amber-500/30 pb-2 inline-block px-8">
                CERTIFICATE OF ACADEMIC ACHIEVEMENT
              </h1>
            </div>

            <p className="text-xs font-serif text-slate-600 tracking-wider uppercase font-semibold">
              THIS OFFICIAL DIPLOMA IS PROUDLY PRESENTED TO
            </p>

            {/* Student Name */}
            <div className="py-2">
              <h2 className="font-serif font-bold text-3xl sm:text-4xl text-blue-950 italic border-b-2 border-slate-900 inline-block px-12 pb-1">
                {nameToDisplay}
              </h2>
            </div>

            <p className="text-xs sm:text-sm font-serif text-slate-700 max-w-xl mx-auto leading-relaxed">
              for successfully completing the rigorous academic course track, transcript-grounded lectures, and passing the graded final comprehensive examination for:
            </p>

            {/* Course Title */}
            <div className="p-4 bg-white/80 rounded-xl border border-blue-900/20 max-w-2xl mx-auto shadow-sm">
              <h3 className="font-serif font-bold text-lg sm:text-xl text-blue-900">
                {certData.title}
              </h3>
              <p className="text-xs font-serif text-slate-600 mt-0.5">
                Lead Instructor: <span className="font-bold text-slate-900">{certData.instructor}</span>
              </p>
            </div>

            {/* Distinction & Grade Badge */}
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-600/30 text-emerald-900 text-xs font-serif font-bold tracking-widest uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                PASSED WITH DISTINCTION • FINAL SCORE: {certData.grade}
              </span>
            </div>

            {/* Certificate Signatures & Verification Seal */}
            <div className="pt-8 grid grid-cols-3 items-end gap-4 max-w-2xl mx-auto text-center font-serif text-xs border-t border-slate-300">
              <div className="space-y-1">
                <div className="font-serif italic font-bold text-base text-slate-800 font-serif">
                  {certData.instructor}
                </div>
                <div className="w-32 h-px bg-slate-400 mx-auto" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Course Instructor</span>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border-2 border-amber-600/40 flex items-center justify-center text-amber-800 shadow-inner mb-1">
                  <Award className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{certData.code}</span>
              </div>

              <div className="space-y-1">
                <div className="font-serif font-bold text-sm text-blue-900">
                  {certData.issuedDate}
                </div>
                <div className="w-32 h-px bg-slate-400 mx-auto" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Date of Issuance</span>
              </div>
            </div>

          </div>
        </div>

      </motion.div>
    </div>
  );
}
