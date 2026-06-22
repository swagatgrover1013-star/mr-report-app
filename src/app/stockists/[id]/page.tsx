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
import { useStockist } from "@/lib/hooks/use-stockists";
import { useChemists } from "@/lib/hooks/use-chemists";
import { useVisits } from "@/lib/hooks/use-visits";
import { ArrowLeft, Phone, Mail, MapPin, CalendarClock, Wallet, ArrowUpRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import Link from "next/link";

const tierStyles = {
  platinum: { label: "Platinum Tier", badge: "ink" as const },
  gold: { label: "Gold Tier", badge: "brass" as const },
  silver: { label: "Silver Tier", badge: "secondary" as const },
};

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function StockistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { stockist, loading } = useStockist(params.id as string);
  const { chemists } = useChemists();
  const { visits } = useVisits();
  const stockistVisits = visits.filter((v) => v.partyType === "stockist" && v.partyId === params.id);

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8 text-slate-light gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading stockist...
        </div>
      </AppShell>
    );
  }

  if (!stockist) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-ink font-medium">Stockist not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/doctors?tab=stockist")}>Back to Stockists</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const suppliedChemists = chemists.filter((c) => c.stockistId === stockist.id);

  const productMentions = new Map<string, number>();
  stockistVisits.forEach((v) => v.products.forEach((p) => productMentions.set(p.productName, (productMentions.get(p.productName) || 0) + 1)));

  const initials = stockist.name.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <AppShell>
      <TopBar title="Stockist Profile" subtitle={stockist.name} />

      <div className="flex-1 p-5 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-5">
          <Button variant="ghost" size="sm" onClick={() => router.push("/doctors?tab=stockist")}>
            <ArrowLeft className="h-4 w-4" /> Back to Stockists
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
                      <h2 className="font-display text-2xl text-ink">{stockist.name}</h2>
                      <p className="text-sm text-slate mt-1">{stockist.ownerName}</p>
                    </div>
                    <Badge variant={tierStyles[stockist.tier].badge}>{tierStyles[stockist.tier].label}</Badge>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                    <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-indigo mt-0.5 shrink-0" /><span className="text-sm text-ink-soft">{stockist.area}, {stockist.city}</span></div>
                    <div className="flex items-start gap-2"><Phone className="h-4 w-4 text-indigo mt-0.5 shrink-0" /><span className="text-sm text-ink-soft">{stockist.phone}</span></div>
                    <div className="flex items-start gap-2"><Mail className="h-4 w-4 text-indigo mt-0.5 shrink-0" /><span className="text-sm text-ink-soft truncate">{stockist.email}</span></div>
                    <div className="flex items-start gap-2"><Wallet className="h-4 w-4 text-indigo mt-0.5 shrink-0" /><span className="text-sm text-ink-soft">{currency(stockist.monthlyOrderValue)}/mo</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                <div className="text-center">
                  <p className="font-display text-2xl text-ink">{stockist.totalVisits}</p>
                  <p className="text-xs text-slate mt-0.5">Total Visits</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="font-display text-2xl text-ink">{suppliedChemists.length}</p>
                  <p className="text-xs text-slate mt-0.5">Chemists Supplied</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl text-ink">{stockist.lastVisitDate ? format(new Date(stockist.lastVisitDate), "MMM d") : "—"}</p>
                  <p className="text-xs text-slate mt-0.5">Last Visit</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <Tabs defaultValue="network">
            <TabsList>
              <TabsTrigger value="network">Chemists Supplied</TabsTrigger>
              <TabsTrigger value="history">Visit History</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="followup">Follow-up</TabsTrigger>
            </TabsList>

            <TabsContent value="network">
              <Card className="p-6">
                <div className="space-y-2.5">
                  {suppliedChemists.map((c) => (
                    <Link key={c.id} href={`/chemists/${c.id}`}>
                      <div className="flex items-center justify-between rounded-(--radius) bg-porcelain-dim p-3.5 hover:bg-indigo-soft/50 transition-colors group">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                          <p className="text-xs text-slate mt-0.5">{c.area}, {c.city} · {c.ownerName}</p>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-indigo shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                  {suppliedChemists.length === 0 && <p className="text-sm text-slate-light text-center py-8">No chemists linked yet.</p>}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="p-6">
                {stockistVisits.length > 0 ? (
                  <ActivityTimeline visits={stockistVisits} limit={stockistVisits.length} />
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
                {stockistVisits.filter((v) => v.nextFollowupDate).map((v) => (
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
                {stockistVisits.filter((v) => v.nextFollowupDate).length === 0 && (
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
