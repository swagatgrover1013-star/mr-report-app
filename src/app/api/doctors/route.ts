import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const doctors = await prisma.doctor.findMany({
    where: user.role === "mr" ? { assignedMrId: user.id } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ doctors });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.specialization || !body?.city) {
    return NextResponse.json({ error: "Name, specialization, and city are required." }, { status: 400 });
  }

  const doctor = await prisma.doctor.create({
    data: {
      name: body.name,
      specialization: body.specialization,
      hospital: body.hospital ?? "",
      city: body.city,
      area: body.area ?? "",
      address: body.address ?? "",
      phone: body.phone ?? "",
      email: body.email ?? "",
      qualification: body.qualification ?? "",
      visitFrequency: body.visitFrequency ?? "Monthly",
      notes: body.notes ?? "",
      tier: body.tier ?? "silver",
      assignedMrId: user.role === "mr" ? user.id : (body.assignedMrId ?? null),
    },
  });

  return NextResponse.json({ doctor }, { status: 201 });
}
