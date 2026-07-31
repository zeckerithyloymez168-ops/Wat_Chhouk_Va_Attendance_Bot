// src/utils.js
// Date and formatting utility helpers for Wat Chhouk Va system

/**
 * Returns current local date in YYYY-MM-DD format based on local timezone
 */
export const getTodayString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
