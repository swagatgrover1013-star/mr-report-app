import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { PartyType } from "@/types";

function shapeVisit<T extends { products: { productId: string; productName: string; sampleQuantity: number; recommendationLevel: string }[] }>(v: T) {
  return {
    ...v,
    products: v.products.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      sampleQuantity: p.sampleQuantity,
      recommendationLevel: p.recommendationLevel,
    })),
  };
}

async function bumpPartyStats(partyType: PartyType, partyId: string, visitDate: string) {
  const model = partyType === "doctor" ? prisma.doctor : partyType === "chemist" ? prisma.chemist : prisma.stockist;
  const current = await (model as typeof prisma.doctor).findUnique({ where: { id: partyId } });
  if (!current) return;
  const newLastVisit = !current.lastVisitDate || visitDate > current.lastVisitDate ? visitDate : current.lastVisitDate;
  await (model as typeof prisma.doctor).update({
    where: { id: partyId },
    data: { totalVisits: current.totalVisits + 1, lastVisitDate: newLastVisit },
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const visits = await prisma.visit.findMany({
    include: { products: true },
    orderBy: { visitDate: "desc" },
  });
  return NextResponse.json({ visits: visits.map(shapeVisit) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.partyType || !body?.partyId || !body?.partyName || !body?.visitDate || !body?.visitTime) {
    return NextResponse.json({ error: "Missing required visit fields." }, { status: 400 });
  }
  if (!Array.isArray(body.products) || body.products.length === 0) {
    return NextResponse.json({ error: "At least one product is required." }, { status: 400 });
  }

  const visit = await prisma.visit.create({
    data: {
      partyType: body.partyType,
      partyId: body.partyId,
      partyName: body.partyName,
      mrId: user.id,
      mrName: user.name,
      visitDate: body.visitDate,
      visitTime: body.visitTime,
      visitType: body.visitType ?? "new",
      city: body.city ?? "",
      feedback: body.feedback ?? "",
      competitorProducts: body.competitorProducts ?? "",
      marketFeedback: body.marketFeedback ?? "",
      nextFollowupDate: body.nextFollowupDate ?? null,
      followUpStatus: "pending",
      followUpNotes: body.followUpNotes ?? "",
      overallRecommendation: body.overallRecommendation ?? "moderate",
      hasPersonalOrder: body.hasPersonalOrder ?? false,
      orderProducts: body.orderProducts ?? [],
      products: {
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

  await bumpPartyStats(body.partyType, body.partyId, body.visitDate);

  return NextResponse.json({ visit: shapeVisit(visit) }, { status: 201 });
}
