"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { PageHeaderMobile } from "@/components/layout/page-header-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVisits } from "@/lib/hooks/use-visits";
import { CalendarClock, CheckCircle2, AlertTriangle, Clock3, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

const statusConfig = {
  pending: { icon: Clock3, color: "var(--brass)", bg: "bg-brass-soft", text: "text-brass-deep" },
  completed: { icon: CheckCircle2, color: "var(--indigo)", bg: "bg-indigo-soft", text: "text-indigo-deep" },
  missed: { icon: AlertTriangle, color: "var(--signal-rose)", bg: "bg-signal-rose-soft", text: "text-signal-rose" },
};

export default function FollowUpsPage() {
  const { visits, loading } = useVisits();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const followUps = useMemo(
    () => visits.filter((v) => v.nextFollowupDate).sort((a, b) => new Date(a.nextFollowupDate!).getTime() - new Date(b.nextFollowupDate!).getTime()),
    [visits]
  );

  const todayCount = followUps.filter((v) => isToday(new Date(v.nextFollowupDate!))).length;
  const tomorrowCount = followUps.filter((v) => isTomorrow(new Date(v.nextFollowupDate!))).length;
  const weekCount = followUps.filter((v) => isThisWeek(new Date(v.nextFollowupDate!))).length;

  const filtered = followUps.filter((v) => {
    if (statusFilter !== "all" && v.followUpStatus !== statusFilter) return false;
    if (search && !v.partyName.toLowerCase().includes(search.toLowerCase()) && !v.mrName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell>
      <TopBar title="Follow-ups" subtitle="Stay ahead of every scheduled touchpoint" />

      <div className="flex-1 p-5 lg:p-8 space-y-5">
        <PageHeaderMobile title="Follow-ups" subtitle="Upcoming touchpoints" />

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Today", value: todayCount },
            { label: "Tomorrow", value: tomorrowCount },
            { label: "This Week", value: weekCount },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 text-center">
                <p className="font-display text-3xl text-ink">{card.value}</p>
                <p className="text-sm text-slate mt-1">{card.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-light" />
            <Input placeholder="Search by party or MR name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </Card>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "completed", label: "Completed" },
            { value: "missed", label: "Missed" },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={statusFilter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(opt.value)}
              className="shrink-0"
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {loading && visits.length === 0 && (
          <div className="flex items-center justify-center py-16 text-slate-light gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading follow-ups...
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((v, i) => {
            const config = statusConfig[v.followUpStatus];
            const Icon = config.icon;
            return (
              <motion.div key={v.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                <Link href={`/visits/${v.id}`}>
                  <Card className="p-4 hover:shadow-premium-lg transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", config.bg)}>
                        <Icon className={cn("h-[18px] w-[18px]", config.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-ink truncate">{v.partyName}</p>
                          <span className="text-xs font-mono text-slate-light shrink-0">{format(new Date(v.nextFollowupDate!), "MMM d, yyyy")}</span>
                        </div>
                        <p className="text-xs text-slate mt-0.5 truncate">{v.mrName} · {v.followUpNotes || "No additional notes"}</p>
                      </div>
                      <Badge className={cn(config.bg, config.text, "border-transparent shrink-0")}>{v.followUpStatus}</Badge>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-slate-light text-center py-12">No follow-ups match this filter.</p>}
        </div>
      </div>
    </AppShell>
  );
}
