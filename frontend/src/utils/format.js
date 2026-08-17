// Central place to control the app's currency. Change CURRENCY_CODE to switch
// every amount in the app at once (e.g. 'USD', 'EUR', 'GHS', 'NGN', 'KES').
export const CURRENCY_CODE = 'GHS';
export const CURRENCY_LOCALE = 'en-GH';

export const formatCurrency = (amount) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (amount) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat(CURRENCY_LOCALE).format(value);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatDateInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
};

export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const isPastDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};
