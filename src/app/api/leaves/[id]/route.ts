import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "manager") {
    return NextResponse.json({ error: "Only managers and admins can review leave requests." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (body?.status !== "approved" && body?.status !== "rejected") {
    return NextResponse.json({ error: "Status must be 'approved' or 'rejected'." }, { status: 400 });
  }

  const leave = await prisma.leave.update({
    where: { id },
    data: {
      status: body.status,
      reviewedBy: user.name,
      reviewNotes: body.reviewNotes ?? "",
    },
  });
  return NextResponse.json({ leave });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const leave = await prisma.leave.findUnique({ where: { id } });
  if (!leave) return NextResponse.json({ error: "Leave request not found." }, { status: 404 });

  const isOwner = leave.userId === user.id;
  if (!isOwner && user.role !== "admin") {
    return NextResponse.json({ error: "You can only withdraw your own leave requests." }, { status: 403 });
  }
  if (isOwner && leave.status !== "pending" && user.role !== "admin") {
    return NextResponse.json({ error: "Only pending requests can be withdrawn." }, { status: 400 });
  }

  await prisma.leave.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
