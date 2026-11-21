import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Scissors, Zap, Clock, Check, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useQueue } from '../../context/QueueContext';
import api from '../../lib/api';
import { springSnappy } from '../../lib/motion';

export const AddWalkInModal = ({ isOpen, onClose, onSuccess }) => {
  const { t, isGujarati } = useLanguage();
  const { services, barbers } = useQueue();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [preferredBarber, setPreferredBarber] = useState('any');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
    setErrorMsg('');
  };

  const toggleService = (serviceId) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
    } else {
      if (selectedServiceIds.length >= 3) {
        setErrorMsg(t('join.errors.maxServices'));
        return;
      }
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
    setErrorMsg('');
  };

  // Compute live cart sums
  const activeSelected = services.filter((s) => selectedServiceIds.includes(s._id));
  const totalDurationMin = activeSelected.reduce((sum, s) => sum + s.durationMin, 0);
  const totalPrice = activeSelected.reduce((sum, s) => sum + s.price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || customerName.trim().length < 2) {
      setErrorMsg(t('join.errors.nameRequired'));
      return;
    }
    if (!phone || phone.length !== 10) {
      setErrorMsg(t('join.errors.phoneRequired'));
      return;
    }
    if (selectedServiceIds.length === 0) {
      setErrorMsg(t('join.errors.serviceRequired'));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post('/api/queue/walkin', {
        customerName: customerName.trim(),
        phone: phone.trim(),
        serviceIds: selectedServiceIds,
        preferredBarber,
      });

      if (onSuccess) {
        onSuccess(res.data.ticket);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add walk-in ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={springSnappy}
        className="w-full max-w-lg rounded-3xl glass-card border border-slate-700 bg-obsidian-900/98 p-6 sm:p-7 space-y-6 shadow-2xl relative select-none max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('walkinModal.title')}</h3>
              <p className="text-xs text-slate-400">{t('walkinModal.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Inputs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {t('walkinModal.customerName')} <span className="text-gold-400">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('walkinModal.namePlaceholder')}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-obsidian-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {t('walkinModal.phone')} <span className="text-gold-400">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                placeholder={t('walkinModal.phonePlaceholder')}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-obsidian-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-gold-500 font-mono"
              />
            </div>
          </div>

          {/* Service Selection Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                {t('walkinModal.selectServices')} <span className="text-gold-400">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedServiceIds.length}/3 selected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {services.map((svc) => {
                const isSelected = selectedServiceIds.includes(svc._id);
                return (
                  <button
                    key={svc._id}
                    type="button"
                    onClick={() => toggleService(svc._id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-colors min-h-[44px] ${
                      isSelected
                        ? 'bg-gold-500/15 border-gold-500 text-white font-semibold'
                        : 'bg-obsidian-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="truncate">{isGujarati ? svc.nameGu : svc.nameEn}</p>
                      <p className="text-[10px] text-slate-400 font-mono">₹{svc.price} • {svc.durationMin}m</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-gold-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barber Assignment / Preference */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              {t('walkinModal.preferredBarber')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPreferredBarber('any')}
                className={`p-2 rounded-xl border text-xs text-center transition-colors min-h-[44px] flex items-center justify-center gap-1 ${
                  preferredBarber === 'any'
                    ? 'bg-gold-500 text-obsidian-950 font-bold border-gold-500'
                    : 'bg-obsidian-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isGujarati ? 'કોઈપણ' : 'Any'}</span>
              </button>

              {barbers.map((b) => (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => setPreferredBarber(b.slug)}
                  className={`p-2 rounded-xl border text-xs text-center transition-colors min-h-[44px] ${
                    preferredBarber === b.slug
                      ? 'bg-gold-500 text-obsidian-950 font-bold border-gold-500'
                      : 'bg-obsidian-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cumulative Total Footer & Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-slate-400">{t('walkinModal.totalPrice')}</p>
              <p className="text-xl font-bold font-mono text-gold-400">
                ₹{totalPrice}{' '}
                <span className="text-xs text-slate-400 font-normal">
                  ({totalDurationMin} min)
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl glass-pill text-xs font-semibold text-slate-400 hover:text-white min-h-[44px]"
              >
                {t('walkinModal.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedServiceIds.length === 0}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs min-h-[44px] flex items-center gap-2 ${
                  isSubmitting || selectedServiceIds.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('walkinModal.adding')}</span>
                  </>
                ) : (
                  <span>{t('walkinModal.addToQueueBtn')}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddWalkInModal;
