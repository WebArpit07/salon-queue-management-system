import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Plus,
  Users,
  Clock,
  Maximize2,
  Tv,
  Radio,
  CheckCircle2,
  AlertTriangle,
  UserX,
  X,
  Loader2,
  Volume2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import api from '../lib/api';
import StaffPinGate from '../components/auth/StaffPinGate';
import AddWalkInModal from '../components/reception/AddWalkInModal';
import LanguageToggle from '../components/ui/LanguageToggle';
import SalonLogo from '../components/ui/SalonLogo';
import { fadeInUp, springSnappy } from '../lib/motion';

export const ReceptionDashboardContent = () => {
  const { t, isGujarati } = useLanguage();
  const { barbers = [], waiting = [], called = [], inChair = [], queueState, refreshQueueState } = useQueue();

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState({});
  const [feedbackNotice, setFeedbackNotice] = useState(null);
  const [ticketToCancel, setTicketToCancel] = useState(null);

  // Combine called tickets at the top with waiting tickets
  const displayQueue = [
    ...called.map((t) => ({ ...t, isCalledRow: true })),
    ...waiting.map((t) => ({ ...t, isCalledRow: false })),
  ];

  // Auto-select first ticket if current selection is invalid or none
  useEffect(() => {
    if (displayQueue.length > 0) {
      const exists = displayQueue.some((t) => t._id === selectedTicketId);
      if (!exists) {
        setSelectedTicketId(displayQueue[0]._id);
      }
    } else {
      setSelectedTicketId(null);
    }
  }, [displayQueue.length]);

  const selectedTicket = displayQueue.find((t) => t._id === selectedTicketId);

  // Fullscreen toggle helper
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 1. Call Next client for a specific barber
  const handleCallNext = async (barberSlug) => {
    setActionInProgress((prev) => ({ ...prev, [barberSlug]: true }));
    try {
      const res = await api.post(`/api/queue/barber/${barberSlug}/call-next`);
      setFeedbackNotice(
        t('receptionDashboard.callNextSuccess')
          .replace('{token}', res.data.ticket?.token)
          .replace('{barber}', res.data.barber?.name)
      );
      setTimeout(() => setFeedbackNotice(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot call next client');
    } finally {
      setActionInProgress((prev) => ({ ...prev, [barberSlug]: false }));
    }
  };

  // 2. Mark ticket as No-show
  const handleNoShow = async (ticketId) => {
    if (!ticketId) return;
    setActionInProgress((prev) => ({ ...prev, [ticketId]: true }));
    try {
      const res = await api.post(`/api/queue/ticket/${ticketId}/no-show`);
      setFeedbackNotice(
        t('receptionDashboard.noShowSuccess').replace('{token}', res.data.ticket?.token)
      );
      setTimeout(() => setFeedbackNotice(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot mark as no-show');
    } finally {
      setActionInProgress((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  // 3. Cancel waiting ticket
  const handleConfirmCancel = async () => {
    if (!ticketToCancel) return;
    setActionInProgress((prev) => ({ ...prev, [ticketToCancel._id]: true }));
    try {
      await api.post(`/api/queue/ticket/${ticketToCancel._id}/cancel`);
      setTicketToCancel(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel ticket');
    } finally {
      setActionInProgress((prev) => ({ ...prev, [ticketToCancel._id]: false }));
    }
  };

  // Formatted current date
  const todayDateStr = new Intl.DateTimeFormat(isGujarati ? 'gu-IN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------
          TOP UTILITY BAR
          Model: Landscape Tablet Frame (Brand, quick pills, Date, Fullscreen)
      ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-sm select-none">
        {/* Left: Brand + Quick Links */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 p-1 flex items-center justify-center text-obsidian-950 shadow-sm shrink-0">
            <SalonLogo className="w-7 h-7 text-obsidian-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Studio Kashi <span className="text-gold-600 font-semibold">Salon</span>
              </span>
              <span className="font-gujarati font-bold text-xs text-gold-700 bg-gold-50 border border-gold-200 px-1.5 py-0.5 rounded">
                સ્ટુડિયો કાશી સલૂન
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {isGujarati ? 'સ્વાગત અને ફ્લોર સંચાલન' : 'Concierge & Reception Command'}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 pl-4 border-l border-slate-200">
            <Link
              to="/barber/ravi"
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-gold-600" />
              <span>{t('receptionDashboard.barberConsoleLink')}</span>
            </Link>
            <Link
              to="/display"
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Tv className="w-3.5 h-3.5 text-slate-600" />
              <span>{t('receptionDashboard.tvDisplayLink')}</span>
            </Link>
          </div>
        </div>

        {/* Right: Date, Language Toggle & Fullscreen */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-500 font-mono hidden md:inline">
            Today · {todayDateStr}
          </span>

          <LanguageToggle className="!bg-slate-100 !border-slate-300" />

          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={t('receptionDashboard.fullscreen')}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Notice Toast */}
      <AnimatePresence>
        {feedbackNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------
          2-COLUMN LANDSCAPE SPLIT (Matching Bottom-Left Reference)
          Left: Barbers Overview (Col 5) | Right: Waiting Queue (Col 7)
      ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
        {/* ====================================================
            LEFT COLUMN: BARBERS OVERVIEW + [ + Add Walk-in ]
        ==================================================== */}
        <div className="lg:col-span-5 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-wide">
              {t('receptionDashboard.barbersOverview')}
            </h2>

            {/* Solid Sage-Emerald Pill Button */}
            <button
              type="button"
              onClick={() => setIsWalkInModalOpen(true)}
              className="px-4 py-2.5 rounded-full bg-[#18624C] hover:bg-[#124d3b] text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('receptionDashboard.addWalkin')}</span>
            </button>
          </div>

          {/* Stacked Barber Cards */}
          <div className="space-y-3">
            {barbers.map((barber) => {
              // Find active ticket if in_chair or called
              const activeTicket =
                inChair.find((t) => t.assignedBarber === barber.slug) ||
                called.find((t) => t.assignedBarber === barber.slug);

              const isBusy = barber.status === 'busy';
              const isOffDuty = !barber.onDuty;
              const isOnBreak = barber.status === 'on_break' || isOffDuty;
              const isAvailable = barber.onDuty && barber.status === 'available' && !activeTicket;

              // Has eligible waiting customers in line?
              const eligibleCount = waiting.filter(
                (w) => w.preferredBarber === barber.slug || w.preferredBarber === 'any'
              ).length;

              const canCallNext = isAvailable && eligibleCount > 0 && !actionInProgress[barber.slug];

              let statusText = t('receptionDashboard.availableStatus');
              if (isOffDuty) {
                statusText = isGujarati ? 'ઓફ ડ્યુટી' : 'Off Duty';
              } else if (activeTicket) {
                statusText =
                  activeTicket.status === 'called'
                    ? t('receptionDashboard.calledStatus').replace('{token}', activeTicket.token)
                    : t('receptionDashboard.servingStatus').replace('{token}', activeTicket.token);
              } else if (isOnBreak) {
                statusText = t('receptionDashboard.onBreakStatus');
              }

              return (
                <div
                  key={barber.slug}
                  className={`p-4 rounded-2xl bg-white border shadow-sm flex flex-col justify-between space-y-3 ${
                    isOffDuty ? 'border-slate-200/60 opacity-75' : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-800 shrink-0">
                        {barber.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {barber.name}
                          </h3>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isBusy
                                ? 'bg-amber-500'
                                : isOffDuty
                                ? 'bg-slate-400'
                                : isOnBreak
                                ? 'bg-rose-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate">
                          {statusText}
                        </p>
                      </div>
                    </div>

                    {/* [ Call Next ] Pill Button */}
                    <button
                      type="button"
                      onClick={() => handleCallNext(barber.slug)}
                      disabled={!canCallNext}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 ${
                        canCallNext
                          ? 'bg-slate-900 hover:bg-black text-white shadow-sm active:scale-95'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                    >
                      {actionInProgress[barber.slug] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>{t('receptionDashboard.callNextBtn')}</span>
                      )}
                    </button>
                  </div>

                  {/* Horizontal chair time progress bar when busy */}
                  {isBusy && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full w-2/3 animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ====================================================
            RIGHT COLUMN: WAITING QUEUE INTERACTIVE BOARD
        ==================================================== */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 tracking-wide">
                {t('receptionDashboard.waitingQueue')}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                {displayQueue.length}
              </span>
            </div>

            <span className="text-xs text-slate-400">
              {isGujarati ? 'પસંદ કરવા માટે પંક્તિ પર ટૅપ કરો' : 'Tap row to operate'}
            </span>
          </div>

          {/* Table / Queue List */}
          <div className="overflow-x-auto min-h-[280px]">
            {displayQueue.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  {t('receptionDashboard.noOneWaiting')}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">{t('receptionDashboard.colToken')}</th>
                    <th className="py-2.5 px-3">{t('receptionDashboard.colCustomer')}</th>
                    <th className="py-2.5 px-3">{t('receptionDashboard.colServices')}</th>
                    <th className="py-2.5 px-3">{t('receptionDashboard.colBarber')}</th>
                    <th className="py-2.5 px-3 text-right">{t('receptionDashboard.colWait')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayQueue.map((tkt) => {
                    const isSelected = selectedTicketId === tkt._id;
                    const isCalled = tkt.isCalledRow;
                    const isOver60 = (tkt.estimatedWaitMin || 0) > 60;

                    return (
                      <tr
                        key={tkt._id}
                        onClick={() => setSelectedTicketId(tkt._id)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isSelected
                            ? 'bg-emerald-50/70 font-medium'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Token Column */}
                        <td className="py-3 px-3">
                          <span
                            className={`font-mono font-bold px-2 py-1 rounded-md text-xs ${
                              isCalled
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {tkt.token}
                          </span>
                        </td>

                        {/* Customer Column */}
                        <td className="py-3 px-3 text-slate-900 font-semibold max-w-[120px] truncate">
                          {tkt.customerName}
                        </td>

                        {/* Services Column */}
                        <td className="py-3 px-3 text-slate-600 max-w-[140px] truncate">
                          {tkt.services
                            ?.map((s) => (isGujarati ? s.nameGu : s.nameEn))
                            .join(', ')}
                        </td>

                        {/* Barber Column */}
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {tkt.assignedBarber
                            ? tkt.assignedBarber.toUpperCase()
                            : tkt.preferredBarber === 'any'
                            ? (isGujarati ? 'કોઈપણ' : 'Any')
                            : tkt.preferredBarber.toUpperCase()}
                        </td>

                        {/* Wait Column with 60-min Highlight Rule */}
                        <td className="py-3 px-3 text-right">
                          {isCalled ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px] uppercase">
                              Called
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono font-semibold text-[11px] border ${
                                isOver60
                                  ? 'bg-amber-500/15 text-amber-800 border-amber-400/40'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              ~{tkt.estimatedWaitMin || 0}m
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom Action Bar (Row Selection Operating Controls) */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {selectedTicket ? (
                <span>
                  {isGujarati ? 'પસંદ કરેલ:' : 'Selected:'}{' '}
                  <strong className="text-slate-800 font-mono">{selectedTicket.token}</strong> ({selectedTicket.customerName})
                </span>
              ) : (
                <span>{isGujarati ? 'કોઈ ટોકન પસંદ નથી' : 'No ticket selected'}</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* [ No-show ] Button */}
              <button
                type="button"
                onClick={() => handleNoShow(selectedTicket?._id)}
                disabled={!selectedTicket || selectedTicket.status !== 'called'}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                  selectedTicket?.status === 'called'
                    ? 'border border-slate-300 text-slate-800 hover:bg-slate-100'
                    : 'text-slate-300 border border-slate-200 cursor-not-allowed'
                }`}
              >
                {t('receptionDashboard.noShowBtn')}
              </button>

              {/* [ Cancel ] Button */}
              <button
                type="button"
                onClick={() => setTicketToCancel(selectedTicket)}
                disabled={!selectedTicket || selectedTicket.status !== 'waiting'}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                  selectedTicket?.status === 'waiting'
                    ? 'border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100'
                    : 'text-slate-300 border border-slate-200 cursor-not-allowed'
                }`}
              >
                {t('receptionDashboard.cancelBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Walk-in Add Modal */}
      <AddWalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSuccess={(ticket) => {
          setFeedbackNotice(`Added walk-in ticket #${ticket.token} successfully!`);
          setTimeout(() => setFeedbackNotice(null), 3000);
          refreshQueueState();
        }}
      />

      {/* Cancellation Confirmation Dialog */}
      <AnimatePresence>
        {ticketToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springSnappy}
              className="w-full max-w-sm p-6 rounded-3xl bg-white border border-slate-200 text-slate-900 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {t('receptionDashboard.cancelConfirmTitle').replace('{token}', ticketToCancel.token)}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('receptionDashboard.cancelConfirmDesc')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTicketToCancel(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                >
                  {t('receptionDashboard.keepSpot')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold min-h-[44px]"
                >
                  {t('receptionDashboard.yesCancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ReceptionPage = () => {
  return (
    <StaffPinGate>
      <ReceptionDashboardContent />
    </StaffPinGate>
  );
};

export default ReceptionPage;
