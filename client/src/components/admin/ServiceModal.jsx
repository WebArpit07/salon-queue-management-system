import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Scissors, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../lib/api';
import { springSnappy } from '../../lib/motion';

export const ServiceModal = ({ isOpen, onClose, serviceToEdit, onSuccess }) => {
  const { t, isGujarati } = useLanguage();

  const [nameEn, setNameEn] = useState('');
  const [nameGu, setNameGu] = useState('');
  const [durationMin, setDurationMin] = useState(30);
  const [price, setPrice] = useState(150);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (serviceToEdit) {
      setNameEn(serviceToEdit.nameEn || '');
      setNameGu(serviceToEdit.nameGu || '');
      setDurationMin(serviceToEdit.durationMin || 30);
      setPrice(serviceToEdit.price || 150);
    } else {
      setNameEn('');
      setNameGu('');
      setDurationMin(30);
      setPrice(150);
    }
    setErrorMsg('');
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nameEn.trim()) {
      setErrorMsg('English service name is required');
      return;
    }
    if (!nameGu.trim()) {
      setErrorMsg('Gujarati service name is required');
      return;
    }
    if (Number(durationMin) < 5) {
      setErrorMsg('Duration must be at least 5 minutes');
      return;
    }
    if (Number(price) < 0) {
      setErrorMsg('Price cannot be negative');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (serviceToEdit) {
        await api.patch(`/api/admin/services/${serviceToEdit._id}`, {
          nameEn: nameEn.trim(),
          nameGu: nameGu.trim(),
          durationMin: Number(durationMin),
          price: Number(price),
        });
      } else {
        await api.post('/api/admin/services', {
          nameEn: nameEn.trim(),
          nameGu: nameGu.trim(),
          durationMin: Number(durationMin),
          price: Number(price),
          isActive: true,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save service');
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
        className="w-full max-w-md rounded-3xl glass-card border border-slate-700 bg-obsidian-900/98 p-6 sm:p-7 space-y-6 shadow-2xl relative select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {serviceToEdit
                  ? t('adminDashboard.modalEditTitle')
                  : t('adminDashboard.modalAddTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                {isGujarati ? 'દ્વિભાષી સેવા વિગત' : 'Bilingual service details'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* English Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              {t('adminDashboard.nameEnLabel')} <span className="text-gold-400">*</span>
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Luxury Beard Grooming"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-obsidian-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-gold-500"
            />
          </div>

          {/* Gujarati Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              {t('adminDashboard.nameGuLabel')} <span className="text-gold-400">*</span>
            </label>
            <input
              type="text"
              value={nameGu}
              onChange={(e) => setNameGu(e.target.value)}
              placeholder="દા.ત. લક્ઝરી દાઢી ગ્રૂમિંગ"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-obsidian-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-gold-500 font-gujarati"
            />
          </div>

          {/* Duration & Price Row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {t('adminDashboard.durationLabel')}
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-obsidian-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-gold-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {t('adminDashboard.priceLabel')}
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-obsidian-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl glass-pill text-xs font-semibold text-slate-400 hover:text-white min-h-[44px]"
            >
              {t('adminDashboard.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-950 font-bold text-xs shadow-glow-gold hover:opacity-90 transition-opacity min-h-[44px] flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('adminDashboard.updating')}</span>
                </>
              ) : (
                <span>{t('adminDashboard.saveServiceBtn')}</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ServiceModal;
