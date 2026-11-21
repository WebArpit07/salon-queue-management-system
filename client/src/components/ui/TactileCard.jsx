import React from 'react';
import { motion } from 'framer-motion';
import { cardHoverMotion } from '../../lib/motion';

/**
 * Minimalist glass/surface card with subtle spring hover & tap physics
 */
export const TactileCard = ({
  children,
  className = '',
  onClick,
  hoverable = true,
  variant = 'glass', // 'glass' | 'surface' | 'bordered'
  ...props
}) => {
  const variantStyles = {
    glass: 'glass-card text-slate-100',
    surface: 'bg-obsidian-900 border border-slate-800 text-slate-100 shadow-xl',
    bordered: 'bg-obsidian-850/80 border border-gold-500/20 text-slate-100',
  };

  const interactive = Boolean(onClick) || hoverable;

  return (
    <motion.div
      variants={interactive ? cardHoverMotion : undefined}
      initial={interactive ? 'rest' : undefined}
      whileHover={interactive ? 'hover' : undefined}
      whileTap={interactive ? 'tap' : undefined}
      onClick={onClick}
      className={`relative rounded-2xl p-6 transition-colors duration-200 ${
        variantStyles[variant] || variantStyles.glass
      } ${interactive ? 'cursor-pointer select-none' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default TactileCard;
