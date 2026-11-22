import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Scissors,
  User,
  Phone,
  Sparkles,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import api from '../lib/api';
import TactileCard from '../components/ui/TactileCard';
import { fadeInUp, staggerContainer, springSnappy } from '../lib/motion';

export const JoinQueuePage = () => {
  const { t, isGujarati } = useLanguage();
  const { services, barbers, waiting } = useQueue();
  const navigate = useNavigate();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [preferredBarber, setPreferredBarber] = useState('any');

  // UI / Validation State
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverNotice, setServerNotice] = useState(null);

  // Phone input sanitizer: allow strictly up to 10 digits
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
    if (errors.phone && raw.length === 10) {
      setErrors((prev) => ({ ...prev, phone: null }));
    }
  };

  const handleNameChange = (e) => {
    setCustomerName(e.target.value);
    if (errors.name && e.target.value.trim().length >= 2) {
      setErrors((prev) => ({ ...prev, name: null }));
    }
  };

  // Toggle service selection with strict 3-service max limit
  const toggleService = (serviceId) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
      setErrors((prev) => ({ ...prev, services: null }));
    } else {
      if (selectedServiceIds.length >= 3) {
        setErrors((prev) => ({
          ...prev,
          services: t('join.errors.maxServices'),
        }));
        return;
      }
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
      setErrors((prev) => ({ ...prev, services: null }));
    }
  };

  const clearAllServices = () => {
    setSelectedServiceIds([]);
    setErrors((prev) => ({ ...prev, services: null }));
  };

  // Compute live cart sums
  const activeSelectedServices = services.filter((s) => selectedServiceIds.includes(s._id));
  const totalDurationMin = activeSelectedServices.reduce((sum, s) => sum + s.durationMin, 0);
  const totalPrice = activeSelectedServices.reduce((sum, s) => sum + s.price, 0);

  // Compute live estimated wait time
  const workingBarbers = barbers.filter((b) => b.onDuty && b.status !== 'on_break');
  const baseMinutesAhead = waiting.reduce((sum, t) => sum + (t.totalDurationMin || 25), 0);
  const estWaitMin =
    waiting.length === 0
      ? 0
      : Math.ceil(baseMinutesAhead / Math.max(workingBarbers.length, 1));

  // Form Validation & Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!customerName || customerName.trim().length < 2) {
      newErrors.name = t('join.errors.nameRequired');
    }

    if (!phone || phone.length !== 10) {
      newErrors.phone = t('join.errors.phoneRequired');
    }

    if (selectedServiceIds.length === 0) {
      newErrors.services = t('join.errors.serviceRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setServerNotice(null);

    try {
      const response = await api.post('/api/queue/join', {
        customerName: customerName.trim(),
        phone: phone.trim(),
        serviceIds: selectedServiceIds,
        preferredBarber,
      });

      const data = response.data || {};
      const ticket = data.ticket || (data._id || data.id ? data : null);
      const ticketId = ticket?._id || ticket?.id || data._id || data.id || data.ticketId;
      const isExisting = Boolean(data.isExisting);

      if (!ticketId) {
        throw new Error('Invalid ticket response received from server');
      }

      // Persist active ticket in localStorage
      try {
        localStorage.setItem(
          'salon_active_ticket',
          JSON.stringify({ ticketId, token: ticket?.token || data.token || '---' })
        );
      } catch (e) {
        console.warn('Could not save active ticket to localStorage:', e);
      }

      if (isExisting) {
        setServerNotice(t('join.errors.duplicateTicket'));
        setTimeout(() => {
          navigate(`/status/${ticketId}`);
        }, 1200);
      } else {
        navigate(`/status/${ticketId}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('join.errors.joinFailed');
      setServerNotice(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={staggerContainer(0.06)}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto space-y-8 pb-32"
    >
      {/* 1. Header with Back Button */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass-pill text-xs font-semibold text-slate-400 hover:text-white hover:border-gold-500/40 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 text-gold-400" />
          <span>{t('join.back')}</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-gold-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGujarati ? 'લાઇવ ટોકન સિસ્ટમ' : 'Live Token System'}</span>
        </div>
      </motion.div>

      {/* Title & Subtitle */}
      <motion.div variants={fadeInUp} className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
          {t('join.title')}
        </h1>
        <p className="text-sm sm:text-base text-slate-400 font-light">
          {t('join.subtitle')}
        </p>
      </motion.div>

      {/* Server Notice Alert */}
      <AnimatePresence>
        {serverNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-sm flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{serverNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 2. Customer Details Card */}
        <motion.div variants={fadeInUp}>
          <TactileCard hoverable={false} className="border-slate-800 space-y-5 p-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              {isGujarati ? 'ગ્રાહકની વિગત' : 'Customer Details'}
            </h2>

            {/* Customer Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="customerName" className="block text-xs font-medium text-slate-300">
                {t('join.customerNameLabel')} <span className="text-gold-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={handleNameChange}
                  placeholder={t('join.customerNamePlaceholder')}
                  className={`w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-obsidian-950 border text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${
                    errors.name
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                      : 'border-slate-800 focus:border-gold-500/60'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Phone Number Input */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-xs font-medium text-slate-300">
                {t('join.phoneLabel')} <span className="text-gold-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder={t('join.phonePlaceholder')}
                  className={`w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-obsidian-950 border text-sm text-white placeholder-slate-600 focus:outline-none transition-colors font-mono tracking-wider ${
                    errors.phone
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                      : 'border-slate-800 focus:border-gold-500/60'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>
          </TactileCard>
        </motion.div>

        {/* 3. Service Grid (Max 3) */}
        <motion.div variants={fadeInUp} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">
                {t('join.selectServicesTitle')} <span className="text-gold-400">*</span>
              </h2>
              <p className="text-xs text-slate-400">
                {isGujarati
                  ? `પસંદ કરેલ: ${selectedServiceIds.length}/3`
                  : `Selected: ${selectedServiceIds.length}/3`}
              </p>
            </div>
            {selectedServiceIds.length > 0 && (
              <button
                type="button"
                onClick={clearAllServices}
                className="text-xs text-slate-400 hover:text-gold-400 flex items-center gap-1 py-1 px-2.5 rounded-lg glass-pill transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('join.clearAll')}</span>
              </button>
            )}
          </div>

          {errors.services && (
            <p className="text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.services}</span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((service) => {
              const isSelected = selectedServiceIds.includes(service._id);
              return (
                <motion.div
                  key={service._id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleService(service._id)}
                  className={`relative p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200 min-h-[76px] flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-gold-500/15 via-gold-500/10 to-transparent border-gold-500/60 shadow-glow-gold'
                      : 'bg-obsidian-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {isGujarati ? service.nameGu : service.nameEn}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-gold-400" />
                        {service.durationMin} {t('home.mins')}
                      </span>
                      <span>•</span>
                      <span className="text-gold-300 font-semibold font-mono">
                        ₹{service.price}
                      </span>
                    </p>
                  </div>

                  {/* Toggle Checkmark */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-gold-500 border-gold-500 text-obsidian-950 shadow-sm'
                        : 'border-slate-700 bg-obsidian-950/60 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 4. Staff Picker Carousel */}
        <motion.div variants={fadeInUp} className="space-y-3">
          <h2 className="text-sm font-semibold text-white tracking-wide">
            {t('join.chooseBarberTitle')}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Option: Any Barber (Fastest) */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setPreferredBarber('any')}
              className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all text-center flex flex-col items-center justify-center space-y-1.5 ${
                preferredBarber === 'any'
                  ? 'bg-gradient-to-b from-gold-500/20 to-gold-500/5 border-gold-500 shadow-glow-gold'
                  : 'bg-obsidian-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  preferredBarber === 'any'
                    ? 'bg-gold-500 text-obsidian-950 shadow-sm'
                    : 'bg-slate-800 text-gold-400'
                }`}
              >
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">
                {t('join.anyBarberFastest')}
              </span>
            </motion.div>

            {/* Individual Barbers */}
            {barbers.filter((b) => b.onDuty).map((b) => {
              const isSelected = preferredBarber === b.slug;
              return (
                <motion.div
                  key={b.slug}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPreferredBarber(b.slug)}
                  className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all text-center flex flex-col items-center justify-center space-y-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-b from-gold-500/20 to-gold-500/5 border-gold-500 shadow-glow-gold'
                      : 'bg-obsidian-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-serif text-base font-bold ${
                      isSelected
                        ? 'bg-gold-500 text-obsidian-950 shadow-sm'
                        : 'bg-slate-800 text-gold-400'
                    }`}
                  >
                    {b.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {b.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[90px]">
                      {isGujarati ? b.specialtyGu : b.specialtyEn}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 5. Glass Bottom Sheet / Sticky Drawer */}
        <div className="fixed bottom-0 inset-x-0 z-30 p-4 sm:p-5 bg-obsidian-950/85 backdrop-blur-xl border-t border-slate-800/80 shadow-2xl">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Computed Cumulative State */}
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start space-x-4">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  {t('join.total')} ({selectedServiceIds.length} {isGujarati ? 'સેવા' : 'services'})
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-mono font-bold text-gold-300">
                    ₹{totalPrice}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    • {totalDurationMin} {t('home.mins')}
                  </span>
                </div>
              </div>

              <div className="border-l border-slate-800 pl-4">
                <span className="text-[11px] text-slate-400 block font-medium">
                  {t('join.expectedWait')}
                </span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  {estWaitMin === 0 ? '0 min' : `~${estWaitMin} min`}
                </span>
              </div>
            </div>

            {/* Confirm & Join Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting || selectedServiceIds.length === 0}
              whileHover={{ scale: isSubmitting || selectedServiceIds.length === 0 ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting || selectedServiceIds.length === 0 ? 1 : 0.98 }}
              transition={springSnappy}
              className={`w-full sm:w-auto min-h-[50px] px-8 py-3 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-glow-gold transition-all duration-200 ${
                isSubmitting || selectedServiceIds.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-obsidian-950'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-obsidian-950" />
                  <span>{t('join.submitting')}</span>
                </>
              ) : (
                <span>{t('join.confirm')} →</span>
              )}
            </motion.button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default JoinQueuePage;
