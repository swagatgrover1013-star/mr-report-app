import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const canSeeAll = user.role === "admin" || user.role === "manager";
  const leaves = await prisma.leave.findMany({
    where: canSeeAll ? {} : { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ leaves });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.leaveType || !body?.fromDate || !body?.toDate || !body?.reason) {
    return NextResponse.json({ error: "Leave type, dates, and reason are required." }, { status: 400 });
  }
  if (body.toDate < body.fromDate) {
    return NextResponse.json({ error: "End date must be on or after the start date." }, { status: 400 });
  }

  const leave = await prisma.leave.create({
    data: {
      userId: user.id,
      userName: user.name,
      leaveType: body.leaveType,
      fromDate: body.fromDate,
      toDate: body.toDate,
      reason: body.reason,
    },
  });

  return NextResponse.json({ leave }, { status: 201 });
}
