import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Scissors,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Activity,
  Ticket,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import SplitHeading from '../components/ui/SplitHeading';
import TactileCard from '../components/ui/TactileCard';
import { fadeInUp, staggerContainer, cardHoverMotion, springSnappy } from '../lib/motion';

export const HomePage = () => {
  const { t, isGujarati } = useLanguage();
  const { queueState, barbers, waiting, todayStats, onlineStatus, salonConfig, isConnected } = useQueue();
  const [activeTicket, setActiveTicket] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('salon_active_ticket');
      if (saved) {
        setActiveTicket(JSON.parse(saved));
      }
    } catch (e) {
      // Ignored
    }
  }, []);

  const workingBarbers = barbers.filter((b) => b.onDuty && b.status !== 'on_break');
  const totalWaitingMinutes = waiting.reduce((acc, t) => acc + (t.totalDurationMin || 25), 0);
  const estWaitMin =
    waiting.length === 0
      ? 0
      : Math.ceil(totalWaitingMinutes / Math.max(workingBarbers.length, 1));

  const isQueueOpen = onlineStatus?.isOpen ?? true;

  const getStatusBadge = (barber) => {
    if (barber.status === 'busy') {
      return {
        label: `${barber.name} · ${isGujarati ? 'વ્યસ્ત' : 'Busy'}`,
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
      };
    }
    if (barber.status === 'on_break') {
      return {
        label: `${barber.name} · ${isGujarati ? 'વિરામ પર' : 'On break'}`,
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400',
      };
    }
    return {
      label: `${barber.name} · ${isGujarati ? 'હાજર' : 'Free'}`,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
    };
  };

  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="visible"
      className="space-y-10 sm:space-y-12"
    >
      {/* 1. Salon Operating Status Alert Banner & Active Ticket Banner */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-3">
        {activeTicket && (
          <Link
            to={`/status/${activeTicket.ticketId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-gold-500/50 text-xs font-semibold text-gold-300 shadow-glow-gold hover:scale-[1.02] transition-transform min-h-[44px]"
          >
            <Ticket className="w-4 h-4 text-gold-400" />
            <span>{t('home.viewActiveTicket').replace('{token}', activeTicket.token)}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5 text-gold-400" />
          </Link>
        )}

        {isQueueOpen ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-pill border border-gold-500/30 text-xs font-medium text-gold-300 shadow-sm min-h-[44px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="font-semibold">{t('brand.openNotice')}</span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">{t('brand.tagline')}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-950/40 border border-rose-500/30 text-xs font-medium text-rose-300 shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{t('brand.closedNotice')}</span>
            <span className="text-rose-400/80">({t('brand.walkinWelcome')})</span>
          </div>
        )}
      </motion.div>

      {/* 2. Hero Section */}
      <div className="max-w-3xl space-y-4">
        <div>
          <SplitHeading
            text={t('brand.heroHeading')}
            as="h1"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-sans"
          />
        </div>
        <motion.p
          variants={fadeInUp}
          className="text-base sm:text-xl text-slate-300 font-light leading-relaxed max-w-2xl"
        >
          {t('brand.heroSubheading')}
        </motion.p>
      </div>

      {/* 3. Hero Pulse Card (TactileCard) with Live Queue Telemetry */}
      <motion.div variants={fadeInUp}>
        <TactileCard
          hoverable={false}
          className="border border-gold-500/25 bg-gradient-to-br from-obsidian-900/90 via-obsidian-850/80 to-obsidian-950/95 p-6 sm:p-8 rounded-3xl shadow-glass-subtle"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
            {/* Stat 1: People Waiting */}
            <div className="flex items-center space-x-5 pt-2 sm:pt-0">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-glow-gold shrink-0">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                    {waiting.length}
                  </span>
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    {isGujarati ? 'ગ્રાહકો' : 'waiting'}
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-medium mt-0.5">
                  {t('home.peopleWaiting')}
                </p>
              </div>
            </div>

            {/* Stat 2: Estimated Wait Time */}
            <div className="flex items-center space-x-5 pt-6 sm:pt-0 sm:pl-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-emerald shrink-0">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl sm:text-5xl font-mono font-bold text-emerald-300 tracking-tight">
                    {estWaitMin === 0 ? '0' : `~${estWaitMin}`}
                  </span>
                  <span className="text-sm text-emerald-400/90 font-medium">
                    {t('home.mins')}
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-medium mt-0.5">
                  {t('home.estWaitTime')}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-footer inside Hero Pulse Card */}
          <div className="mt-6 pt-5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {t('home.todayServed')}: <strong className="text-white font-mono">{todayStats.servedCount || 0}</strong>
              </span>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {workingBarbers.length} {isGujarati ? 'વાળંદ ઉપલબ્ધ' : 'active stylists'}
            </span>
          </div>
        </TactileCard>
      </motion.div>

      {/* 4. Dynamic Barber Chips Section */}
      <motion.div variants={fadeInUp} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-wide flex items-center gap-2">
            <Scissors className="w-4 h-4 text-gold-400" />
            <span>{t('home.barberSectionTitle')}</span>
          </h2>
          <span className="text-xs text-slate-500">
            {isGujarati ? 'લાઇવ સ્થિતિ' : 'Live Chair Status'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {barbers.map((barber) => {
            const badge = getStatusBadge(barber);
            return (
              <motion.div
                key={barber._id || barber.slug}
                variants={cardHoverMotion}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className="p-4 rounded-2xl glass-card border border-slate-800/80 flex items-center space-x-3.5 select-none"
              >
                {/* Barber Avatar Circle with Initial */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-obsidian-900 border border-slate-700 flex items-center justify-center font-serif text-lg font-bold text-gold-400 shadow-inner shrink-0">
                  {barber.name?.charAt(0) || 'B'}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {barber.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    {isGujarati ? barber.specialtyGu || barber.specialtyEn : barber.specialtyEn}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* 5. Primary Call to Action Button / Offline Guard */}
      <motion.div variants={fadeInUp} className="pt-2">
        {isQueueOpen ? (
          <Link to="/join" className="block w-full sm:w-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={springSnappy}
              className="w-full sm:w-auto min-h-[56px] px-8 py-4 rounded-2xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-obsidian-950 font-bold text-base sm:text-lg flex items-center justify-center space-x-3 shadow-glow-gold transition-all duration-200"
            >
              <span>{t('home.joinQueueCta')}</span>
              <ArrowRight className="w-5 h-5 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        ) : (
          <div className="w-full sm:w-auto min-h-[56px] px-6 py-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 font-medium text-sm sm:text-base flex items-center justify-center space-x-3 cursor-not-allowed">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{t('home.closedCta')} · {t('brand.walkinWelcome')}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default HomePage;
