export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePassword = (pw) => pw && pw.length >= 8;
export const validateRequired = (val) => val && val.trim().length > 0;
export const validatePositiveNumber = (val) => !isNaN(val) && parseFloat(val) >= 0;
export const validateDateOrder = (start, end) => {
  if (!start || !end) return false;
  const [y1, m1, d1] = start.split('-');
  const [y2, m2, d2] = end.split('-');
  return new Date(+y2, +m2 - 1, +d2) >= new Date(+y1, +m1 - 1, +d1);
};

// Canonical enum constants — match backend exactly
export const EXPENSE_CATEGORIES = ['transport', 'stay', 'activities', 'meals', 'misc'];
export const TRIP_STATUSES      = ['upcoming', 'ongoing', 'completed'];
export const SECTION_TYPES      = ['travel', 'hotel', 'activity', 'general'];
export const SORT_OPTIONS       = [
  { value: 'created_at', label: 'Newest' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'title',      label: 'Name' },
];
