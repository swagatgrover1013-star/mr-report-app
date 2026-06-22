"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { PageHeaderMobile } from "@/components/layout/page-header-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVisits } from "@/lib/hooks/use-visits";
import { useDoctors } from "@/lib/hooks/use-doctors";
import { useUsers } from "@/lib/hooks/use-users";
import { usePlanEntries } from "@/lib/hooks/use-plan-entries";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { format, subMonths, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { motion } from "framer-motion";

type Period = "weekly" | "monthly";

export default function AnalyticsPage() {
  const { visits } = useVisits();
  const { doctors } = useDoctors();
  const { users } = useUsers();
  const { planEntries } = usePlanEntries();
  const reps = users.filter((u) => u.role === "mr");

  const [trendPeriod, setTrendPeriod] = useState<Period>("monthly");

  const doctorEntries = useMemo(() => planEntries.filter((e) => e.partyType === "doctor"), [planEntries]);

  const metVsMissedTrend = useMemo(() => {
    const isMissed = (status: string) => status === "not_available" || status === "refused" || status === "other";
    if (trendPeriod === "monthly") {
      const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i));
      return months.map((m) => {
        const key = format(m, "yyyy-MM");
        const inMonth = doctorEntries.filter((e) => e.date.startsWith(key));
        return {
          label: format(m, "MMM"),
          Met: inMonth.filter((e) => e.visitStatus === "met").length,
          Missed: inMonth.filter((e) => isMissed(e.visitStatus)).length,
          Total: inMonth.length,
        };
      });
    }
    const weeks = Array.from({ length: 6 }).map((_, i) => subWeeks(new Date(), 5 - i));
    return weeks.map((w) => {
      const start = format(startOfWeek(w, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const end = format(endOfWeek(w, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const inWeek = doctorEntries.filter((e) => e.date >= start && e.date <= end);
      return {
        label: format(startOfWeek(w, { weekStartsOn: 1 }), "MMM d"),
        Met: inWeek.filter((e) => e.visitStatus === "met").length,
        Missed: inWeek.filter((e) => isMissed(e.visitStatus)).length,
        Total: inWeek.length,
      };
    });
  }, [doctorEntries, trendPeriod]);

  const totalPlannedInWindow = metVsMissedTrend.reduce((sum, d) => sum + d.Total, 0);

  const repPerformance = useMemo(
    () => reps.map((r) => ({ name: r.name.split(" ")[0], visits: visits.filter((v) => v.mrId === r.id).length })).sort((a, b) => b.visits - a.visits),
    [reps, visits]
  );

  const cityData = useMemo(() => {
    const counts: Record<string, number> = {};
    visits.forEach((v) => { counts[v.city] = (counts[v.city] || 0) + 1; });
    return Object.entries(counts).map(([city, count]) => ({ city, visits: count }));
  }, [visits]);

  const coverageData = useMemo(() => {
    const specs = Array.from(new Set(doctors.map((d) => d.specialization)));
    return specs.map((s) => {
      const docsInSpec = doctors.filter((d) => d.specialization === s);
      const covered = docsInSpec.filter((d) => visits.some((v) => v.partyType === "doctor" && v.partyId === d.id)).length;
      return { specialization: s, coverage: docsInSpec.length ? Math.round((covered / docsInSpec.length) * 100) : 0 };
    });
  }, [doctors, visits]);

  return (
    <AppShell>
      <TopBar title="Analytics" subtitle="Deep insights into field performance" />

      <div className="flex-1 p-5 lg:p-8 space-y-5">
        <PageHeaderMobile title="Analytics" subtitle="Performance insights" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle>Doctors Met vs Missed</CardTitle>
                    <CardDescription>
                      Trailing 6-{trendPeriod === "monthly" ? "month" : "week"} trend, across all reps ·{" "}
                      <span className="font-medium text-ink-soft">{totalPlannedInWindow} doctors planned in total</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant={trendPeriod === "weekly" ? "default" : "outline"} size="sm" onClick={() => setTrendPeriod("weekly")}>Weekly</Button>
                    <Button variant={trendPeriod === "monthly" ? "default" : "outline"} size="sm" onClick={() => setTrendPeriod("monthly")}>Monthly</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={metVsMissedTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--stone)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate)" }} width={28} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "var(--ink)", border: "none", borderRadius: "10px", fontSize: "12px" }} itemStyle={{ color: "var(--porcelain)" }} cursor={{ fill: "var(--porcelain-dim)" }} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: "var(--slate)" }}>{v}</span>} />
                    <Bar dataKey="Met" stackId="a" fill="var(--indigo)" radius={[4, 4, 0, 0]} animationDuration={700} />
                    <Bar dataKey="Missed" stackId="a" fill="var(--signal-rose)" radius={[4, 4, 0, 0]} animationDuration={700} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <Card>
              <CardHeader>
                <CardTitle>Top Performing MR</CardTitle>
                <CardDescription>Total visits logged per representative</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={repPerformance} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--stone)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate)" }} width={28} />
                    <Tooltip contentStyle={{ background: "var(--ink)", border: "none", borderRadius: "10px", fontSize: "12px" }} itemStyle={{ color: "var(--porcelain)" }} cursor={{ fill: "var(--porcelain-dim)" }} />
                    <Bar dataKey="visits" radius={[6, 6, 0, 0]} fill="var(--brass)" animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card>
              <CardHeader>
                <CardTitle>Cities with Maximum Visits</CardTitle>
                <CardDescription>Visit volume by territory</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={cityData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barSize={20}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="city" axisLine={false} tickLine={false} width={70} tick={{ fontSize: 12, fill: "var(--ink-soft)" }} />
                    <Tooltip contentStyle={{ background: "var(--ink)", border: "none", borderRadius: "10px", fontSize: "12px" }} itemStyle={{ color: "var(--porcelain)" }} cursor={{ fill: "var(--porcelain-dim)" }} />
                    <Bar dataKey="visits" radius={[0, 6, 6, 0]} fill="var(--indigo)" animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <Card>
              <CardHeader>
                <CardTitle>Doctor Coverage by Specialization</CardTitle>
                <CardDescription>% of doctors visited at least once</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={coverageData}>
                    <PolarGrid stroke="var(--stone)" />
                    <PolarAngleAxis dataKey="specialization" tick={{ fontSize: 11, fill: "var(--slate)" }} />
                    <PolarRadiusAxis tick={{ fontSize: 10, fill: "var(--slate-light)" }} angle={30} domain={[0, 100]} />
                    <Radar dataKey="coverage" stroke="var(--indigo)" fill="var(--indigo)" fillOpacity={0.35} animationDuration={800} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
