import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const chemists = await prisma.chemist.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ chemists });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.city) {
    return NextResponse.json({ error: "Name and city are required." }, { status: 400 });
  }

  const chemist = await prisma.chemist.create({
    data: {
      name: body.name,
      ownerName: body.ownerName ?? "",
      city: body.city,
      area: body.area ?? "",
      address: body.address ?? "",
      phone: body.phone ?? "",
      email: body.email ?? "",
      gstNumber: body.gstNumber ?? "",
      stockistId: body.stockistId ?? null,
      tier: body.tier ?? "silver",
    },
  });

  return NextResponse.json({ chemist }, { status: 201 });
}
