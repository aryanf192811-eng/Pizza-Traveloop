export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);
};

// CRITICAL: parse date as local time, NOT UTC, to avoid off-by-one day in IST
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

export const formatDateInput = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${y}-${m}-${d}`;
};

export const getDayCount = (start, end) => {
  if (!start || !end) return 1;
  const [y1, m1, d1] = start.split('T')[0].split('-');
  const [y2, m2, d2] = end.split('T')[0].split('-');
  const diff = new Date(+y2, +m2 - 1, +d2) - new Date(+y1, +m1 - 1, +d1);
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
};

export const getStatusColor = (status) => {
  const map = { upcoming: 'badge-blue', ongoing: 'badge-green', completed: 'badge-gray' };
  return map[status] || 'badge-gray';
};

export const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};
