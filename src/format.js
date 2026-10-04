const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

export const formatNaira = (n) => naira.format(n);

export const initials = (name) =>
  (name || 'IN')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** "Today", "Yesterday", weekday within the last week, otherwise "30 Sep" (viewer's local time). */
export function relativeDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-NG', { weekday: 'short' });
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}
