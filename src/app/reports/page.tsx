"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { PageHeaderMobile } from "@/components/layout/page-header-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlanEntries } from "@/lib/hooks/use-plan-entries";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useUsers } from "@/lib/hooks/use-users";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  ChevronLeft, ChevronRight, UserCheck, UserX, Clock3, TrendingUp, Percent, Search, Target,
} from "lucide-react";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  addWeeks, subWeeks, addMonths, subMonths, getDaysInMonth,
} from "date-fns";
import { motion } from "framer-motion";

type Period = "weekly" | "monthly";

export default function ReportsPage() {
  const { user: currentUser } = useCurrentUser();
  const { users } = useUsers();
  const isManager = currentUser?.role === "admin" || currentUser?.role === "manager";
  const reps = useMemo(() => users.filter((u) => u.role === "mr"), [users]);

  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const effectiveRepId = isManager ? (selectedRepId ?? reps[0]?.id ?? null) : currentUser?.id ?? null;
  const effectiveRepName = isManager ? reps.find((r) => r.id === effectiveRepId)?.name ?? "" : currentUser?.name ?? "";

  const [period, setPeriod] = useState<Period>("monthly");
  const [anchor, setAnchor] = useState(() => new Date());
  const [doctorSearch, setDoctorSearch] = useState("");

  const { planEntries } = usePlanEntries(effectiveRepId ?? undefined);

  const range = useMemo(() => {
    if (period === "weekly") {
      return { start: startOfWeek(anchor, { weekStartsOn: 1 }), end: endOfWeek(anchor, { weekStartsOn: 1 }) };
    }
    return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
  }, [period, anchor]);

  const rangeLabel = period === "weekly"
    ? `${format(range.start, "MMM d")} – ${format(range.end, "MMM d, yyyy")}`
    : format(anchor, "MMMM yyyy");

  const totalDays = period === "weekly" ? 7 : getDaysInMonth(anchor);

  const startStr = format(range.start, "yyyy-MM-dd");
  const endStr = format(range.end, "yyyy-MM-dd");

  const doctorEntries = useMemo(
    () => planEntries.filter((e) => e.partyType === "doctor" && e.date >= startStr && e.date <= endStr),
    [planEntries, startStr, endStr]
  );

  const met = doctorEntries.filter((e) => e.visitStatus === "met");
  const missed = doctorEntries.filter((e) => e.visitStatus === "not_available" || e.visitStatus === "refused" || e.visitStatus === "other");
  const pending = doctorEntries.filter((e) => e.visitStatus === "pending");

  const dailyAverage = met.length / totalDays;
  const meetingRate = met.length + missed.length > 0 ? Math.round((met.length / (met.length + missed.length)) * 100) : 0;

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: range.start, end: range.end });
    return days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const dayEntries = doctorEntries.filter((e) => e.date === key);
      return {
        day: format(day, period === "weekly" ? "EEE" : "d"),
        Met: dayEntries.filter((e) => e.visitStatus === "met").length,
        Missed: dayEntries.filter((e) => e.visitStatus === "not_available" || e.visitStatus === "refused" || e.visitStatus === "other").length,
      };
    });
  }, [range, doctorEntries, period]);

  const goPrev = () => setAnchor((a) => (period === "weekly" ? subWeeks(a, 1) : subMonths(a, 1)));
  const goNext = () => setAnchor((a) => (period === "weekly" ? addWeeks(a, 1) : addMonths(a, 1)));

  const summaryCards = [
    { label: "Total Doctors Planned", value: doctorEntries.length, icon: Target, color: "text-ink", bg: "bg-secondary" },
    { label: "Doctors Met", value: met.length, icon: UserCheck, color: "text-indigo", bg: "bg-indigo-soft" },
    { label: "Doctors Missed", value: missed.length, icon: UserX, color: "text-signal-rose", bg: "bg-signal-rose-soft" },
    { label: "Still Pending", value: pending.length, icon: Clock3, color: "text-signal-amber", bg: "bg-signal-amber-soft" },
    { label: "Daily Average", value: dailyAverage.toFixed(1), icon: TrendingUp, color: "text-brass-deep", bg: "bg-brass-soft" },
    { label: "Meeting Rate", value: `${meetingRate}%`, icon: Percent, color: "text-ink", bg: "bg-secondary" },
  ];

  return (
    <AppShell>
      <TopBar title="Reports" subtitle={`Doctor meeting performance${isManager && effectiveRepName ? ` · ${effectiveRepName}` : ""}`} />

      <div className="flex-1 p-5 lg:p-8 space-y-5">
        <PageHeaderMobile title="Reports" subtitle="Meeting performance" />

        <Card className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {isManager && reps.length > 0 && (
                <Select value={effectiveRepId ?? undefined} onValueChange={setSelectedRepId}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {reps.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-1.5">
                <Button variant={period === "weekly" ? "default" : "outline"} size="sm" onClick={() => setPeriod("weekly")}>Weekly</Button>
                <Button variant={period === "monthly" ? "default" : "outline"} size="sm" onClick={() => setPeriod("monthly")}>Monthly</Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium text-ink min-w-40 text-center">{rangeLabel}</span>
              <Button variant="ghost" size="icon-sm" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {summaryCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${card.bg} mb-2.5`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <p className="font-display text-2xl text-ink">{card.value}</p>
                <p className="text-xs text-slate mt-0.5">{card.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Met vs Missed — {period === "weekly" ? "This Week" : "This Month"}</CardTitle>
            <CardDescription>Daily breakdown of planned doctor visits and their outcome.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--stone)" strokeDasharray="3 3" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate)" }} width={28} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--ink)", border: "none", borderRadius: "10px", fontSize: "12px" }} itemStyle={{ color: "var(--porcelain)" }} cursor={{ fill: "var(--porcelain-dim)" }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: "var(--slate)" }}>{v}</span>} />
                <Bar dataKey="Met" stackId="a" fill="var(--indigo)" radius={[4, 4, 0, 0]} animationDuration={700} />
                <Bar dataKey="Missed" stackId="a" fill="var(--signal-rose)" radius={[4, 4, 0, 0]} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle>Doctor-Level Detail</CardTitle>
                <CardDescription>Every planned doctor visit in this period and its outcome.</CardDescription>
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-light" />
                <Input placeholder="Search doctors..." value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b border-border bg-porcelain-dim/60">
                    <th className="text-left font-medium text-slate px-6 py-3">Date</th>
                    <th className="text-left font-medium text-slate px-6 py-3">Doctor</th>
                    <th className="text-left font-medium text-slate px-6 py-3">City</th>
                    <th className="text-left font-medium text-slate px-6 py-3">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorEntries.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-slate-light text-sm py-10">No doctor visits planned in this period.</td></tr>
                  )}
                  {doctorEntries
                    .filter((e) => e.partyName.toLowerCase().includes(doctorSearch.toLowerCase()))
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((e) => (
                      <tr key={e.id} className="border-b border-border last:border-0">
                        <td className="px-6 py-3.5 font-mono text-xs text-slate whitespace-nowrap">{format(new Date(e.date), "MMM d, yyyy")}</td>
                        <td className="px-6 py-3.5 font-medium text-ink">{e.partyName}</td>
                        <td className="px-6 py-3.5 text-slate">{e.city}</td>
                        <td className="px-6 py-3.5">
                          {e.visitStatus === "met" && <Badge>Met</Badge>}
                          {e.visitStatus === "pending" && <Badge variant="amber">Pending</Badge>}
                          {(e.visitStatus === "not_available" || e.visitStatus === "refused" || e.visitStatus === "other") && (
                            <Badge variant="rose" className="capitalize">{e.visitStatus.replace("_", " ")}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
