import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isMonthLocked } from "@/lib/plan-lock";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get("userId");
  const isManager = user.role === "admin" || user.role === "manager";

  const where = isManager
    ? (requestedUserId ? { mrId: requestedUserId } : {})
    : { mrId: user.id };

  const entries = await prisma.planEntry.findMany({ where, orderBy: { date: "asc" } });
  return NextResponse.json({ planEntries: entries });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.date || !body?.partyType || !body?.partyId || !body?.partyName) {
    return NextResponse.json({ error: "Date and party are required." }, { status: 400 });
  }
  if (body.partyType !== "meeting") {
    if (!body.city) {
      return NextResponse.json({ error: "City is required." }, { status: 400 });
    }
    if (!Array.isArray(body.productIds) || body.productIds.length === 0) {
      return NextResponse.json({ error: "At least one product to target is required." }, { status: 400 });
    }
  }

  const isManager = user.role === "admin" || user.role === "manager";
  const mrId = isManager && body.mrId ? body.mrId : user.id;
  const mrName = isManager && body.mrName ? body.mrName : user.name;

  const month = body.date.slice(0, 7);
  if (!isManager && isMonthLocked(month)) {
    return NextResponse.json({ error: "This month's plan is locked. Ask your manager for changes." }, { status: 403 });
  }

  const entry = await prisma.planEntry.create({
    data: {
      date: body.date,
      partyType: body.partyType,
      partyId: body.partyId,
      partyName: body.partyName,
      city: body.city ?? "",
      area: body.area ?? "",
      productIds: body.productIds ?? [],
      notes: body.notes ?? "",
      mrId,
      mrName,
      isJointVisit: body.isJointVisit ?? false,
      jointWithId: body.isJointVisit ? (body.jointWithId ?? "") : "",
      jointWithName: body.isJointVisit ? (body.jointWithName ?? "") : "",
    },
  });

  return NextResponse.json({ planEntry: entry }, { status: 201 });
}
