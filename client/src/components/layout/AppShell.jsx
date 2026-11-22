import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Radio,
  Tv,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Menu,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useQueue } from '../../context/QueueContext';
import LanguageToggle from '../ui/LanguageToggle';
import SalonLogo from '../ui/SalonLogo';

/**
 * Airy, high-whitespace luxury application shell with ambient top navigation
 * Styled in warm obsidian with champagne gold accents
 */
export const AppShell = ({ children }) => {
  const { t, isGujarati } = useLanguage();
  const { isConnected } = useQueue();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: Sparkles },
    { to: '/join', label: t('nav.join'), icon: Scissors },
    { to: '/reception', label: t('nav.reception'), icon: UserCheck },
    { to: '/barber/ravi', label: t('nav.barber'), icon: Radio },
    { to: '/display', label: t('nav.display'), icon: Tv },
    { to: '/admin', label: t('nav.admin'), icon: ShieldAlert },
  ];

  // Full-Screen TV Viewport Bypass
  if (location.pathname === '/display') {
    return (
      <div className="min-h-screen w-full bg-[#0A0D0C] text-slate-100 font-sans selection:bg-gold-500 selection:text-obsidian-950 overflow-x-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950 text-slate-100 selection:bg-gold-500 selection:text-obsidian-950 font-sans">
      {/* Top Ambient Glow Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />

      {/* Top Utility Framing Bar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Identity */}
          <Link to="/" className="flex items-center space-x-3.5 group min-h-[44px] shrink-0">
            {/* Bespoke Barber Face Silhouette Logo Badge */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-amber-600 p-1 flex items-center justify-center shadow-glow-gold transition-transform duration-300 group-hover:scale-105 shrink-0 border border-gold-300/40">
              <SalonLogo className="w-7 h-7 sm:w-8 sm:h-8 text-obsidian-950 drop-shadow-sm" />
            </div>

            {/* Typography Lockup: Modern Luxury English + Refined Gujarati */}
            <div className="flex flex-col justify-center whitespace-nowrap">
              <div className="flex items-center gap-2 whitespace-nowrap">
                {/* English Name with Distinctive Luxury Weighting */}
                <span className="font-sans font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-gold-200 transition-colors whitespace-nowrap">
                  Studio Kashi <span className="text-gold-400 font-semibold">Salon</span>
                </span>

                {/* Vertical Accent Divider */}
                <span className="hidden sm:inline-block w-[1.5px] h-3.5 bg-gold-500/40 rounded-full" />

                {/* Gujarati Name with Native Font & Elegant Glass Pill */}
                <span className="hidden sm:inline-block font-gujarati font-bold text-xs sm:text-[13px] tracking-normal text-gold-300 bg-gold-500/10 border border-gold-500/25 px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                  સ્ટુડિયો કાશી સલૂન
                </span>
              </div>

              {/* Tagline / Subtitle */}
              <p className="text-[11px] text-slate-400 hidden lg:flex items-center gap-1.5 font-light leading-tight mt-0.5 whitespace-nowrap">
                <span className="w-1 h-1 rounded-full bg-gold-400/80 inline-block" />
                <span>{t('brand.tagline')}</span>
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.to ||
                (link.to.startsWith('/barber') && location.pathname.startsWith('/barber'));
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-800/90 text-gold-300 border border-gold-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold-400' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Utilities: Live Status & Language Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Socket Status Indicator */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium glass-pill border transition-colors ${
                isConnected
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
                  : 'border-slate-800 text-slate-400 bg-slate-900/40'
              }`}
              title={isConnected ? t('system.connected') : t('system.offline')}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? 'bg-emerald-400 shadow-glow-emerald animate-pulse-slow'
                    : 'bg-slate-500'
                }`}
              />
              <span className="hidden sm:inline text-[11px]">
                {isConnected ? t('system.connected') : t('system.offline')}
              </span>
            </div>

            {/* Language Toggle Pill */}
            <LanguageToggle />

            {/* Mobile Menu Toggle Button (44px min tap zone) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden px-4 pt-2 pb-4 border-t border-slate-800/80 bg-obsidian-900/98 backdrop-blur-xl space-y-1 overflow-hidden"
            >
              {navLinks.map((link) => {
                const isActive =
                  location.pathname === link.to ||
                  (link.to.startsWith('/barber') && location.pathname.startsWith('/barber'));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-gold-300 border border-gold-500/30'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-gold-400" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>

      {/* Non-intrusive Luxury Footer */}
      <footer className="border-t border-slate-900/90 py-6 px-4 text-center text-xs text-slate-500 font-light bg-obsidian-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {t('brand.name')} • {t('brand.tagline')}</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              {t('system.healthOk')}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
