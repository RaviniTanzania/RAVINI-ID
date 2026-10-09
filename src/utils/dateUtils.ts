// RAVINI - Unified Date & Time Formatter with Full Seconds Precision
// Output format: DD/MM/YYYY HH:mm:ss (e.g. 06/10/2026 21:47:32)
// Timezone: Africa/Dar_es_Salaam (UTC+3)

export function formatDateTimeSeconds(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Dar_es_Salaam',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return formatter.format(d).replace(',', '');
  } catch {
    return String(dateInput);
  }
}

export function formatDateOnly(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Dar_es_Salaam',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return formatter.format(d);
  } catch {
    return String(dateInput);
  }
}

export interface DarDateParts {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
}

export function getDarDate(d: Date = new Date()): DarDateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Dar_es_Salaam',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  });
  const parts = formatter.formatToParts(d);
  let year = d.getUTCFullYear();
  let month = d.getUTCMonth() + 1;
  let day = d.getUTCDate();
  for (const part of parts) {
    if (part.type === 'year') year = parseInt(part.value, 10);
    if (part.type === 'month') month = parseInt(part.value, 10);
    if (part.type === 'day') day = parseInt(part.value, 10);
  }
  const weekdayStr = parts.find(p => p.type === 'weekday')?.value || '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = days.indexOf(weekdayStr) >= 0 ? days.indexOf(weekdayStr) : d.getDay();
  return { year, month, day, dayOfWeek };
}

export function isDateInDarWindow(
  dateInput: string | number | Date | null | undefined,
  window: 'LEO' | 'WIKI' | 'MWEZI' | 'YOTE'
): boolean {
  if (window === 'YOTE') return true;
  if (!dateInput) return false;
  const targetDate = new Date(dateInput);
  if (isNaN(targetDate.getTime())) return false;

  const now = new Date();
  const darNow = getDarDate(now);
  const darTarget = getDarDate(targetDate);

  if (window === 'LEO') {
    return (
      darTarget.year === darNow.year &&
      darTarget.month === darNow.month &&
      darTarget.day === darNow.day
    );
  }

  if (window === 'MWEZI') {
    return darTarget.year === darNow.year && darTarget.month === darNow.month;
  }

  if (window === 'WIKI') {
    // Current week in Dar es Salaam (Monday 00:00:00 to Sunday 23:59:59)
    const darTargetUtcMs = targetDate.getTime() + 3 * 3600 * 1000;
    const darNowUtcMs = now.getTime() + 3 * 3600 * 1000;
    const darTargetDayIndex = Math.floor(darTargetUtcMs / (24 * 3600 * 1000));
    const darNowDayIndex = Math.floor(darNowUtcMs / (24 * 3600 * 1000));
    const daysSinceMonday = darNow.dayOfWeek === 0 ? 6 : darNow.dayOfWeek - 1;
    const mondayDayIndex = darNowDayIndex - daysSinceMonday;
    const sundayDayIndex = mondayDayIndex + 6;
    return darTargetDayIndex >= mondayDayIndex && darTargetDayIndex <= sundayDayIndex;
  }

  return true;
}
