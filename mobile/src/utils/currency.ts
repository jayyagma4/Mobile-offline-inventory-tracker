export function formatPHP(value: number, options: Intl.NumberFormatOptions = {}) {
  const opts: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };
  const num = Number.isFinite(value) ? value : 0;
  return `₱${num.toLocaleString('en-PH', opts)}`;
}
