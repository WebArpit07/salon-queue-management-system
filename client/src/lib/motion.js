/**
 * Apple OS-inspired spring physics presets & micro-interaction variants
 */

export const springSmooth = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
  mass: 1,
};

export const springSnappy = {
  type: 'spring',
  stiffness: 450,
  damping: 32,
  mass: 0.8,
};

export const springBouncy = {
  type: 'spring',
  stiffness: 400,
  damping: 22,
  mass: 0.9,
};

export const springSubtle = {
  type: 'spring',
  stiffness: 180,
  damping: 24,
};

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0.05) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSmooth,
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springSmooth,
  },
};

export const cardHoverMotion = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.015,
    y: -3,
    transition: springSnappy,
  },
  tap: {
    scale: 0.985,
    y: 0,
    transition: springSnappy,
  },
};
