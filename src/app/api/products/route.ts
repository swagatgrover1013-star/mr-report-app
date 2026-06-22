import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      category: body.category ?? "General",
      brand: body.brand ?? "",
      strength: body.strength ?? "—",
      dosageForm: body.dosageForm ?? "—",
      description: body.description ?? "",
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
