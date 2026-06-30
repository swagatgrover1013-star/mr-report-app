import { prisma } from "@/lib/db";
import { isMonthLocked } from "@/lib/plan-lock";

/** Same as isMonthLocked, but a manager's manual unlock for this rep+month overrides it. */
export async function isMonthLockedForUser(month: string, mrId: string, now: Date = new Date()): Promise<boolean> {
  if (!isMonthLocked(month, now)) return false;
  const submission = await prisma.planSubmission.findUnique({ where: { userId_month: { userId: mrId, month } } });
  return !submission?.unlockedByAdmin;
}
