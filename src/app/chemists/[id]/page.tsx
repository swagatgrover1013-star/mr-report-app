"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { useChemist } from "@/lib/hooks/use-chemists";
import { useStockists } from "@/lib/hooks/use-stockists";
import { useVisits } from "@/lib/hooks/use-visits";
import { ArrowLeft, Phone, Mail, MapPin, Store, CalendarClock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import Link from "next/link";

const tierStyles = {
  platinum: { label: "Platinum Tier", badge: "ink" as const },
  gold: { label: "Gold Tier", badge: "brass" as const },
  silver: { label: "Silver Tier", badge: "secondary" as const },
};

export default function ChemistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { chemist, loading } = useChemist(params.id as string);
  const { stockists } = useStockists();
  const { visits } = useVisits();
  const chemistVisits = visits.filter((v) => v.partyType === "chemist" && v.partyId === params.id);

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8 text-slate-light gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading chemist...
        </div>
      </AppShell>
    );
  }

  if (!chemist) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-ink font-medium">Chemist not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/doctors?tab=chemist")}>Back to Chemists</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const stockist = stockists.find((s) => s.id === chemist.stockistId);

  const productMentions = new Map<string, number>();
  chemistVisits.forEach((v) => v.products.forEach((p) => productMentions.set(p.productName, (productMentions.get(p.productName) || 0) + 1)));

  const initials = chemist.name.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <AppShell>
      <TopBar title="Chemist Profile" subtitle={chemist.name} />

      <div className="flex-1 p-5 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-5">
          <Button variant="ghost" size="sm" onClick={() => router.push("/doctors?tab=chemist")}>
            <ArrowLeft className="h-4 w-4" /> Back to Chemists
          </Button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarFallback className="text-lg" style={{ background: "var(--indigo)" }}>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="font-display text-2xl text-ink">{chemist.name}</h2>
                      <p className="text-sm text-slate mt-1">{chemist.ownerName}</p>
                    </div>
                    <Badge variant={tierStyles[chemist.tier].badge}>{tierStyles[chemist.tier].label}</Badge>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                    <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-indigo mt-0.5 shrink-0" /><span className="text-sm text-ink-soft">{chemist.area}, {chemist.city}</span></div>
                    <div className="flex items-start gap-2"><Phone className="h-4 w-4 text-indigo mt-0.5 shrink-0" /><span className="text-sm text-ink-soft">{chemist.phone}</span></div>
                    <div className="flex items-start gap-2"><Mail className="h-4 w-4 text-indigo mt-0.5 shrink-0" /><span className="text-sm text-ink-soft truncate">{chemist.email}</span></div>
                    {stockist && (
                      <div className="flex items-start gap-2">
                        <Store className="h-4 w-4 text-indigo mt-0.5 shrink-0" />
                        <span className="text-sm text-ink-soft">
                          Supplied by{" "}
                          <Link href={`/stockists/${stockist.id}`} className="font-medium text-indigo hover:underline">{stockist.name}</Link>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                <div className="text-center">
                  <p className="font-display text-2xl text-ink">{chemist.totalVisits}</p>
                  <p className="text-xs text-slate mt-0.5">Total Visits</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="font-display text-2xl text-ink">{chemist.gstNumber}</p>
                  <p className="text-xs text-slate mt-0.5">GST Number</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl text-ink">{chemist.lastVisitDate ? format(new Date(chemist.lastVisitDate), "MMM d") : "—"}</p>
                  <p className="text-xs text-slate mt-0.5">Last Visit</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Visit History</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="followup">Follow-up</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <Card className="p-6">
                {chemistVisits.length > 0 ? (
                  <ActivityTimeline visits={chemistVisits} limit={chemistVisits.length} />
                ) : (
                  <p className="text-sm text-slate-light text-center py-8">No visits logged yet.</p>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card className="p-6">
                <div className="space-y-3">
                  {Array.from(productMentions.entries()).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between rounded-(--radius) bg-porcelain-dim p-3.5">
                      <span className="text-sm font-medium text-ink">{name}</span>
                      <Badge>{count} mention{count > 1 ? "s" : ""}</Badge>
                    </div>
                  ))}
                  {productMentions.size === 0 && <p className="text-sm text-slate-light text-center py-8">No products discussed yet.</p>}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="followup">
              <Card className="p-6 space-y-3">
                {chemistVisits.filter((v) => v.nextFollowupDate).map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-(--radius) bg-porcelain-dim p-3.5">
                    <div className="flex items-center gap-2.5">
                      <CalendarClock className="h-4 w-4 text-indigo" />
                      <div>
                        <p className="text-sm font-medium text-ink">{format(new Date(v.nextFollowupDate!), "MMM d, yyyy")}</p>
                        {v.followUpNotes && <p className="text-xs text-slate">{v.followUpNotes}</p>}
                      </div>
                    </div>
                    <Badge variant={v.followUpStatus === "completed" ? "default" : v.followUpStatus === "missed" ? "rose" : "brass"}>
                      {v.followUpStatus}
                    </Badge>
                  </div>
                ))}
                {chemistVisits.filter((v) => v.nextFollowupDate).length === 0 && (
                  <p className="text-sm text-slate-light text-center py-8">No follow-ups scheduled.</p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
