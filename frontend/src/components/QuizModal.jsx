import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Award, HelpCircle, X, ArrowRight, RotateCcw } from 'lucide-react';

export default function QuizModal({ quiz, onClose, onNextLesson }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!quiz) return null;

  const handleSelectOption = (questionId, optionIndex) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correct_index) {
        correct += 1;
      }
    });
    return {
      score: correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100)
    };
  };

  const scoreResult = isSubmitted ? calculateScore() : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-2xl glass-panel-heavy rounded-3xl border border-white/10 shadow-glow-strong overflow-hidden flex flex-col max-h-[85vh] relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-5 bg-dark-900/80 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow text-white">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="font-display font-bold text-xl text-white tracking-wide">
                  {quiz.title}
                </h2>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-display font-bold tracking-widest uppercase border ${
                  quiz.is_graded 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {quiz.is_graded ? 'Graded Final Exam' : 'Practice Checkpoint'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                {quiz.is_graded 
                  ? 'Official graded assessment. Passing score: 70%.' 
                  : 'Self-assessment for practice. No grades recorded.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiz Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 font-sans relative z-10 scrollbar-hide">
          <AnimatePresence>
            {isSubmitted && scoreResult && (
              <motion.div
                initial={{ opacity: 0, height: 0, mb: 0 }}
                animate={{ opacity: 1, height: 'auto', mb: 24 }}
                className={`p-5 rounded-2xl border backdrop-blur-md ${
                  quiz.is_graded
                    ? (scoreResult.percentage >= 70
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-glow'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400')
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg mb-1 text-white">
                      {quiz.is_graded
                        ? `Final Exam Result: ${scoreResult.percentage}%`
                        : `Practice Completed (${scoreResult.score}/${scoreResult.total} Correct)`}
                    </h3>
                    <p className="text-sm opacity-90 text-slate-300 font-sans">
                      {quiz.is_graded
                        ? `You answered ${scoreResult.score} out of ${scoreResult.total} questions correctly.`
                        : `Great job practicing! Review the explanations below.`}
                    </p>
                  </div>
                  {quiz.is_graded && (
                    <div className={`text-3xl font-display font-bold ${scoreResult.percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {scoreResult.percentage >= 70 ? 'PASSED' : 'REVIEW'}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {quiz.questions.map((q, qIndex) => {
            const selectedOpt = selectedAnswers[q.id];
            const isCorrect = selectedOpt === q.correct_index;

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-dark-900/50 border border-white/10 shadow-inner space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-display font-medium text-base text-white leading-relaxed">
                    <span className="text-primary-light font-bold mr-2">{qIndex + 1}.</span>
                    {q.question}
                  </h4>
                  {isSubmitted && (
                    isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )
                  )}
                </div>

                <div className="space-y-2.5 pt-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    let optionStyle = 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300';

                    if (isSubmitted) {
                      if (optIdx === q.correct_index) {
                        optionStyle = 'border-emerald-500/50 bg-emerald-500/20 text-emerald-100 font-medium shadow-glow';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'border-rose-500/50 bg-rose-500/20 text-rose-200';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-primary-DEFAULT bg-primary-DEFAULT/20 text-white font-medium ring-1 ring-primary-DEFAULT/50 shadow-glow';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between group ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        <span className={`font-display text-[10px] uppercase font-bold tracking-wider ${isSelected && !isSubmitted ? 'text-primary-light' : 'text-slate-500 group-hover:text-slate-400'}`}>
                          Option {String.fromCharCode(65 + optIdx)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {isSubmitted && q.explanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-4 rounded-xl bg-dark-950/50 border border-white/5 text-sm text-slate-300 font-sans leading-relaxed flex gap-3"
                    >
                      <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-display font-semibold text-indigo-400 block mb-1 uppercase tracking-widest text-[10px]">Explanation</span>
                        {q.explanation}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 bg-dark-950/80 border-t border-white/10 flex items-center justify-between relative z-10 backdrop-blur-md">
          {!isSubmitted ? (
            <button
              onClick={() => setIsSubmitted(true)}
              disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
              className="w-full py-3.5 rounded-xl bg-primary-DEFAULT hover:bg-primary-hover text-white transition-all font-display font-bold text-sm shadow-glow disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
            >
              <span>Submit Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex flex-wrap gap-3 w-full">
              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setIsSubmitted(false);
                }}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-display font-medium text-sm transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-display font-medium text-sm border border-white/10 transition-all"
              >
                Close
              </button>

              {onNextLesson && (
                <button
                  onClick={onNextLesson}
                  className="flex-[2] py-3 rounded-xl bg-primary-DEFAULT hover:bg-primary-hover text-white font-display font-bold text-sm transition-all shadow-glow flex items-center justify-center gap-2 border border-primary-light/20 group"
                >
                  <span>Next Lesson</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
