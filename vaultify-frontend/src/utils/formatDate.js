/**
 * Formats a backend ISO timestamp string into a consistent display format.
 *
 * Output format:  "Jul 17, 2026 • 11:42 AM"  (user local timezone)
 * Fallback:       "Just now"  when dateStr is null/undefined/invalid
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'Just now';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Just now';

  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${datePart} • ${timePart}`;
}
