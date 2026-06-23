"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useVisit } from "@/lib/hooks/use-visits";
import { useDoctors } from "@/lib/hooks/use-doctors";
import { useChemists } from "@/lib/hooks/use-chemists";
import { useStockists } from "@/lib/hooks/use-stockists";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  Package,
  MessageSquare,
  CalendarClock,
  Pencil,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { motion } from "framer-motion";

const feedbackLabel = {
  doctor: { section: "Doctor Feedback", response: "Doctor Response" },
  chemist: { section: "Chemist Feedback", response: "Chemist Response" },
  stockist: { section: "Stockist Feedback", response: "Stockist Response" },
  meeting: { section: "Feedback", response: "Response" },
} as const;

export default function VisitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { visit, loading } = useVisit(params.id as string);
  const { doctors } = useDoctors();
  const { chemists } = useChemists();
  const { stockists } = useStockists();

  const party = visit
    ? visit.partyType === "doctor"
      ? doctors.find((d) => d.id === visit.partyId)
      : visit.partyType === "chemist"
      ? chemists.find((c) => c.id === visit.partyId)
      : stockists.find((s) => s.id === visit.partyId)
    : undefined;

  const partySubtitle = visit
    ? visit.partyType === "doctor" && party && "specialization" in party
      ? `${party.specialization} · ${party.hospital}`
      : party && "ownerName" in party
      ? `${party.ownerName} · ${party.area}, ${party.city}`
      : ""
    : "";

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8 text-slate-light gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading visit...
        </div>
      </AppShell>
    );
  }

  if (!visit) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-ink font-medium">Visit not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/visits")}>
              Back to Visit Reports
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar title="Visit Report" subtitle={visit.partyName} />

      <div className="flex-1 p-5 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push("/visits")}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/visits/new?editId=${visit.id}`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden">
              <div className="bg-gradient-indigo px-6 lg:px-8 py-7 text-porcelain relative">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white opacity-15 blur-3xl" />
                <div className="flex items-start justify-between gap-4 relative">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-porcelain/60 mb-1.5">Visit Report</p>
                    <h2 className="font-display text-2xl">{visit.partyName}</h2>
                    <p className="text-sm text-porcelain/70 mt-1">{partySubtitle}</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 lg:p-8 space-y-7">
                {/* Meta info */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-indigo mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate">Date</p>
                      <p className="text-sm font-medium text-ink">{format(new Date(visit.visitDate), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-indigo mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate">Time</p>
                      <p className="text-sm font-medium text-ink">{visit.visitTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-indigo mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate">City</p>
                      <p className="text-sm font-medium text-ink">{visit.city}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Stethoscope className="h-4 w-4 text-indigo mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate">Visit Type</p>
                      <p className="text-sm font-medium text-ink capitalize">{visit.visitType.replace("_", " ")}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Products */}
                <div>
                  <div className="flex items-center gap-2 mb-3.5">
                    <Package className="h-4 w-4 text-indigo" />
                    <h3 className="text-sm font-semibold text-ink">Products Discussed</h3>
                  </div>
                  <div className="space-y-2.5">
                    {visit.products.map((p) => (
                      <div key={p.productId} className="flex items-center justify-between gap-3 rounded-(--radius) bg-porcelain-dim p-3.5">
                        <div>
                          <p className="text-sm font-medium text-ink">{p.productName}</p>
                          <p className="text-xs text-slate mt-0.5">{p.sampleQuantity} samples given</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Personal Order Booking */}
                {visit.hasPersonalOrder && (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-3.5">
                        <ShoppingCart className="h-4 w-4 text-indigo" />
                        <h3 className="text-sm font-semibold text-ink">Personal Order Booking</h3>
                      </div>
                      <div className="space-y-2.5">
                        {visit.orderProducts.map((o) => (
                          <div key={o.productId} className="flex items-center justify-between gap-3 rounded-(--radius) bg-porcelain-dim p-3.5">
                            <p className="text-sm font-medium text-ink">{o.productName}</p>
                            <p className="text-xs text-slate">{o.units} units ordered</p>
                          </div>
                        ))}
                        {visit.orderProducts.length === 0 && (
                          <p className="text-sm text-slate-light">No ordered products recorded.</p>
                        )}
                      </div>
                    </div>

                    <Separator />
                  </>
                )}

                {/* Feedback */}
                <div>
                  <div className="flex items-center gap-2 mb-3.5">
                    <MessageSquare className="h-4 w-4 text-indigo" />
                    <h3 className="text-sm font-semibold text-ink">{feedbackLabel[visit.partyType].section}</h3>
                  </div>
                  <div className="space-y-3.5">
                    <div>
                      <p className="text-xs text-slate mb-1">{feedbackLabel[visit.partyType].response}</p>
                      <p className="text-sm text-ink-soft leading-relaxed">{visit.feedback}</p>
                    </div>
                    {visit.competitorProducts && visit.competitorProducts !== "None mentioned" && (
                      <div>
                        <p className="text-xs text-slate mb-1">Competitor Products Mentioned</p>
                        <Badge variant="outline">{visit.competitorProducts}</Badge>
                      </div>
                    )}
                    {visit.marketFeedback && (
                      <div>
                        <p className="text-xs text-slate mb-1">Market Feedback</p>
                        <p className="text-sm text-ink-soft leading-relaxed">{visit.marketFeedback}</p>
                      </div>
                    )}
                  </div>
                </div>

                {visit.nextFollowupDate && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-3.5">
                        <CalendarClock className="h-4 w-4 text-indigo" />
                        <h3 className="text-sm font-semibold text-ink">Follow-up</h3>
                      </div>
                      <div className="flex items-center justify-between rounded-(--radius) bg-porcelain-dim p-3.5">
                        <div>
                          <p className="text-sm font-medium text-ink">{format(new Date(visit.nextFollowupDate), "MMM d, yyyy")}</p>
                          {visit.followUpNotes && <p className="text-xs text-slate mt-0.5">{visit.followUpNotes}</p>}
                        </div>
                        <Badge variant={visit.followUpStatus === "completed" ? "default" : visit.followUpStatus === "missed" ? "rose" : "brass"}>
                          {visit.followUpStatus}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
