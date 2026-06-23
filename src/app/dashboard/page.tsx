"use client";

import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { VisitsPerDayChart } from "@/components/dashboard/visits-per-day-chart";
import { TopProductsChart } from "@/components/dashboard/top-products-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVisits } from "@/lib/hooks/use-visits";
import { useDoctors } from "@/lib/hooks/use-doctors";
import { useProducts } from "@/lib/hooks/use-products";
import {
  CalendarCheck,
  Stethoscope,
  Users,
  Crown,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPage() {
  const { visits, loading: visitsLoading } = useVisits();
  const { doctors } = useDoctors();
  const { products } = useProducts();
  const today = "2026-06-17";
  const todaysVisits = visits.filter((v) => v.visitDate === today).length;

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyVisits = visits.filter((v) => new Date(v.visitDate) >= weekAgo).length;

  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthlyVisits = visits.filter((v) => new Date(v.visitDate) >= monthAgo).length;

  const uniquePartiesCovered = new Set(visits.map((v) => v.partyId)).size;
  const pendingFollowUps = visits.filter((v) => v.followUpStatus === "pending").length;

  const topProduct = [...products].sort((a, b) => b.totalMentions - a.totalMentions)[0];

  const topDoctors = [...doctors].sort((a, b) => b.totalVisits - a.totalVisits).slice(0, 5);

  if (visitsLoading && visits.length === 0) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8 text-slate-light gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar
        title="Dashboard"
        subtitle={format(new Date(today), "EEEE, MMMM d, yyyy")}
        action={
          <Button asChild>
            <Link href="/visits/new">
              <Plus className="h-4 w-4" /> New Visit Report
            </Link>
          </Button>
        }
      />

      <div className="flex-1 p-5 lg:p-8 space-y-6">
        {/* Mobile header */}
        <div className="lg:hidden">
          <h1 className="font-display text-2xl text-ink">Dashboard</h1>
          <p className="text-sm text-slate mt-0.5">{format(new Date(today), "EEEE, MMMM d, yyyy")}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Today's Visits" value={todaysVisits} icon={Stethoscope} delta="+12%" index={0} />
          <StatCard label="Weekly Visits" value={weeklyVisits} icon={CalendarCheck} delta="+8%" index={1} />
          <StatCard label="Network Covered" value={uniquePartiesCovered} icon={Users} accent="brass" index={2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Visits per day - large chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Visit Activity</CardTitle>
                <CardDescription>Field visits over the last 14 days</CardDescription>
              </div>
              <Badge variant="default">{monthlyVisits} this month</Badge>
            </CardHeader>
            <CardContent>
              <VisitsPerDayChart visits={visits} />
            </CardContent>
          </Card>

          {/* Activity Timeline - signature element */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest field visits</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityTimeline visits={visits} limit={5} />
              <Link
                href="/visits"
                className="flex items-center gap-1 text-sm text-indigo font-medium mt-5 hover:gap-2 transition-all w-fit"
              >
                View all visits <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>By mention frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <TopProductsChart />
            </CardContent>
          </Card>

          {/* Top doctors + featured product */}
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Top Doctors</CardTitle>
                <CardDescription>By total visits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topDoctors.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs text-slate-light w-4">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{doc.name}</p>
                        <p className="text-xs text-slate truncate">{doc.specialization}</p>
                      </div>
                    </div>
                    <span className="text-sm font-mono text-ink-soft shrink-0">{doc.totalVisits}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {topProduct && (
              <Card className="bg-gradient-indigo border-indigo-deep text-porcelain overflow-hidden relative">
                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white opacity-20 blur-2xl" />
                <CardContent className="p-5 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-brass" />
                    <span className="text-xs uppercase tracking-wider text-porcelain/70">Top Recommended</span>
                  </div>
                  <p className="font-display text-lg leading-snug">{topProduct.name}</p>
                  <p className="text-sm text-porcelain/70 mt-1">{topProduct.brand}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <div>
                      <p className="text-2xl font-display">{topProduct.totalMentions}</p>
                      <p className="text-xs text-porcelain/60">mentions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-display">{topProduct.doctorsRecommending}</p>
                      <p className="text-xs text-porcelain/60">doctors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
