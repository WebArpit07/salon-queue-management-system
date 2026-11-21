import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Delete, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../lib/api';
import { fadeInUp, springSnappy } from '../../lib/motion';

/**
 * Reusable Staff PIN unlock gate protecting Reception, Barber, and Admin views
 */
export const StaffPinGate = ({ children }) => {
  const { t, isGujarati } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(sessionStorage.getItem('salon_staff_pin'));
  });
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-lock when 401 invalidates session
  useEffect(() => {
    const handleInvalid = () => {
      setIsAuthenticated(false);
      setPin('');
      setErrorMsg(t('pinGate.invalidPin'));
    };

    window.addEventListener('staff_pin_invalid', handleInvalid);
    return () => window.removeEventListener('staff_pin_invalid', handleInvalid);
  }, [t]);

  // Handle keyboard typing (0-9, Backspace, Enter)
  useEffect(() => {
    if (isAuthenticated) return;

    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 4) {
          handleDigitPress(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (pin.length === 4) {
          verifyPin(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, pin]);

  const handleDigitPress = (digit) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === 4) {
      verifyPin(nextPin);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verifyPin = async (candidatePin) => {
    setIsVerifying(true);
    setErrorMsg('');

    try {
      const res = await api.post('/api/auth/verify-pin', { pin: candidatePin });
      if (res.data?.valid) {
        sessionStorage.setItem('salon_staff_pin', candidatePin);
        setIsAuthenticated(true);
      } else {
        setErrorMsg(t('pinGate.invalidPin'));
        setPin('');
      }
    } catch (err) {
      setErrorMsg(t('pinGate.invalidPin'));
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm p-6 sm:p-8 rounded-3xl glass-card border border-gold-500/30 bg-obsidian-900/95 space-y-6 text-center shadow-glass-subtle relative select-none"
      >
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-obsidian-950 flex items-center justify-center mx-auto shadow-glow-gold">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t('pinGate.title')}
          </h2>
          <p className="text-xs text-slate-400 font-light">
            {t('pinGate.subtitle')}
          </p>
        </div>

        {/* 4-Digit Display Indicator */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = pin.length > index;
            return (
              <motion.div
                key={index}
                animate={{ scale: hasDigit ? [1, 1.25, 1] : 1 }}
                transition={springSnappy}
                className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                  hasDigit
                    ? 'bg-gold-400 border-gold-400 shadow-glow-gold'
                    : 'bg-slate-900 border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error Feedback */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-rose-400 font-medium flex items-center justify-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <motion.button
              key={digit}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={springSnappy}
              onClick={() => handleDigitPress(digit)}
              disabled={isVerifying}
              className="min-h-[52px] rounded-2xl glass-pill border border-slate-800 text-lg font-bold text-white hover:bg-slate-800/80 hover:border-gold-500/40 transition-colors"
            >
              {digit}
            </motion.button>
          ))}

          {/* Clear Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            disabled={isVerifying || pin.length === 0}
            className="min-h-[52px] rounded-2xl glass-pill border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            {t('pinGate.clear')}
          </motion.button>

          {/* 0 Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springSnappy}
            onClick={() => handleDigitPress('0')}
            disabled={isVerifying}
            className="min-h-[52px] rounded-2xl glass-pill border border-slate-800 text-lg font-bold text-white hover:bg-slate-800/80 hover:border-gold-500/40 transition-colors"
          >
            0
          </motion.button>

          {/* Backspace Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackspace}
            disabled={isVerifying || pin.length === 0}
            className="min-h-[52px] rounded-2xl glass-pill border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <Delete className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Demo Hint Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-xs text-gold-400/80 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('pinGate.demoHint')}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default StaffPinGate;
