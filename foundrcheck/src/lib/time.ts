export function getDayWindow(timezone: string = 'America/Los_Angeles'): { start: Date; end: Date } {
  const now = new Date();
  
  // Get start of day in the specified timezone
  const startOfDay = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  startOfDay.setHours(0, 0, 0, 0);
  
  // Get end of day in the specified timezone
  const endOfDay = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  endOfDay.setHours(23, 59, 59, 999);
  
  return {
    start: startOfDay,
    end: endOfDay
  };
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return target.toLocaleDateString();
  }
}