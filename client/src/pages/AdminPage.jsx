import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Users,
  Clock,
  UserX,
  ShieldCheck,
  Radio,
  Tv,
  Power,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import api from '../lib/api';
import StaffPinGate from '../components/auth/StaffPinGate';
import LanguageToggle from '../components/ui/LanguageToggle';
import ServiceModal from '../components/admin/ServiceModal';
import TactileCard from '../components/ui/TactileCard';
import { fadeInUp, staggerContainer, springSnappy } from '../lib/motion';

export const AdminDashboardContent = () => {
  const { t, isGujarati } = useLanguage();
  const { salonConfig, todayStats, barbers, refreshQueueState } = useQueue();

  const [allServices, setAllServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isQueueOpen, setIsQueueOpen] = useState(salonConfig?.isQueueOpen ?? true);
  const [openTime, setOpenTime] = useState(salonConfig?.openTime || '09:00');
  const [closeTime, setCloseTime] = useState(salonConfig?.closeTime || '21:00');
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  // Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync config from QueueContext
  useEffect(() => {
    if (salonConfig) {
      setIsQueueOpen(salonConfig.isQueueOpen ?? true);
      setOpenTime(salonConfig.openTime || '09:00');
      setCloseTime(salonConfig.closeTime || '21:00');
    }
  }, [salonConfig]);

  // Fetch full services catalog (active & inactive)
  const fetchServices = async () => {
    try {
      const res = await api.get('/api/admin/services');
      if (res.data?.services) {
        setAllServices(res.data.services);
      }
    } catch (err) {
      console.warn('[Admin] Failed to fetch services:', err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const showToast = (msg) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // 1. Toggle Queue Open / Closed
  const handleToggleQueueOpen = async () => {
    const nextState = !isQueueOpen;
    setIsQueueOpen(nextState);
    try {
      await api.patch('/api/admin/config', { isQueueOpen: nextState });
      showToast(nextState ? t('adminDashboard.queueOpen') : t('adminDashboard.queueClosed'));
      refreshQueueState();
    } catch (err) {
      setIsQueueOpen(!nextState);
      alert(err.response?.data?.message || 'Failed to update queue state');
    }
  };

  // 2. Save Operating Hours
  const handleSaveHours = async (e) => {
    e.preventDefault();
    setIsSavingHours(true);
    try {
      await api.patch('/api/admin/config', { openTime, closeTime });
      showToast(t('adminDashboard.hoursSavedNotice'));
      refreshQueueState();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save hours');
    } finally {
      setIsSavingHours(false);
    }
  };

  // 3. Toggle Barber Duty
  const handleToggleBarberDuty = async (barber) => {
    const targetDuty = !barber.onDuty;
    try {
      await api.patch(`/api/admin/barbers/${barber.slug}/duty`, { onDuty: targetDuty });
      showToast(
        `${barber.name}: ${targetDuty ? t('adminDashboard.dutyOn') : t('adminDashboard.dutyOff')}`
      );
      refreshQueueState();
    } catch (err) {
      alert(err.response?.data?.message || t('adminDashboard.cannotOffDutyBusy'));
    }
  };

  // 4. Toggle Service Active / Inactive
  const handleToggleServiceActive = async (service) => {
    const targetActive = !service.isActive;
    try {
      await api.patch(`/api/admin/services/${service._id}`, { isActive: targetActive });
      setAllServices((prev) =>
        prev.map((s) => (s._id === service._id ? { ...s, isActive: targetActive } : s))
      );
      refreshQueueState();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update service');
    }
  };

  // 5. Delete Service Confirmation
  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/services/${serviceToDelete._id}`);
      showToast(t('adminDashboard.serviceDeletedNotice'));
      setServiceToDelete(null);
      fetchServices();
      refreshQueueState();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete service');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      variants={staggerContainer(0.06)}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8 select-none pb-24"
    >
      {/* ----------------------------------------------------
          TOP UTILITY HEADER & OWNER BADGE
      ---------------------------------------------------- */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-obsidian-950 flex items-center justify-center shadow-glow-gold">
            <Scissors className="w-6 h-6 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t('adminDashboard.title')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-[10px] font-bold uppercase tracking-wider">
                {t('adminDashboard.ownerBadge')}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              {t('adminDashboard.subtitle')}
            </p>
          </div>
        </div>

        {/* Quick Nav Links + Language Toggle */}
        <div className="flex items-center space-x-2.5">
          <Link
            to="/reception"
            className="px-3 py-2 rounded-xl glass-pill text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 min-h-[44px]"
          >
            <Users className="w-3.5 h-3.5 text-gold-400" />
            <span>{t('nav.reception')}</span>
          </Link>
          <Link
            to="/display"
            className="px-3 py-2 rounded-xl glass-pill text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 min-h-[44px]"
          >
            <Tv className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('nav.display')}</span>
          </Link>
          <LanguageToggle />
        </div>
      </motion.div>

      {/* Global Feedback Notice Toast */}
      <AnimatePresence>
        {feedbackNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------
          SECTION 1: TODAY'S STATS (3-Column Grid)
          Matching Reference Bottom-Right (42 Customers, 28 min, 2 No-shows)
      ---------------------------------------------------- */}
      <motion.div variants={fadeInUp} className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          {t('adminDashboard.todayStatsTitle')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Customers Served */}
          <TactileCard hoverable={false} className="border-slate-800 bg-obsidian-900/80 p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-3xl font-mono font-bold text-white block">
                {todayStats.servedCount || 0}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {t('adminDashboard.customersServedLabel')}
              </span>
            </div>
          </TactileCard>

          {/* 2. Average Wait Time */}
          <TactileCard hoverable={false} className="border-slate-800 bg-obsidian-900/80 p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-3xl font-mono font-bold text-gold-300 block">
                {todayStats.avgWaitMin || 0} <span className="text-sm font-sans font-normal text-slate-400">min</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {t('adminDashboard.avgWait')}
              </span>
            </div>
          </TactileCard>

          {/* 3. No-Shows */}
          <TactileCard hoverable={false} className="border-slate-800 bg-obsidian-900/80 p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <span className="text-3xl font-mono font-bold text-rose-300 block">
                {todayStats.noShowCount || 0}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {t('adminDashboard.noShows')}
              </span>
            </div>
          </TactileCard>
        </div>
      </motion.div>

      {/* ----------------------------------------------------
          SECTION 2: QUEUE CONTROL (Master Switch & Operating Hours)
      ---------------------------------------------------- */}
      <motion.div variants={fadeInUp} className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          {t('adminDashboard.queueControlTitle')}
        </h2>

        <TactileCard hoverable={false} className="border-slate-800 bg-obsidian-900/80 p-6 space-y-6">
          {/* Master Queue Open / Closed Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {isQueueOpen ? t('adminDashboard.queueOpen') : t('adminDashboard.queueClosed')}
              </h3>
              <p className="text-xs text-slate-400 font-light">
                {isGujarati
                  ? 'ઓનલાઇન કતારમાં જોડાવાની સુવિધા સમગ્ર સિસ્ટમમાં સક્રિય અથવા સ્થગિત કરો.'
                  : 'Toggle online customer queue joining across the entire salon floor in real time.'}
              </p>
            </div>

            {/* Tactile Toggle Switch (min 44px tap zone) */}
            <button
              type="button"
              onClick={handleToggleQueueOpen}
              className={`relative inline-flex h-11 w-20 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none min-h-[44px] ${
                isQueueOpen ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-10 w-10 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                  isQueueOpen ? 'translate-x-9 text-emerald-600' : 'translate-x-0 text-slate-500'
                }`}
              >
                <Power className="w-4 h-4 stroke-[2.5]" />
              </span>
            </button>
          </div>

          {/* Operating Hours Form */}
          <form onSubmit={handleSaveHours} className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {t('adminDashboard.operatingHours')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">
                  {t('adminDashboard.openTime')}
                </label>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-obsidian-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">
                  {t('adminDashboard.closeTime')} (Cutoff: 30m prior)
                </label>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-obsidian-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-gold-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingHours}
                className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                {isSavingHours ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-gold-400" />
                    <span>{t('adminDashboard.saveHours')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </TactileCard>
      </motion.div>

      {/* ----------------------------------------------------
          SECTION 3: BARBER ON-DUTY (Matching Reference Roster)
      ---------------------------------------------------- */}
      <motion.div variants={fadeInUp} className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          {t('adminDashboard.barberOnDutyTitle')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {barbers.map((barber) => (
            <TactileCard
              key={barber.slug}
              hoverable={false}
              className="border-slate-800 bg-obsidian-900/80 p-5 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-obsidian-900 border border-slate-700 flex items-center justify-center font-serif text-lg font-bold text-gold-400 shadow-inner shrink-0">
                  {barber.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {barber.name}
                  </h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                      barber.onDuty
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {barber.onDuty ? t('adminDashboard.dutyOn') : t('adminDashboard.dutyOff')}
                  </span>
                </div>
              </div>

              {/* Duty Toggle Button (44px min tap zone) */}
              <button
                type="button"
                onClick={() => handleToggleBarberDuty(barber)}
                className={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none min-h-[44px] items-center ${
                  barber.onDuty ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    barber.onDuty ? 'translate-x-7 text-emerald-600' : 'translate-x-0.5 text-slate-400'
                  }`}
                >
                  <Power className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
              </button>
            </TactileCard>
          ))}
        </div>
      </motion.div>

      {/* ----------------------------------------------------
          SECTION 4: SERVICES MANAGEMENT (Full Active/Inactive Catalog)
      ---------------------------------------------------- */}
      <motion.div variants={fadeInUp} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            {t('adminDashboard.servicesManagementTitle')}
          </h2>

          <button
            type="button"
            onClick={() => {
              setServiceToEdit(null);
              setIsServiceModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-bold text-xs flex items-center gap-1.5 shadow-glow-gold transition-all min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('adminDashboard.addServiceBtn')}</span>
          </button>
        </div>

        {/* Services List Card */}
        <TactileCard hoverable={false} className="border-slate-800 bg-obsidian-900/80 p-5 space-y-3">
          {isLoadingServices ? (
            <div className="py-8 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gold-400" />
            </div>
          ) : allServices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No services found. Click '+ Add Service' to create one.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {allServices.map((service) => (
                <div
                  key={service._id}
                  className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  {/* Service Info */}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm truncate">
                        {service.nameEn}
                      </h4>
                      <span className="text-slate-400 font-gujarati text-xs">
                        · {service.nameGu}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {service.durationMin} {t('common.min')} •{' '}
                      <span className="text-gold-300 font-bold">₹{service.price}</span>
                    </p>
                  </div>

                  {/* Actions: Toggle Active + Edit + Delete (All min 44px) */}
                  <div className="flex items-center space-x-2">
                    {/* Active / Hidden Switch Pill */}
                    <button
                      type="button"
                      onClick={() => handleToggleServiceActive(service)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors min-h-[44px] flex items-center gap-1.5 ${
                        service.isActive
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          service.isActive ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                      <span>
                        {service.isActive
                          ? t('adminDashboard.active')
                          : t('adminDashboard.inactive')}
                      </span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setServiceToEdit(service);
                        setIsServiceModalOpen(true);
                      }}
                      className="w-11 h-11 rounded-xl glass-pill border border-slate-700 hover:border-gold-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                      title={t('adminDashboard.edit')}
                    >
                      <Pencil className="w-4 h-4 text-gold-400" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setServiceToDelete(service)}
                      className="w-11 h-11 rounded-xl glass-pill border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                      title={t('adminDashboard.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TactileCard>
      </motion.div>

      {/* ----------------------------------------------------
          MODALS: Add/Edit Service & Delete Confirmation
      ---------------------------------------------------- */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setServiceToEdit(null);
        }}
        serviceToEdit={serviceToEdit}
        onSuccess={() => {
          showToast(t('adminDashboard.serviceSavedNotice'));
          fetchServices();
          refreshQueueState();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {serviceToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springSnappy}
              className="w-full max-w-sm rounded-3xl glass-card border border-rose-500/30 bg-obsidian-900/98 p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {t('adminDashboard.deleteConfirmTitle').replace('{name}', serviceToDelete.nameEn)}
                </h3>
                <p className="text-xs text-slate-400">
                  {t('adminDashboard.deleteConfirmDesc')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setServiceToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl glass-pill text-xs font-semibold text-slate-300 hover:text-white min-h-[44px]"
                >
                  {t('adminDashboard.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs min-h-[44px] flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{t('adminDashboard.confirmDelete')}</span>
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

export const AdminPage = () => {
  return (
    <StaffPinGate>
      <AdminDashboardContent />
    </StaffPinGate>
  );
};

export default AdminPage;
