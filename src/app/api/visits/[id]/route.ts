import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const visit = await prisma.visit.findUnique({ where: { id }, include: { products: true } });
  if (!visit) return NextResponse.json({ error: "Visit not found." }, { status: 404 });

  return NextResponse.json({
    visit: {
      ...visit,
      products: visit.products.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        sampleQuantity: p.sampleQuantity,
        recommendationLevel: p.recommendationLevel,
      })),
    },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.partyType || !body?.partyId || !body?.partyName || !body?.visitDate || !body?.visitTime) {
    return NextResponse.json({ error: "Missing required visit fields." }, { status: 400 });
  }
  if (!Array.isArray(body.products) || body.products.length === 0) {
    return NextResponse.json({ error: "At least one product is required." }, { status: 400 });
  }

  const visit = await prisma.visit.update({
    where: { id },
    data: {
      partyType: body.partyType,
      partyId: body.partyId,
      partyName: body.partyName,
      visitDate: body.visitDate,
      visitTime: body.visitTime,
      visitType: body.visitType ?? "new",
      city: body.city ?? "",
      feedback: body.feedback ?? "",
      competitorProducts: body.competitorProducts ?? "",
      marketFeedback: body.marketFeedback ?? "",
      overallRecommendation: body.overallRecommendation ?? "moderate",
      hasPersonalOrder: body.hasPersonalOrder ?? false,
      orderProducts: body.orderProducts ?? [],
      products: {
        deleteMany: {},
        create: body.products.map((p: { productId: string; productName: string; sampleQuantity: number; recommendationLevel: string }) => ({
          productId: p.productId,
          productName: p.productName,
          sampleQuantity: p.sampleQuantity ?? 0,
          recommendationLevel: p.recommendationLevel ?? "moderate",
        })),
      },
    },
    include: { products: true },
  });

  return NextResponse.json({
    visit: {
      ...visit,
      products: visit.products.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        sampleQuantity: p.sampleQuantity,
        recommendationLevel: p.recommendationLevel,
      })),
    },
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  await prisma.visit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
