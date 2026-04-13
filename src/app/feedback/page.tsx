'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Swords,
  Package,
  Store,
  Star,
  Send,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  History,
} from 'lucide-react';

const categoryDefs = [
  { value: 'BUG_REPORT', labelKey: 'categories.bugReport', icon: Bug, color: 'red', descKey: 'categoryDescriptions.bugReport' },
  { value: 'FEATURE_REQUEST', labelKey: 'categories.featureRequest', icon: Lightbulb, color: 'amber', descKey: 'categoryDescriptions.featureRequest' },
  { value: 'GENERAL', labelKey: 'categories.general', icon: MessageSquare, color: 'blue', descKey: 'categoryDescriptions.general' },
  { value: 'BATTLE_ISSUE', labelKey: 'categories.battleIssue', icon: Swords, color: 'purple', descKey: 'categoryDescriptions.battleIssue' },
  { value: 'PACK_ISSUE', labelKey: 'categories.packIssue', icon: Package, color: 'green', descKey: 'categoryDescriptions.packIssue' },
  { value: 'SHOP_ISSUE', labelKey: 'categories.shopIssue', icon: Store, color: 'orange', descKey: 'categoryDescriptions.shopIssue' },
] as const;

const colorMap: Record<string, { bg: string; border: string; text: string; activeBg: string; activeBorder: string; glow: string; activeInline: { backgroundColor: string; borderColor: string } }> = {
  red: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-red-400', activeBg: 'bg-red-500/15', activeBorder: 'border-red-500/40', glow: 'shadow-red-500/20', activeInline: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' } },
  amber: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-amber-400', activeBg: 'bg-amber-500/15', activeBorder: 'border-amber-500/40', glow: 'shadow-amber-500/20', activeInline: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)' } },
  blue: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-[#C84FFF]', activeBg: 'bg-[rgba(200,79,255,0.1)]', activeBorder: 'border-[rgba(200,79,255,0.3)]/40', glow: 'shadow-[0_0_24px_rgba(200,79,255,0.3)]', activeInline: { backgroundColor: 'rgba(200,79,255,0.1)', borderColor: 'rgba(200,79,255,0.4)' } },
  purple: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-purple-400', activeBg: 'bg-purple-500/15', activeBorder: 'border-purple-500/40', glow: 'shadow-purple-500/20', activeInline: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.4)' } },
  green: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-[#E879F9]', activeBg: 'bg-[#C84FFF]/15', activeBorder: 'border-[#C84FFF]/40', glow: 'shadow-[#C84FFF]/20', activeInline: { backgroundColor: 'rgba(200,79,255,0.15)', borderColor: 'rgba(200,79,255,0.4)' } },
  orange: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-orange-400', activeBg: 'bg-orange-500/15', activeBorder: 'border-orange-500/40', glow: 'shadow-orange-500/20', activeInline: { backgroundColor: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.4)' } },
};

const experienceLabelKeys = ['', 'experience.terrible', 'experience.poor', 'experience.okay', 'experience.good', 'experience.excellent'] as const;

const categoryExperienceQuestionKeys: Record<string, string> = {
  BUG_REPORT: 'experienceQuestions.bugReport',
  FEATURE_REQUEST: 'experienceQuestions.featureRequest',
  GENERAL: 'experienceQuestions.general',
  BATTLE_ISSUE: 'experienceQuestions.battleIssue',
  PACK_ISSUE: 'experienceQuestions.packIssue',
  SHOP_ISSUE: 'experienceQuestions.shopIssue',
};

export default function FeedbackPage() {
  const t = useTranslations('feedback');
  const { data: session, status: sessionStatus } = useSession();
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState(0);
  const [hoverExperience, setHoverExperience] = useState(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const maxMessage = 5000;
  const maxSubject = 200;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!category) {
      setError(t('validation.selectCategory'));
      return;
    }
    if (!subject.trim()) {
      setError(t('validation.enterSubject'));
      return;
    }
    if (!message.trim()) {
      setError(t('validation.describeFeedback'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          experience: experience || undefined,
          subject: subject.trim(),
          message: message.trim(),
          email: email.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || t('validation.failedToSubmit'));
        return;
      }

      setSubmitted(true);
    } catch {
      setError(t('validation.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCategory('');
    setExperience(0);
    setSubject('');
    setMessage('');
    setEmail('');
    setError('');
    setSubmitted(false);
  };

  const activeExperience = hoverExperience || experience;
  const selectedCat = categoryDefs.find((c) => c.value === category);

  return (
    <div className="min-h-screen font-display">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />
      <div className="fixed top-20 left-10 w-72 h-72 bg-[rgba(200,79,255,0.04)] rounded-full blur-3xl hidden lg:block pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-[rgba(200,79,255,0.03)] rounded-full blur-3xl hidden lg:block pointer-events-none" />

      <div className="relative container max-w-2xl pt-8 sm:pt-12 pb-20 px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#f0f0f5] transition-colors font-medium touch-target"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToHome')}
          </Link>
          {sessionStatus === 'authenticated' && (
            <Link
              href="/feedback/history"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#f0f0f5] transition-colors font-medium touch-target"
            >
              <History className="w-4 h-4" />
              {t('myFeedback')}
            </Link>
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full border border-[rgba(200,79,255,0.3)]/20 bg-[rgba(200,79,255,0.03)]">
            <Sparkles className="w-3.5 h-3.5 text-[#C84FFF]" />
            <span className="text-xs text-[#C84FFF] font-semibold uppercase tracking-wide">{t('badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-gray-500 max-w-md mx-auto" style={{ textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>
            {t('subtitle')}
          </p>
        </div>

        {submitted ? (
          /* ============================================ */
          /* SUCCESS STATE */
          /* ============================================ */
          <div className="rounded-2xl border border-white/[0.06] bg-[#1e1e55] p-8 sm:p-12 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 2rem 2rem 2rem' }}>
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-[#C84FFF]/15 border border-[#C84FFF]/20" style={{ marginBottom: '1.5rem' }}>
              <CheckCircle2 className="w-10 h-10 text-[#E879F9]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3" style={{ marginBottom: '0.75rem' }}>{t('thankYou')}</h2>
            <p className="text-[#8888aa] mb-8 max-w-sm" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {category === 'BUG_REPORT'
                ? t('validation.thanksBugReport')
                : category === 'FEATURE_REQUEST'
                ? t('validation.thanksFeatureRequest')
                : t('validation.thanksFeedback')}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3" style={{ justifyContent: 'center', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white border border-white/[0.1] bg-[#1a1a4a] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-200 active:scale-[0.98] touch-target"
              >
                <MessageSquare className="w-4 h-4" />
                {t('sendMore')}
              </button>
              {session && (
                <Link
                  href="/feedback/history"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-[#E879F9] border border-[#C84FFF]/20 bg-[#C84FFF]/5 hover:bg-[#C84FFF]/10 hover:border-[#C84FFF]/30 transition-all duration-200 active:scale-[0.98] touch-target"
                >
                  {t('viewMyFeedback')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C84FFF] hover:bg-[#E879F9] text-white font-semibold text-sm rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[0_0_24px_rgba(200,79,255,0.3)] active:scale-[0.98] touch-target"
              >
                {t('backToHome')}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* ============================================ */
          /* FEEDBACK FORM */
          /* ============================================ */
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/[0.07] border border-red-500/15 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* ---- Category Selection ---- */}
            <div>
              <label className="block text-sm font-semibold text-white mb-1 ml-1">
                {t('category')} <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-4 ml-1">{t('categoryQuestion')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categoryDefs.map((cat) => {
                  const isSelected = category === cat.value;
                  const colors = colorMap[cat.color];
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      style={isSelected ? { backgroundColor: colors.activeInline.backgroundColor, borderWidth: '1px', borderStyle: 'solid', borderColor: colors.activeInline.borderColor } : { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.1)' }}
                      className={`relative flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200 active:scale-[0.97] touch-target ${
                        isSelected
                          ? `${colors.activeBg} ${colors.activeBorder}`
                          : `${colors.bg} ${colors.border} hover:${colors.activeBg} hover:border-white/[0.12]`
                      }`}
                    >
                      <cat.icon className={`w-5 h-5 ${colors.text}`} />
                      <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#f0f0f5]'}`}>
                        {t(cat.labelKey)}
                      </span>
                      <span className="text-[10px] text-gray-500 leading-tight text-center hidden sm:block">
                        {t(cat.descKey)}
                      </span>
                      {isSelected && (
                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ---- Category-Based Experience Rating ---- */}
            {category && (
              <div>
                <label className="block text-sm font-semibold text-white mb-1 ml-1">
                  {selectedCat ? t(selectedCat.labelKey) : ''} {t('experienceLabel')}
                </label>
                <p className="text-xs text-gray-500 mb-3 ml-1">
                  {categoryExperienceQuestionKeys[category] ? t(categoryExperienceQuestionKeys[category]) : t('rateExperience')} ({t('optional')})
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setExperience(star === experience ? 0 : star)}
                        onMouseEnter={() => setHoverExperience(star)}
                        onMouseLeave={() => setHoverExperience(0)}
                        className="relative p-1 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95 touch-target"
                      >
                        <Star
                          className={`w-7 h-7 transition-all duration-150 ${
                            star <= activeExperience
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                              : 'text-gray-700 hover:text-gray-500'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {activeExperience > 0 && (
                    <span className="text-sm text-amber-400 font-medium ml-2 animate-in fade-in">
                      {t(experienceLabelKeys[activeExperience])}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ---- Subject ---- */}
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-sm font-semibold text-white">
                  {t('subject')} <span className="text-red-400">*</span>
                </label>
                <span className={`text-[11px] font-medium tabular-nums ${
                  subject.length > maxSubject * 0.9 ? 'text-red-400' : 'text-gray-600'
                }`}>
                  {subject.length}/{maxSubject}
                </span>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, maxSubject))}
                className="w-full h-11 px-4 rounded-xl bg-white/4 border border-white/8 text-sm text-white placeholder-gray-600 focus:border-[rgba(200,79,255,0.3)] focus:ring-1 focus:ring-[rgba(200,79,255,0.2)] focus:bg-white/6 outline-none transition-all"
                placeholder={t('subjectPlaceholder')}
              />
            </div>

            {/* ---- Message ---- */}
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-sm font-semibold text-white">
                  {t('description')} <span className="text-red-400">*</span>
                </label>
                <span className={`text-[11px] font-medium tabular-nums ${
                  message.length > maxMessage * 0.9 ? 'text-red-400' : 'text-gray-600'
                }`}>
                  {message.length}/{maxMessage}
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, maxMessage))}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/4 border border-white/8 text-sm text-white placeholder-gray-600 focus:border-[rgba(200,79,255,0.3)] focus:ring-1 focus:ring-[rgba(200,79,255,0.2)] focus:bg-white/6 outline-none transition-all resize-y min-h-[120px]"
                placeholder={
                  category === 'BUG_REPORT'
                    ? t('validation.bugPlaceholder')
                    : category === 'FEATURE_REQUEST'
                    ? t('validation.featurePlaceholder')
                    : t('validation.generalPlaceholder')
                }
              />
            </div>

            {/* ---- Email (if not logged in) ---- */}
            {!session && (
              <div>
                <label className="block text-sm font-semibold text-white mb-1 ml-1">
                  {t('emailOptional')} <span className="text-gray-600 font-normal text-xs">({t('optional')})</span>
                </label>
                <p className="text-xs text-gray-500 mb-2 ml-1">{t('emailHelper')}</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/4 border border-white/8 text-sm text-white placeholder-gray-600 focus:border-[rgba(200,79,255,0.3)] focus:ring-1 focus:ring-[rgba(200,79,255,0.2)] focus:bg-white/6 outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            )}

            {/* Logged-in user info */}
            {session && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a1a4a] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-full bg-[rgba(200,79,255,0.1)] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#C84FFF]">
                    {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#f0f0f5] truncate">
                    {t('submittingAs')} <span className="font-semibold text-white">{session.user.name || session.user.email}</span>
                  </p>
                </div>
              </div>
            )}

            {/* ---- Submit ---- */}
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={loading || !category || !subject.trim() || !message.trim()}
              style={{ background: 'linear-gradient(to right, #2563eb, #3b82f6)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(59,130,246,0.3)' }}
              className="h-9 px-8 bg-[#C84FFF] hover:bg-[#E879F9] text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[0_0_24px_rgba(200,79,255,0.3)] hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] touch-target border border-[rgba(200,79,255,0.3)]/30"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4.5 h-4.5" />
                  {t('submitFeedback')}
                </>
              )}
            </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
