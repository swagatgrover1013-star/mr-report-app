const SUBMISSION_DAY = 27;

/** A month "YYYY-MM" locks for the rep on the SUBMISSION_DAY of the month before it. */
export function lockDateForMonth(month: string): Date {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(year, monthNum - 2, SUBMISSION_DAY);
}

export function isMonthLocked(month: string, now: Date = new Date()): boolean {
  return now >= lockDateForMonth(month);
}
