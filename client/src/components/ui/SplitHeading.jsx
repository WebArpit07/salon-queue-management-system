import React from 'react';
import { motion } from 'framer-motion';
import { springSmooth } from '../../lib/motion';

/**
 * React Bits-inspired kinetic staggered text reveal
 * Splits text into words or characters with spring-driven upward motion
 */
export const SplitHeading = ({
  text,
  as: Component = 'h1',
  className = '',
  delay = 0,
  splitBy = 'words', // 'words' | 'chars'
}) => {
  const tokens = splitBy === 'words' ? text.split(' ') : text.split('');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: splitBy === 'words' ? 0.06 : 0.02,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 18,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: springSmooth,
    },
  };

  return (
    <Component className={`inline-flex flex-wrap gap-x-[0.28em] ${className}`}>
      <motion.span
        className="inline-flex flex-wrap gap-x-[0.28em] items-baseline"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {tokens.map((token, index) => (
          <motion.span
            key={`${token}-${index}`}
            variants={itemVariants}
            className="inline-block transform-gpu"
          >
            {token}
            {splitBy === 'chars' && token === ' ' ? '\u00A0' : ''}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  );
};

export default SplitHeading;
