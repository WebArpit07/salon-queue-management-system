import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bell,
  Users,
  Sparkles,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import socket from '../lib/socket';
import { playTurnChime } from '../lib/soundAlert';
import LanguageToggle from '../components/ui/LanguageToggle';
import { fadeInUp, springSnappy, springSmooth } from '../lib/motion';

export const DisplayTvPage = () => {
  const { t, isGujarati } = useLanguage();
  const { barbers = [], called = [], inChair = [], upNextTop5 = [], queueState } = useQueue();

  const [currentDateTime, setCurrentDateTime] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightedCall, setHighlightedCall] = useState(null);

  // 1. Live auto-ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = new Intl.DateTimeFormat(isGujarati ? 'gu-IN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(now);

      const timePart = new Intl.DateTimeFormat(isGujarati ? 'gu-IN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);

      setCurrentDateTime(`${datePart} | ${timePart}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isGujarati]);

  // 2. Real-time 'ticket:called' listener with 6-second gold flash & chime
  useEffect(() => {
    const handleTicketCalled = (event) => {
      if (event && event.token) {
        setHighlightedCall(event);

        if (isSoundEnabled) {
          playTurnChime();
        }

        // Auto-clear callout highlight after 6 seconds
        const timeout = setTimeout(() => {
          setHighlightedCall(null);
        }, 6000);

        return () => clearTimeout(timeout);
      }
    };

    socket.on('ticket:called', handleTicketCalled);
    return () => {
      socket.off('ticket:called', handleTicketCalled);
    };
  }, [isSoundEnabled]);

  // 3. Toggle Sound & unlock Web Audio context
  const handleToggleSound = () => {
    const nextState = !isSoundEnabled;
    setIsSoundEnabled(nextState);
    if (nextState) {
      playTurnChime(); // Primes the Web Audio API on explicit gesture
    }
  };

  // 4. Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Combine active chair tickets (called + in_chair)
  const activeTickets = [...called, ...inChair];

  // Primary featured active cut (most recently called or active)
  const primaryFeaturedTicket =
    called[0] || inChair[0] || null;

  return (
    <div className="min-h-screen w-full bg-[#0A0D0C] text-slate-100 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative overflow-hidden select-none">
      {/* Ambient Sage/Champagne Wave Glow along bottom edge */}
      <div className="absolute -bottom-24 inset-x-0 h-72 bg-gradient-to-t from-emerald-950/20 via-gold-950/15 to-transparent blur-[130px] pointer-events-none -z-10" />

      {/* Floating Top-Center Gold Flash Callout Banner (when a ticket is called) */}
      <AnimatePresence>
        {highlightedCall && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={springSnappy}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-3xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 text-obsidian-950 font-black text-xl sm:text-2xl shadow-glow-gold flex items-center gap-3 border-2 border-white/50"
          >
            <motion.div
              animate={{ rotate: [0, -18, 18, -12, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              <Bell className="w-7 h-7 fill-obsidian-950" />
            </motion.div>
            <span>
              {isGujarati ? '🔔 હવે ' : '🔔 Now Calling '}
              <span className="font-mono underline">{highlightedCall.token}</span>
              {isGujarati
                ? ` નો વારો છે · ${highlightedCall.barberName} પાસે જાઓ`
                : ` · Go to ${highlightedCall.barberName}`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------
          1. TOP TV HEADER BAR
      ---------------------------------------------------- */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        {/* Left: Brand Identity & LIVE Indicator */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-950 shadow-glow-gold">
            <Scissors className="w-6 h-6 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-white">
                Studio Kashi Salon
              </span>
              <span className="hidden sm:inline font-serif text-xl text-gold-400/80 italic">
                · {isGujarati ? 'લાઇવ ડિસ્પ્લે' : 'Lounge Display'}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-slow shadow-glow-emerald" />
              <span className="text-[11px] font-bold font-mono tracking-widest text-emerald-400 uppercase">
                {t('tvDisplay.live')}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Time, Language Toggle, Sound Toggle & Fullscreen */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Live Date & Time Stamp */}
          <div className="px-4 py-2 rounded-2xl glass-pill border border-white/10 flex items-center space-x-2 text-sm font-mono text-slate-300">
            <Clock className="w-4 h-4 text-gold-400" />
            <span>{currentDateTime}</span>
          </div>

          {/* Language Toggle */}
          <LanguageToggle className="!scale-95 !bg-white/5 !border-white/10" />

          {/* Sound On / Mute Button */}
          <button
            type="button"
            onClick={handleToggleSound}
            title={isSoundEnabled ? t('tvDisplay.soundOn') : t('tvDisplay.soundMuted')}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isSoundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'glass-pill border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">
              {isSoundEnabled ? t('tvDisplay.soundOn') : t('tvDisplay.soundMuted')}
            </span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={t('tvDisplay.fullscreen')}
            className="w-10 h-10 rounded-2xl glass-pill border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ----------------------------------------------------
          2. MAIN TWIN SPLIT PANELS (Matching Reference Bottom-Third)
          Left: Now Serving (7 cols) | Right: Up Next (5 cols)
      ---------------------------------------------------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 flex-1 items-stretch">
        {/* ====================================================
            LEFT PANEL (Col 7): NOW SERVING (Active Chairs)
        ==================================================== */}
        <div className="lg:col-span-7 flex flex-col justify-between p-7 sm:p-9 rounded-3xl glass-card border border-white/10 bg-gradient-to-b from-white/[0.05] via-obsidian-900/80 to-obsidian-950/95 shadow-glass-subtle space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-gold-400" />
                <span>{t('tvDisplay.nowServing')}</span>
              </h2>
              <span className="text-xs text-slate-400 font-light">
                {isGujarati ? 'કાર્યરત ખુરશીઓ અને બોલાવેલા ગ્રાહકો' : 'Active Stations & Guests'}
              </span>
            </div>

            <span className="px-3 py-1 rounded-full glass-pill border border-white/10 font-mono text-xs text-gold-300">
              {barbers.length} {isGujarati ? 'ખુરશીઓ' : 'Stations'}
            </span>
          </div>

          {/* Primary Featured Showcase (Matching Giant Reference S-12 / with Ravi) */}
          {primaryFeaturedTicket ? (
            <motion.div
              layout
              key={primaryFeaturedTicket._id}
              className={`p-6 sm:p-8 rounded-3xl border transition-all text-center space-y-3 ${
                highlightedCall?.token === primaryFeaturedTicket.token
                  ? 'bg-gradient-to-b from-gold-500/25 via-obsidian-900 to-obsidian-950 border-gold-400 shadow-glow-gold'
                  : 'bg-black/50 border-white/10'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    primaryFeaturedTicket.status === 'called'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-emerald-400 shadow-glow-emerald'
                  }`}
                />
                <span className="text-xs uppercase font-bold tracking-widest text-gold-400 font-mono">
                  {primaryFeaturedTicket.status === 'called'
                    ? t('tvDisplay.calledBadge')
                    : t('tvDisplay.inChairBadge')}
                </span>
              </div>

              {/* Giant 7xl Token Numerals */}
              <div className="text-6xl sm:text-7xl lg:text-8xl font-mono font-black text-white tracking-tight drop-shadow-lg">
                {primaryFeaturedTicket.token}
              </div>

              {/* Subtitle: with [Barber] + Customer Name */}
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-serif text-gold-300 font-bold">
                  {t('tvDisplay.with')}{' '}
                  <span className="underline decoration-gold-500/50">
                    {primaryFeaturedTicket.assignedBarber?.toUpperCase() || 'BARBER'}
                  </span>
                </p>
                <p className="text-sm sm:text-base text-slate-300 font-light">
                  {primaryFeaturedTicket.customerName}
                </p>
              </div>
            </motion.div>
          ) : (
            /* Empty State when no chairs active */
            <div className="py-16 text-center space-y-3 bg-black/40 rounded-3xl border border-white/5">
              <Scissors className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">
                {isGujarati ? 'ખુરશીઓ તૈયાર છે' : 'Chairs Ready for Next Guests'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-light">
                {t('tvDisplay.noOneWaiting')}
              </p>
            </div>
          )}

          {/* Secondary Barber Chairs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
            {barbers.map((barber) => {
              const active =
                inChair.find((t) => t.assignedBarber === barber.slug) ||
                called.find((t) => t.assignedBarber === barber.slug);

              const isHighlighted = highlightedCall?.assignedBarber === barber.slug;

              return (
                <div
                  key={barber.slug}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isHighlighted
                      ? 'border-gold-400 bg-gold-500/20 shadow-glow-gold'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">
                      {barber.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        active
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : !barber.onDuty
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : barber.status === 'on_break'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {active
                        ? active.token
                        : !barber.onDuty
                        ? (isGujarati ? 'ઓફ ડ્યુટી' : 'Off duty')
                        : barber.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-1">
                    {active ? active.customerName : isGujarati ? barber.specialtyGu : barber.specialtyEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ====================================================
            RIGHT PANEL (Col 5): UP NEXT (Top 5 Waiting)
            Matching Reference Numbered List (1. S-13 ~ 10 min)
        ==================================================== */}
        <div className="lg:col-span-5 flex flex-col justify-between p-7 sm:p-9 rounded-3xl glass-card border border-white/10 bg-gradient-to-b from-white/[0.05] via-obsidian-900/80 to-obsidian-950/95 shadow-glass-subtle space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-5 h-5 text-gold-400" />
              <span>{t('tvDisplay.upNext')}</span>
            </h2>

            <span className="px-3 py-1 rounded-full glass-pill border border-white/10 font-mono text-xs text-gold-300">
              {upNextTop5.length} {isGujarati ? 'લાઇનમાં' : 'Queued'}
            </span>
          </div>

          {/* Numbered List of Upcoming Guests */}
          <div className="flex-1 space-y-3.5">
            {upNextTop5.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-gold-400/60 mx-auto" />
                <p className="text-base font-bold text-white">
                  {t('tvDisplay.noOneWaiting')}
                </p>
              </div>
            ) : (
              upNextTop5.map((item, idx) => (
                <motion.div
                  key={item._id}
                  variants={fadeInUp}
                  className="p-4 rounded-2xl glass-card border border-white/10 bg-white/[0.03] flex items-center justify-between text-sm shadow-sm"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    {/* Rank Number (1., 2., 3., 4., 5.) */}
                    <span className="font-mono text-base font-black text-gold-400 w-6 shrink-0">
                      {idx + 1}.
                    </span>

                    {/* Token Pill */}
                    <span className="font-mono text-lg font-bold text-white px-3 py-1 rounded-xl bg-black/60 border border-white/10 shrink-0">
                      {item.token}
                    </span>

                    {/* Customer & Preference Tag */}
                    <div className="min-w-0 truncate">
                      <p className="font-semibold text-white truncate text-sm">
                        {item.customerName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.preferredBarber === 'any'
                          ? isGujarati ? 'કોઈપણ વાળંદ' : 'Any Stylist'
                          : `${item.preferredBarber.toUpperCase()}`}
                      </p>
                    </div>
                  </div>

                  {/* Estimated Wait Pill */}
                  <span className="font-mono font-bold text-sm text-emerald-400 shrink-0 pl-3">
                    ~ {item.estimatedWaitMin || 0} {t('common.min')}
                  </span>
                </motion.div>
              ))
            )}
          </div>

          {/* Sub-note at bottom of Right Panel */}
          <div className="pt-3 border-t border-white/10 text-center text-xs text-slate-500 font-light">
            <span>
              {isGujarati
                ? 'કૃપા કરીને તમારો વારો આવે ત્યારે ખુરશી તરફ પધારો'
                : 'Please proceed to your station when called'}
            </span>
          </div>
        </div>
      </main>

      {/* ----------------------------------------------------
          3. BOTTOM TV FOOTER
          Matching Reference Editorial Tagline + Scissors Emblem
      ---------------------------------------------------- */}
      <footer className="text-center pt-4 border-t border-white/10 space-y-2 select-none">
        <p className="font-serif italic text-base sm:text-lg text-slate-300 font-light">
          {t('tvDisplay.thankYou')}
        </p>
        <div className="flex items-center justify-center space-x-3 text-gold-400/80">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-gold-400/60" />
          <Scissors className="w-4 h-4 transform -rotate-45" />
          <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-gold-400/60" />
        </div>
      </footer>
    </div>
  );
};

export default DisplayTvPage;
