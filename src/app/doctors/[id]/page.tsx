"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { useDoctor } from "@/lib/hooks/use-doctors";
import { useVisits } from "@/lib/hooks/use-visits";
import { ArrowLeft, Phone, Mail, MapPin, Building2, GraduationCap, CalendarClock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const tierStyles = {
  platinum: { label: "Platinum Tier", badge: "ink" as const },
  gold: { label: "Gold Tier", badge: "brass" as const },
  silver: { label: "Silver Tier", badge: "secondary" as const },
};

export default function DoctorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { doctor, loading } = useDoctor(params.id as string);
  const { visits } = useVisits();
  const doctorVisits = visits.filter((v) => v.partyType === "doctor" && v.partyId === params.id);

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8 text-slate-light gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading doctor...
        </div>
      </AppShell>
    );
  }

  if (!doctor) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-ink font-medium">Doctor not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/doctors")}>Back to Doctors</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const productMentions = new Map<string, number>();
  doctorVisits.forEach((v) => v.products.forEach((p) => productMentions.set(p.productName, (productMentions.get(p.productName) || 0) + 1)));

  const initials = doctor.name.replace("Dr. ", "").split(" ").map((n) => n[0]).join("");

  return (
    <AppShell>
      <TopBar title="Doctor Profile" subtitle={doctor.name} />

      <div className="flex-1 p-5 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-5">
          <Button variant="ghost" size="sm" onClick={() => router.push("/doctors")}>
            <ArrowLeft className="h-4 w-4" /> Back to Doctors
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
                      <h2 className="font-display text-2xl text-ink">{doctor.name}</h2>
                      <p className="text-sm text-slate mt-1">{doctor.specialization} · {doctor.qualification}</p>
                    </div>
                    <Badge variant={tierStyles[doctor.tier].badge}>{tierStyles[doctor.tier].label}</Badge>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                    <div className="flex items-start gap-2"><Building2 className="h-4 w-4 text-indigo mt-0.5 shrink-0" /><span className="text-sm text-ink-soft">{doctor.hospital}</span></div>
                    <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-indigo mt-0.5 shrink-0" /><span className="text-sm text-ink-soft">{doctor.area}, {doctor.city}</span></div>
                    <div className="flex items-start gap-2"><Phone className="h-4 w-4 text-indigo mt-0.5 shrink-0" /><span className="text-sm text-ink-soft">{doctor.phone}</span></div>
                    <div className="flex items-start gap-2"><Mail className="h-4 w-4 text-indigo mt-0.5 shrink-0" /><span className="text-sm text-ink-soft truncate">{doctor.email}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                <div className="text-center">
                  <p className="font-display text-2xl text-ink">{doctor.totalVisits}</p>
                  <p className="text-xs text-slate mt-0.5">Total Visits</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="font-display text-2xl text-ink">{doctor.visitFrequency}</p>
                  <p className="text-xs text-slate mt-0.5">Visit Frequency</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl text-ink">{doctor.lastVisitDate ? format(new Date(doctor.lastVisitDate), "MMM d") : "—"}</p>
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
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <Card className="p-6">
                {doctorVisits.length > 0 ? (
                  <ActivityTimeline visits={doctorVisits} limit={doctorVisits.length} />
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
                {doctorVisits.filter((v) => v.nextFollowupDate).map((v) => (
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
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card className="p-6">
                <p className="text-sm text-ink-soft leading-relaxed">{doctor.notes || "No notes recorded for this doctor yet."}</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
