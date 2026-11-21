import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Bell,
  Sparkles,
  Info,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import api from '../lib/api';
import socket from '../lib/socket';
import { playTurnChime } from '../lib/soundAlert';
import { fadeInUp, staggerContainer, springSnappy, springSmooth } from '../lib/motion';

export const MyStatusPage = () => {
  const { id } = useParams();
  const { t, isGujarati } = useLanguage();
  const { queueState } = useQueue();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [sessionTimer, setSessionTimer] = useState('00:00');

  const previousStatusRef = useRef(null);

  // 1. Fetch ticket status from API
  const fetchTicket = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/api/queue/ticket/${id}`);
      setTicket(res.data);
      setError(null);

      // Handle active ticket persistence
      if (['waiting', 'called', 'in_chair'].includes(res.data.status)) {
        try {
          localStorage.setItem(
            'salon_active_ticket',
            JSON.stringify({ ticketId: res.data._id, token: res.data.token })
          );
        } catch (e) {}
      } else {
        // Clear active ticket on terminal statuses
        try {
          localStorage.removeItem('salon_active_ticket');
        } catch (e) {}
      }
    } catch (err) {
      console.warn('[MyStatusPage] Error loading ticket:', err.message);
      setError(err.response?.status === 404 ? 'not_found' : 'server_error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // 2. Re-fetch when global queue updates
  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [queueState]);

  // 3. Direct Socket.IO listener for immediate 'ticket:called' alert
  useEffect(() => {
    const handleTicketCalled = (event) => {
      if (event && (event.ticketId === id || event.token === ticket?.token)) {
        playTurnChime();
        fetchTicket();
      }
    };

    socket.on('ticket:called', handleTicketCalled);

    return () => {
      socket.off('ticket:called', handleTicketCalled);
    };
  }, [id, ticket?.token]);

  // 4. Trigger chime if status transitions to 'called'
  useEffect(() => {
    if (ticket?.status) {
      if (previousStatusRef.current === 'waiting' && ticket.status === 'called') {
        playTurnChime();
      }
      previousStatusRef.current = ticket.status;
    }
  }, [ticket?.status]);

  // 5. In-Chair Live Session Timer
  useEffect(() => {
    let interval = null;
    if (ticket?.status === 'in_chair' && ticket?.startedAt) {
      const updateTimer = () => {
        const start = new Date(ticket.startedAt).getTime();
        const diffSec = Math.max(0, Math.floor((Date.now() - start) / 1000));
        const mm = String(Math.floor(diffSec / 60)).padStart(2, '0');
        const ss = String(diffSec % 60).padStart(2, '0');
        setSessionTimer(`${mm}:${ss}`);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ticket?.status, ticket?.startedAt]);

  // 6. Cancellation action
  const handleCancelTicket = async () => {
    setIsCancelling(true);
    try {
      const res = await api.post(`/api/queue/ticket/${id}/cancel`);
      setTicket(res.data.ticket);
      setIsCancelModalOpen(false);
      try {
        localStorage.removeItem('salon_active_ticket');
      } catch (e) {}
    } catch (err) {
      console.error('[MyStatusPage] Cancel failed:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  // Helper for localized ordinal position
  const getOrdinalPosition = (pos) => {
    if (!pos || pos <= 0) return t('tracker.ordinalNext');
    if (pos === 1) return t('tracker.ordinalNext');
    if (pos === 2) return t('tracker.ordinalSecond');
    if (pos === 3) return t('tracker.ordinalThird');
    return t('tracker.ordinalNth').replace('{pos}', pos);
  };

  // Helper for barber display name
  const getBarberName = () => {
    if (ticket?.assignedBarberInfo) return ticket.assignedBarberInfo.name;
    if (ticket?.preferredBarberInfo) return ticket.preferredBarberInfo.name;
    if (ticket?.preferredBarber && ticket.preferredBarber !== 'any') {
      return ticket.preferredBarber.charAt(0).toUpperCase() + ticket.preferredBarber.slice(1);
    }
    return isGujarati ? 'કોઈપણ વાળંદ' : 'Any Barber';
  };

  // ----------------------------------------------------
  // Loading & Error States
  // ----------------------------------------------------
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold-400" />
        <p className="text-sm text-slate-400 font-light">
          {isGujarati ? 'ટિકિટ લોડ થઈ રહી છે...' : 'Fetching your ticket details...'}
        </p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto py-12 px-6 text-center space-y-6 glass-card rounded-3xl border-slate-800"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <XCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">{t('tracker.ticketNotFound')}</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">{t('tracker.ticketNotFoundDesc')}</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('tracker.backToHome')}</span>
        </Link>
      </motion.div>
    );
  }

  const isWaiting = ticket.status === 'waiting';
  const isCalled = ticket.status === 'called';
  const isInChair = ticket.status === 'in_chair';
  const isDone = ticket.status === 'done';
  const isCancelled = ticket.status === 'cancelled';
  const isNoShow = ticket.status === 'no_show';
  const isTerminal = isDone || isCancelled || isNoShow;

  const currentPosition = ticket.position ?? 1;
  const waitMinutes = ticket.estimatedWaitMin ?? 0;

  // Circular ring math (SVG radius: 52, perimeter: 2 * PI * 52 ≈ 326.7)
  const ringRadius = 52;
  const circumference = 2 * Math.PI * ringRadius;
  // If waitMinutes is 0 or ticket called, show full complete circle
  const progressPercent = isCalled || isInChair ? 1 : Math.min(1, Math.max(0.1, (60 - waitMinutes) / 60));
  const strokeOffset = circumference * (1 - progressPercent);

  return (
    <motion.div
      variants={staggerContainer(0.06)}
      initial="hidden"
      animate="visible"
      className="max-w-md mx-auto space-y-6 pb-20 relative select-none"
    >
      {/* Soft Ambient Sage/Emerald Base Luminescence (per reference image) */}
      <div className="fixed -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />

      {/* Top Header Navigation Line */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-slate-400 hover:text-white hover:border-gold-500/40 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 text-gold-400" />
          <span>{t('tracker.back')}</span>
        </Link>

        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-semibold px-2.5 py-1 rounded-full glass-pill border border-slate-800">
          {ticket.source === 'walkin' ? 'Walk-In' : 'Online'}
        </span>
      </motion.div>

      {/* ----------------------------------------------------
          TOP SPLIT HERO ROW (Left: Token & Rank | Right: Circular Wait Ring)
          Strictly mapped to Top-Right Screen of Reference Image
      ---------------------------------------------------- */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4">
        {/* Left Column: Frosted Token Box + Rank Readout */}
        <div className="flex flex-col items-center justify-center p-5 rounded-3xl glass-card border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/40 text-center shadow-glass-subtle">
          <div className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-tight drop-shadow-md">
            {ticket.token}
          </div>
          <div className="mt-3 space-y-0.5">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
              {t('tracker.yourPosition')}
            </span>
            <span className="text-sm sm:text-base font-bold text-gold-300 block">
              {isWaiting ? getOrdinalPosition(currentPosition) : t(`status.${ticket.status}`)}
            </span>
          </div>
        </div>

        {/* Right Column: Circular Countdown Progress Ring */}
        <div className="flex flex-col items-center justify-center p-5 rounded-3xl glass-card border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/40 text-center shadow-glass-subtle relative">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background Track */}
              <circle
                cx="60"
                cy="60"
                r={ringRadius}
                className="stroke-slate-800/80"
                strokeWidth="7"
                fill="none"
              />
              {/* Luminous Active Progress Arc */}
              <motion.circle
                cx="60"
                cy="60"
                r={ringRadius}
                className={isCalled || isInChair ? 'stroke-emerald-400' : 'stroke-gold-400'}
                strokeWidth="7"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={springSmooth}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Clock
                className={`w-4 h-4 mb-0.5 ${
                  isCalled || isInChair ? 'text-emerald-400' : 'text-gold-400'
                }`}
              />
              <span className="text-sm font-bold font-mono text-white tracking-tight leading-tight">
                {isCalled || isInChair
                  ? t('tracker.nowReady')
                  : `~ ${waitMinutes} ${t('common.min')}`}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-light">
                {t('tracker.estimatedWait')}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ----------------------------------------------------
          MIDDLE ALERT PILL BANNER
          (Highlights with amber glow when position <= 2)
      ---------------------------------------------------- */}
      {isWaiting && (
        <motion.div variants={fadeInUp}>
          <div
            className={`w-full py-2.5 px-4 rounded-full flex items-center space-x-2.5 text-xs font-medium transition-all duration-300 ${
              currentPosition <= 2
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200 shadow-glow-gold'
                : 'glass-pill border border-white/10 text-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                currentPosition <= 2 ? 'bg-amber-500 text-obsidian-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">
              {currentPosition <= 2
                ? t('tracker.startComingAlert')
                : t('tracker.waitingAlert').replace('{barber}', getBarberName())}
            </span>
          </div>
        </motion.div>
      )}

      {/* ----------------------------------------------------
          CENTERPIECE FEATURE CARD (Dynamic State Transformation)
          Top-Right Reference: Wide frosted pill with radial accent ticks & bell
      ---------------------------------------------------- */}
      <motion.div variants={fadeInUp}>
        {/* STATE A: CALLED ("It's your turn!") */}
        {isCalled && (
          <TactileCard
            hoverable={false}
            className="border-2 border-gold-400/80 bg-gradient-to-b from-gold-500/25 via-obsidian-900/90 to-obsidian-950/95 p-6 rounded-3xl shadow-glow-gold text-center space-y-4 relative overflow-hidden"
          >
            {/* Ambient Background Burst Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-500/20 via-transparent to-transparent pointer-events-none" />

            {/* Pulsing Animated Bell Icon with radial burst ticks */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500 text-obsidian-950 shadow-glow-gold mx-auto">
              <motion.div
                animate={{ rotate: [0, -18, 18, -12, 12, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, repeatDelay: 1 }}
              >
                <Bell className="w-8 h-8 fill-obsidian-950" />
              </motion.div>
            </div>

            <div className="space-y-1 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {t('tracker.itsYourTurn')}
              </h2>
              <p className="text-base font-semibold text-gold-300">
                {t('tracker.goToBarber').replace('{barber}', getBarberName())}
              </p>
              <p className="text-xs text-slate-300 font-light pt-1">
                {t('tracker.chairReady')}
              </p>
            </div>
          </TactileCard>
        )}

        {/* STATE B: IN_CHAIR ("In Chair with [Barber] + Live Session Timer") */}
        {isInChair && (
          <TactileCard
            hoverable={false}
            className="border border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 via-obsidian-900/90 to-obsidian-950/95 p-6 rounded-3xl text-center space-y-4 shadow-glow-emerald"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
              <Scissors className="w-7 h-7 transform -rotate-45" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t('tracker.inChairAlert').replace('{barber}', getBarberName())}
              </h2>
              <div className="pt-2">
                <span className="text-3xl sm:text-4xl font-mono font-bold text-emerald-300 tracking-wider">
                  {sessionTimer}
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  {t('tracker.sessionElapsed').replace('{time}', '')}
                </span>
              </div>
            </div>
          </TactileCard>
        )}

        {/* STATE C: WAITING (Clean summary card keeping UI balanced) */}
        {isWaiting && (
          <TactileCard
            hoverable={false}
            className="border border-white/10 bg-gradient-to-b from-white/[0.04] to-obsidian-900/90 p-5 rounded-3xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {t('tracker.bookedServices')}
              </span>
              <span className="text-xs font-mono font-bold text-gold-400">
                ₹{ticket.totalPrice}
              </span>
            </div>

            {/* List of booked services */}
            <div className="space-y-2">
              {ticket.services?.map((svc, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-gold-400" />
                    <span>{isGujarati ? svc.nameGu : svc.nameEn}</span>
                  </span>
                  <span className="font-mono text-slate-400">{svc.durationMin} {t('common.min')}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>{t('tracker.preferredBarber')}:</span>
              <span className="font-semibold text-white">{getBarberName()}</span>
            </div>
          </TactileCard>
        )}

        {/* STATE D: TERMINAL STATES (Done / Cancelled / No-Show) */}
        {isTerminal && (
          <TactileCard
            hoverable={false}
            className="border border-slate-800 bg-obsidian-900/90 p-6 rounded-3xl text-center space-y-4"
          >
            {isDone && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">{t('tracker.completedHeadline')}</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">{t('tracker.completedSub')}</p>
                </div>
              </>
            )}

            {isCancelled && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                  <XCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">{t('tracker.cancelledHeadline')}</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">{t('tracker.cancelledSub')}</p>
                </div>
              </>
            )}

            {isNoShow && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">{t('tracker.noShowHeadline')}</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">{t('tracker.noShowSub')}</p>
                </div>
              </>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/join"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-950 font-bold text-xs"
              >
                {t('tracker.bookAgain')}
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl glass-pill text-slate-300 font-medium text-xs hover:text-white"
              >
                {t('tracker.backToHome')}
              </Link>
            </div>
          </TactileCard>
        )}
      </motion.div>

      {/* ----------------------------------------------------
          BOTTOM ACTION: "Cancel my spot" Button (Waiting state only)
      ---------------------------------------------------- */}
      {isWaiting && (
        <motion.div variants={fadeInUp} className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setIsCancelModalOpen(true)}
            className="w-full max-w-xs min-h-[48px] px-6 py-3 rounded-full border border-slate-700/80 bg-obsidian-900/60 hover:bg-rose-950/30 hover:border-rose-500/50 hover:text-rose-300 text-xs font-semibold text-slate-400 transition-all duration-200"
          >
            {t('tracker.cancelMySpot')}
          </button>
        </motion.div>
      )}

      {/* ----------------------------------------------------
          CANCELLATION CONFIRMATION DIALOG MODAL
      ---------------------------------------------------- */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={springSnappy}
              className="w-full max-w-sm rounded-3xl p-6 glass-card border border-rose-500/30 bg-obsidian-900/95 space-y-5 text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">
                  {t('tracker.cancelModalTitle')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('tracker.cancelModalDesc')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCancelling}
                  className="px-4 py-2.5 rounded-xl glass-pill text-xs font-semibold text-slate-300 hover:text-white min-h-[44px]"
                >
                  {t('tracker.keepMySpot')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelTicket}
                  disabled={isCancelling}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs min-h-[44px] flex items-center justify-center gap-1.5"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('tracker.cancelling')}</span>
                    </>
                  ) : (
                    <span>{t('tracker.confirmCancel')}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyStatusPage;
