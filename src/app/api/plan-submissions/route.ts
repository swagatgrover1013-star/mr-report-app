import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month) return NextResponse.json({ error: "Month is required." }, { status: 400 });

  const isManager = user.role === "admin" || user.role === "manager";
  const userId = isManager ? (searchParams.get("userId") ?? user.id) : user.id;

  const submission = await prisma.planSubmission.findUnique({ where: { userId_month: { userId, month } } });
  if (!submission) {
    return NextResponse.json({ submission: { id: "", userId, month, status: "draft", submittedAt: null, approvedAt: null, approvedBy: "" } });
  }
  return NextResponse.json({ submission });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.month) return NextResponse.json({ error: "Month is required." }, { status: 400 });

  const isManager = user.role === "admin" || user.role === "manager";
  const userId = isManager && body.userId ? body.userId : user.id;

  const submission = await prisma.planSubmission.upsert({
    where: { userId_month: { userId, month: body.month } },
    update: { status: "submitted", submittedAt: new Date() },
    create: { userId, month: body.month, status: "submitted", submittedAt: new Date() },
  });
  return NextResponse.json({ submission });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "manager") {
    return NextResponse.json({ error: "Only managers and admins can approve plans." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.month || !body?.userId || body.status !== "approved") {
    return NextResponse.json({ error: "Month, userId, and status 'approved' are required." }, { status: 400 });
  }

  const submission = await prisma.planSubmission.upsert({
    where: { userId_month: { userId: body.userId, month: body.month } },
    update: { status: "approved", approvedAt: new Date(), approvedBy: user.name },
    create: { userId: body.userId, month: body.month, status: "approved", approvedAt: new Date(), approvedBy: user.name },
  });
  return NextResponse.json({ submission });
}
