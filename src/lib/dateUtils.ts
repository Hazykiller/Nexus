import { formatDistanceToNow, format } from 'date-fns';

export function parseNeo4jDate(dateVal: any): Date | null {
  if (!dateVal) return null;
  try {
    let d: Date;
    if (typeof dateVal === 'string' || typeof dateVal === 'number') {
      d = new Date(dateVal);
    } else if (dateVal?.year && dateVal?.month && dateVal?.day) {
      const year = dateVal.year.low ?? dateVal.year;
      const month = (dateVal.month.low ?? dateVal.month) - 1;
      const day = dateVal.day.low ?? dateVal.day;
      const hour = dateVal.hour?.low ?? dateVal.hour ?? 0;
      const min = dateVal.minute?.low ?? dateVal.minute ?? 0;
      const sec = dateVal.second?.low ?? dateVal.second ?? 0;
      d = new Date(year, month, day, hour, min, sec);
    } else {
      d = new Date(dateVal);
    }
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function safeFormatDistance(dateVal: any): string {
  const d = parseNeo4jDate(dateVal);
  if (!d) return '';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function safeTimeFormat(dateVal: any, formatStr: string = 'p'): string {
  const d = parseNeo4jDate(dateVal);
  if (!d) return '';
  try {
    return format(d, formatStr);
  } catch {
    return '';
  }
}
