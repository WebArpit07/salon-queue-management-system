/**
 * Pure salon time utility functions using Asia/Kolkata (IST) timezone
 */

/**
 * Returns date key in YYYY-MM-DD format in Asia/Kolkata timezone
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
export const getIstDateKey = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
};

/**
 * Converts a "HH:MM" string to minutes from midnight
 * @param {string} timeStr - e.g. "09:00" or "21:00"
 * @returns {number}
 */
export const parseTimeToMinutes = (timeStr = '00:00') => {
  const [h, m] = (timeStr || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
};

/**
 * Returns current minutes from midnight in Asia/Kolkata timezone
 * @param {Date} date
 * @returns {number}
 */
export const getIstTimeMinutes = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);

  let hours = 0;
  let minutes = 0;
  for (const part of parts) {
    if (part.type === 'hour') hours = parseInt(part.value, 10);
    if (part.type === 'minute') minutes = parseInt(part.value, 10);
  }
  if (hours === 24) hours = 0;

  return hours * 60 + minutes;
};

/**
 * Evaluates whether online queue joining is allowed based on config and IST time
 * @param {object} salonConfig
 * @param {Date} now
 * @returns {{ isOpen: boolean, reason: 'open' | 'manual_closed' | 'before_open' | 'cutoff_closed', closeTimeFormatted: string }}
 */
export const evaluateOnlineJoiningStatus = (salonConfig, now = new Date()) => {
  if (!salonConfig) {
    return {
      isOpen: false,
      reason: 'manual_closed',
      closeTimeFormatted: '21:00',
    };
  }

  const closeTimeFormatted = salonConfig.closeTime || '21:00';

  if (!salonConfig.isQueueOpen) {
    return {
      isOpen: false,
      reason: 'manual_closed',
      closeTimeFormatted,
    };
  }

  const currentMinutes = getIstTimeMinutes(now);
  const openMinutes = parseTimeToMinutes(salonConfig.openTime || '09:00');
  const closeMinutes = parseTimeToMinutes(closeTimeFormatted);
  const cutoffMinutes = closeMinutes - (salonConfig.onlineCutoffMinutes ?? 30);

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      reason: 'before_open',
      closeTimeFormatted,
    };
  }

  if (currentMinutes >= cutoffMinutes) {
    return {
      isOpen: false,
      reason: 'cutoff_closed',
      closeTimeFormatted,
    };
  }

  return {
    isOpen: true,
    reason: 'open',
    closeTimeFormatted,
  };
};

export default {
  getIstDateKey,
  parseTimeToMinutes,
  getIstTimeMinutes,
  evaluateOnlineJoiningStatus,
};
