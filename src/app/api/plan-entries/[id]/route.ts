import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isMonthLocked } from "@/lib/plan-lock";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.planEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Plan entry not found." }, { status: 404 });

  const isManager = user.role === "admin" || user.role === "manager";
  if (!isManager && existing.mrId !== user.id) {
    return NextResponse.json({ error: "You can only edit your own plan." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const isStatusOnlyUpdate = Object.keys(body).every((k) => k === "visitStatus");
  if (!isManager && !isStatusOnlyUpdate) {
    const month = (body.date ?? existing.date).slice(0, 7);
    if (isMonthLocked(month)) {
      return NextResponse.json({ error: "This month's plan is locked. Ask your manager for changes." }, { status: 403 });
    }
  }

  const data: Record<string, unknown> = {};
  if (body.date !== undefined) data.date = body.date;
  if (body.partyType !== undefined) data.partyType = body.partyType;
  if (body.partyId !== undefined) data.partyId = body.partyId;
  if (body.partyName !== undefined) data.partyName = body.partyName;
  if (body.city !== undefined) data.city = body.city ?? "";
  if (body.area !== undefined) data.area = body.area ?? "";
  if (body.productIds !== undefined) data.productIds = body.productIds ?? [];
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.visitStatus !== undefined) data.visitStatus = body.visitStatus;
  if (body.isJointVisit !== undefined) {
    data.isJointVisit = body.isJointVisit;
    data.jointWithId = body.isJointVisit ? (body.jointWithId ?? "") : "";
    data.jointWithName = body.isJointVisit ? (body.jointWithName ?? "") : "";
  }

  const planEntry = await prisma.planEntry.update({ where: { id }, data });
  return NextResponse.json({ planEntry });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.planEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: true });

  const isManager = user.role === "admin" || user.role === "manager";
  if (!isManager && existing.mrId !== user.id) {
    return NextResponse.json({ error: "You can only delete your own plan." }, { status: 403 });
  }
  if (!isManager && existing.visitStatus === "pending" && isMonthLocked(existing.date.slice(0, 7))) {
    return NextResponse.json({ error: "This month's plan is locked. Ask your manager for changes." }, { status: 403 });
  }

  await prisma.planEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
