import { LOCALE_CONFIG } from '../config/constants';

/**
 * Formatea un número como moneda peruana
 */
export function formatCurrency(value: number): string {
  return `${LOCALE_CONFIG.CURRENCY_SYMBOL} ${value.toLocaleString(LOCALE_CONFIG.LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formatea un número como moneda corta (sin decimales)
 */
export function formatCurrencyShort(value: number): string {
  return `${LOCALE_CONFIG.CURRENCY_SYMBOL} ${value.toLocaleString(LOCALE_CONFIG.LOCALE)}`;
}

/**
 * Formatea una fecha en formato corto
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE_CONFIG.LOCALE);
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(LOCALE_CONFIG.LOCALE);
}

/**
 * Formatea una hora en formato HH:MM
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(LOCALE_CONFIG.LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formatea un número grande con sufijos (K, M, B)
 */
export function formatNumberShort(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}
