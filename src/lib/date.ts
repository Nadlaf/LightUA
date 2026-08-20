const DAYS_IN_WEEK = 7;
const ISO_DATE_PARTS = 3;

/** Serialises a Date to "YYYY-MM-DD" using local calendar fields. */
export const toLocalIsoDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * Parses "YYYY-MM-DD" as a local date.
 *
 * `new Date('2026-02-12')` uses the ISO date-only form, which the spec parses as
 * *UTC* midnight. Paired with a local serialiser that would shift the day for
 * anyone west of UTC, so parse and serialise are deliberately kept as a matched
 * pair — using only one of them re-introduces the skew.
 */
export const parseIsoDateLocal = (iso: string): Date => {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const isIsoDate = (value: string): boolean => {
  const parts = value.split('-');
  if (parts.length !== ISO_DATE_PARTS) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toLocalIsoDate(parseIsoDateLocal(value)) === value;
};

/** The Monday-first week containing the given date. Mutates nothing. */
export const buildWeek = (isoDate: string): string[] => {
  const current = parseIsoDateLocal(isoDate);
  const weekDay = current.getDay();
  const mondayDate = current.getDate() - weekDay + (weekDay === 0 ? -(DAYS_IN_WEEK - 1) : 1);
  const monday = new Date(current.getFullYear(), current.getMonth(), mondayDate);

  return Array.from({ length: DAYS_IN_WEEK }, (_, index) =>
    toLocalIsoDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)),
  );
};

/** Renders "YYYY-MM-DD" as "DD.MM.YYYY", or returns the input unchanged. */
export const formatDisplayDate = (isoDate: string): string => {
  const parts = isoDate.split('-');
  if (parts.length !== ISO_DATE_PARTS) return isoDate;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
};
