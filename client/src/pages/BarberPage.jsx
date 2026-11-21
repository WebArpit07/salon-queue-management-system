import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  User,
  Clock,
  Play,
  Check,
  Coffee,
  Sparkles,
  AlertCircle,
  Loader2,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import api from '../lib/api';
import StaffPinGate from '../components/auth/StaffPinGate';
import LanguageToggle from '../components/ui/LanguageToggle';
import { fadeInUp, springSnappy } from '../lib/motion';

export const BarberViewContent = () => {
  const { name: paramName } = useParams();
  const navigate = useNavigate();
  const { t, isGujarati } = useLanguage();
  const { barbers = [], called = [], inChair = [], waiting = [], refreshQueueState } = useQueue();

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [elapsedTimer, setElapsedTimer] = useState('00:00:00');
  const [notice, setNotice] = useState(null);

  // Normalize active barber slug from route
  const currentSlug = (paramName || 'ravi').toLowerCase();
  const currentBarber = barbers.find((b) => b.slug === currentSlug) || barbers[0] || {
    name: 'Ravi',
    slug: 'ravi',
    specialtyEn: 'Senior Hair & Fade Specialist',
    specialtyGu: 'સિનિયર હેર અને ફેડ સ્પેશિયાલિસ્ટ',
    status: 'available',
    onDuty: true,
  };

  // Find active customer in chair or called for this barber
  const activeTicket =
    inChair.find((t) => t.assignedBarber === currentBarber.slug) ||
    called.find((t) => t.assignedBarber === currentBarber.slug);

  // Find next eligible customer waiting for this barber
  const nextTicket = waiting.find(
    (w) => w.preferredBarber === currentBarber.slug || w.preferredBarber === 'any'
  );

  // Live ticking timer when customer is in chair
  useEffect(() => {
    let interval = null;
    if (activeTicket && activeTicket.status === 'in_chair' && activeTicket.startedAt) {
      const updateTimer = () => {
        const start = new Date(activeTicket.startedAt).getTime();
        const diffSec = Math.max(0, Math.floor((Date.now() - start) / 1000));
        const hh = String(Math.floor(diffSec / 3600)).padStart(2, '0');
        const mm = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
        const ss = String(diffSec % 60).padStart(2, '0');
        setElapsedTimer(`${hh}:${mm}:${ss}`);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedTimer('00:00:00');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTicket?.status, activeTicket?.startedAt]);

  // Actions
  const handleCallNext = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post(`/api/queue/barber/${currentBarber.slug}/call-next`);
      setNotice(`Called #${res.data.ticket?.token} for your chair!`);
      setTimeout(() => setNotice(null), 3000);
      refreshQueueState();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to call next customer');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartService = async () => {
    setIsActionLoading(true);
    try {
      await api.post(`/api/queue/barber/${currentBarber.slug}/start`);
      refreshQueueState();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start service');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteService = async () => {
    setIsActionLoading(true);
    try {
      await api.post(`/api/queue/barber/${currentBarber.slug}/done`);
      setNotice('Service completed! Chair is now free.');
      setTimeout(() => setNotice(null), 3000);
      refreshQueueState();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete service');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleBreakStatus = async (targetStatus) => {
    if (activeTicket) {
      alert(t('barberStation.breakNoticeBusy'));
      return;
    }
    try {
      await api.patch(`/api/queue/barber/${currentBarber.slug}/status`, {
        status: targetStatus,
      });
      refreshQueueState();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const isBusy = Boolean(activeTicket);
  const isOnBreak = currentBarber.status === 'on_break';

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="max-w-md mx-auto space-y-6 pb-20 select-none"
    >
      {/* ----------------------------------------------------
          TOP HEADER & BARBER SELECTOR SWITCHER
      ---------------------------------------------------- */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl glass-card border border-white/10 bg-obsidian-900/90 shadow-sm">
        {/* Left: Brand & Barber Selector Pills */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
            <Scissors className="w-4 h-4 transform -rotate-45" />
          </div>
          <div className="flex items-center space-x-1">
            {barbers.map((b) => {
              const isSelected = b.slug === currentBarber.slug;
              return (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => navigate(`/barber/${b.slug}`)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${
                    isSelected
                      ? 'bg-gold-500 text-obsidian-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Status Pill & Language Toggle */}
        <div className="flex items-center space-x-2">
          <div
            className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
              isBusy
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : isOnBreak
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBusy ? 'bg-amber-400' : isOnBreak ? 'bg-rose-400' : 'bg-emerald-400'
              }`}
            />
            <span>
              {isBusy
                ? t('barberStation.busyBadge')
                : isOnBreak
                ? t('barberStation.onBreakBadge')
                : t('barberStation.onDutyBadge')}
            </span>
          </div>

          <LanguageToggle className="!p-0.5 !scale-90" />
        </div>
      </div>

      {/* Global Feedback Notice */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------
          BARBER PROFILE HEADER
      ---------------------------------------------------- */}
      <div className="flex items-center space-x-4 p-4 rounded-3xl glass-card border border-white/10 bg-obsidian-900/90">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/30 border border-gold-500/40 flex items-center justify-center font-serif text-2xl font-bold text-gold-400 shadow-inner">
          {currentBarber.name?.charAt(0) || 'B'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            {currentBarber.name}
          </h2>
          <p className="text-xs text-slate-400 font-light">
            {isGujarati
              ? currentBarber.specialtyGu || currentBarber.specialtyEn
              : currentBarber.specialtyEn}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------
          ACTIVE CUSTOMER CARD (Centerpiece)
          Model: Bottom-Second-From-Left in Reference
      ---------------------------------------------------- */}
      <div className="p-6 rounded-3xl glass-card border border-white/10 bg-gradient-to-b from-white/[0.06] to-obsidian-900/95 space-y-6 shadow-glass-subtle">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
          {t('barberStation.activeCustomerTitle')}
        </span>

        {/* Case 1: Active Ticket Exists (Called or In Chair) */}
        {activeTicket ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              {/* Left: Token, Name, Services */}
              <div className="space-y-1.5 min-w-0">
                <span className="text-4xl font-mono font-extrabold text-white tracking-tight block">
                  {activeTicket.token}
                </span>
                <h3 className="text-base font-bold text-gold-300 truncate">
                  {activeTicket.customerName}
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeTicket.services?.map((svc, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700"
                    >
                      {isGujarati ? svc.nameGu : svc.nameEn} · {svc.durationMin}m
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Recessed Timer / Waiting indicator */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-center shrink-0 min-w-[110px]">
                {activeTicket.status === 'in_chair' ? (
                  <>
                    <span className="text-xl font-mono font-bold text-emerald-400 block tracking-wider">
                      {elapsedTimer}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mt-0.5">
                      {t('barberStation.elapsedTime')}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping mx-auto block mb-1" />
                    <span className="text-[11px] text-amber-300 font-semibold block leading-tight">
                      Called
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Waiting guest
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Full-width Action Button */}
            {activeTicket.status === 'called' ? (
              <button
                type="button"
                onClick={handleStartService}
                disabled={isActionLoading}
                className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-obsidian-950 font-bold text-sm flex items-center justify-center gap-2 shadow-glow-gold active:scale-98 transition-transform"
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-obsidian-950" />
                    <span>{t('barberStation.startServiceBtn')}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteService}
                disabled={isActionLoading}
                className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-glow-emerald active:scale-98 transition-transform"
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{t('barberStation.completeServiceBtn')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          /* Case 2: Chair is Free */
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {t('barberStation.chairFreeTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('barberStation.chairFreeDesc')}
              </p>
            </div>

            {/* [ Call Next Customer ] Button */}
            <button
              type="button"
              onClick={handleCallNext}
              disabled={isActionLoading || !nextTicket || isOnBreak}
              className={`w-full min-h-[52px] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                nextTicket && !isOnBreak
                  ? 'bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-obsidian-950 shadow-glow-gold active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isActionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>{t('barberStation.callNextCustomerBtn')}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------
          "NEXT FOR YOU" PREVIEW CARD
      ---------------------------------------------------- */}
      <div className="p-4 rounded-3xl glass-card border border-white/10 bg-obsidian-900/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
            {t('barberStation.nextForYouTitle')}
          </span>
          {nextTicket ? (
            <p className="text-xs font-bold text-white mt-0.5">
              <span className="font-mono text-gold-400">{nextTicket.token}</span> · {nextTicket.customerName}{' '}
              <span className="text-slate-400 font-normal">
                ({nextTicket.totalDurationMin}m)
              </span>
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">
              {t('barberStation.noNextCustomer')}
            </p>
          )}
        </div>

        {nextTicket && (
          <span className="text-xs font-mono text-emerald-400 font-semibold px-2.5 py-1 rounded-full glass-pill border border-emerald-500/20">
            ~{nextTicket.estimatedWaitMin || 0}m
          </span>
        )}
      </div>

      {/* ----------------------------------------------------
          BOTTOM AVAILABILITY / BREAK TOGGLE BAR
      ---------------------------------------------------- */}
      <div className="p-2 rounded-2xl glass-pill border border-slate-800 bg-obsidian-900/90 grid grid-cols-2 gap-2">
        {/* Available Switch */}
        <button
          type="button"
          onClick={() => handleToggleBreakStatus('available')}
          disabled={isBusy}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[44px] ${
            !isOnBreak
              ? 'bg-emerald-500 text-obsidian-950 shadow-glow-emerald'
              : 'text-slate-400 hover:text-white'
          } ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="w-2 h-2 rounded-full bg-current" />
          <span>{t('barberStation.availableSwitch')}</span>
        </button>

        {/* On Break Switch */}
        <button
          type="button"
          onClick={() => handleToggleBreakStatus('on_break')}
          disabled={isBusy}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[44px] ${
            isOnBreak
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          } ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>{t('barberStation.onBreakSwitch')}</span>
        </button>
      </div>
    </motion.div>
  );
};

export const BarberPage = () => {
  return (
    <StaffPinGate>
      <BarberViewContent />
    </StaffPinGate>
  );
};

export default BarberPage;
