import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const stockists = await prisma.stockist.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ stockists });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.city) {
    return NextResponse.json({ error: "Name and city are required." }, { status: 400 });
  }

  const stockist = await prisma.stockist.create({
    data: {
      name: body.name,
      ownerName: body.ownerName ?? "",
      city: body.city,
      area: body.area ?? "",
      address: body.address ?? "",
      phone: body.phone ?? "",
      email: body.email ?? "",
      gstNumber: body.gstNumber ?? "",
      monthlyOrderValue: body.monthlyOrderValue ?? 0,
      tier: body.tier ?? "silver",
    },
  });

  return NextResponse.json({ stockist }, { status: 201 });
}
