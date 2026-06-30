const WINDOW_OPEN_DAY = 20;
const WINDOW_CLOSE_DAY = 27;
const WINDOW_CLOSE_HOUR = 12;

/** A month "YYYY-MM" can start being planned on the 20th of the month before it. */
export function windowOpenDateForMonth(month: string): Date {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(year, monthNum - 2, WINDOW_OPEN_DAY, 0, 0, 0);
}

/** A month "YYYY-MM" locks for the rep at noon on the 27th of the month before it. */
export function lockDateForMonth(month: string): Date {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(year, monthNum - 2, WINDOW_CLOSE_DAY, WINDOW_CLOSE_HOUR, 0, 0);
}

export function isMonthLocked(month: string, now: Date = new Date()): boolean {
  return now < windowOpenDateForMonth(month) || now >= lockDateForMonth(month);
}
