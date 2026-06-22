"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { PageHeaderMobile } from "@/components/layout/page-header-mobile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecommendationBadge } from "@/components/visits/recommendation-badge";
import { useVisits } from "@/lib/hooks/use-visits";
import { useDoctors } from "@/lib/hooks/use-doctors";
import { useChemists } from "@/lib/hooks/use-chemists";
import { useStockists } from "@/lib/hooks/use-stockists";
import { useUsers } from "@/lib/hooks/use-users";
import { usePlanEntries } from "@/lib/hooks/use-plan-entries";
import type { PlanEntry, PlanVisitStatus } from "@/types";
import { Plus, Search, Eye, Pencil, Trash2, Download, Loader2, CalendarDays, X, Check, UserX, ShieldX, HelpCircle, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const today = format(new Date(), "yyyy-MM-dd");

export default function VisitsPage() {
  const router = useRouter();
  const { visits, loading, refetch } = useVisits();
  const { doctors } = useDoctors();
  const { chemists } = useChemists();
  const { stockists } = useStockists();
  const { users } = useUsers();
  const { planEntries, refetch: refetchPlans } = usePlanEntries();
  const reps = users.filter((u) => u.role === "mr");
  const [search, setSearch] = useState("");
  const [partyFilter, setPartyFilter] = useState<string>("all");
  const [mrFilter, setMrFilter] = useState<string>("all");
  const [recFilter, setRecFilter] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<string>(today);

  const todaysPlans = planEntries.filter((e) => e.date === today);
  const visitForEntry = (entry: PlanEntry) => visits.find((v) => v.partyId === entry.partyId && v.visitDate === entry.date);

  const markStatus = async (entry: PlanEntry, status: PlanVisitStatus) => {
    await fetch(`/api/plan-entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitStatus: status }),
    });
    await refetchPlans();
  };

  const goToVisitReport = (entry: PlanEntry) => {
    const existing = visitForEntry(entry);
    if (existing) {
      router.push(`/visits/${existing.id}`);
      return;
    }
    const params = new URLSearchParams({
      partyType: entry.partyType,
      partyId: entry.partyId,
      productIds: entry.productIds.join(","),
      planEntryId: entry.id,
      date: entry.date,
    });
    router.push(`/visits/new?${params.toString()}`);
  };

  const filtered = useMemo(() => {
    return visits.filter((v) => {
      if (dayFilter && v.visitDate !== dayFilter) return false;
      if (search && !v.partyName.toLowerCase().includes(search.toLowerCase()) && !v.mrName.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (partyFilter !== "all" && v.partyId !== partyFilter) return false;
      if (mrFilter !== "all" && v.mrId !== mrFilter) return false;
      if (recFilter !== "all" && v.overallRecommendation !== recFilter) return false;
      return true;
    });
  }, [visits, search, partyFilter, mrFilter, recFilter, dayFilter]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/visits/${id}`, { method: "DELETE" });
    await refetch();
  };

  return (
    <AppShell>
      <TopBar
        title="Visit Reports"
        subtitle={dayFilter ? `${filtered.length} visits on ${format(new Date(dayFilter), "MMMM d, yyyy")}` : `${filtered.length} visits logged`}
        action={
          <Button asChild>
            <Link href="/visits/new">
              <Plus className="h-4 w-4" /> New Visit Report
            </Link>
          </Button>
        }
      />

      <div className="flex-1 p-5 lg:p-8 space-y-5">
        <div className="flex items-center justify-between lg:hidden">
          <PageHeaderMobile title="Visit Reports" subtitle={`${filtered.length} visits`} />
          <Button asChild size="sm">
            <Link href="/visits/new"><Plus className="h-4 w-4" /> New</Link>
          </Button>
        </div>

        {todaysPlans.length > 0 && (
          <Card className="p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5"><ClipboardCheck className="h-4 w-4 text-indigo" /> Today&apos;s Planned Visits</h3>
              <p className="text-xs text-slate mt-0.5">Tick each planned visit, then submit the report once you've met them.</p>
            </div>
            <div className="space-y-2">
              {todaysPlans.map((e) => {
                const existing = visitForEntry(e);
                return (
                  <div key={e.id} className="flex items-center justify-between gap-3 rounded-(--radius) border border-border p-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{e.partyName}</p>
                      <p className="text-xs text-slate truncate">{e.area ? `${e.area}, ` : ""}{e.city}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {e.visitStatus === "pending" && (
                        <>
                          <Button size="sm" onClick={() => markStatus(e, "met")}>
                            <Check className="h-3.5 w-3.5" /> Met
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => markStatus(e, "not_available")}>
                            <UserX className="h-3.5 w-3.5" /> Not Available
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => markStatus(e, "refused")}>
                            <ShieldX className="h-3.5 w-3.5" /> Refused
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => markStatus(e, "other")}>
                            <HelpCircle className="h-3.5 w-3.5" /> Other
                          </Button>
                        </>
                      )}
                      {e.visitStatus === "met" && (
                        <Button size="sm" onClick={() => goToVisitReport(e)}>
                          <ClipboardCheck className="h-3.5 w-3.5" /> {existing ? "View Visit Report" : "Submit Visit Report"}
                        </Button>
                      )}
                      {(e.visitStatus === "not_available" || e.visitStatus === "refused" || e.visitStatus === "other") && (
                        <>
                          <Badge variant="secondary" className="capitalize">{e.visitStatus.replace("_", " ")}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => markStatus(e, "pending")}>Undo</Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-light shrink-0" />
              <Input
                type="date"
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="w-44"
              />
            </div>
            {dayFilter && (
              <Button variant="outline" size="sm" onClick={() => setDayFilter("")}>
                <X className="h-3.5 w-3.5" /> View All Days
              </Button>
            )}
            {!dayFilter && (
              <Button variant="outline" size="sm" onClick={() => setDayFilter(today)}>
                Jump to Today
              </Button>
            )}
          </div>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-light" />
              <Input
                placeholder="Search by party or MR name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-3 overflow-x-auto">
              <Select value={partyFilter} onValueChange={setPartyFilter}>
                <SelectTrigger className="w-48 shrink-0"><SelectValue placeholder="Party" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                  <SelectGroup>
                    <SelectLabel>Doctors</SelectLabel>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Chemists</SelectLabel>
                    {chemists.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Stockists</SelectLabel>
                    {stockists.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select value={mrFilter} onValueChange={setMrFilter}>
                <SelectTrigger className="w-40 shrink-0"><SelectValue placeholder="MR" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reps</SelectItem>
                  {reps.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={recFilter} onValueChange={setRecFilter}>
                <SelectTrigger className="w-44 shrink-0"><SelectValue placeholder="Recommendation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="strong">Strongly Recommend</SelectItem>
                  <SelectItem value="moderate">Moderately Recommend</SelectItem>
                  <SelectItem value="occasional">Occasionally Recommend</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {loading && visits.length === 0 && (
          <div className="flex items-center justify-center py-16 text-slate-light gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading visits...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <Card className="p-10 text-center">
            <p className="text-sm text-slate-light">
              {dayFilter ? `No visits logged on ${format(new Date(dayFilter), "MMMM d, yyyy")}.` : "No visits match these filters."}
            </p>
          </Card>
        )}

        {/* Desktop table */}
        {filtered.length > 0 && (
        <Card className="hidden lg:block overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-porcelain-dim/60">
                  <th className="text-left font-medium text-slate px-5 py-3.5">Date</th>
                  <th className="text-left font-medium text-slate px-5 py-3.5">MR</th>
                  <th className="text-left font-medium text-slate px-5 py-3.5">Party</th>
                  <th className="text-left font-medium text-slate px-5 py-3.5">Products</th>
                  <th className="text-left font-medium text-slate px-5 py-3.5">Recommendation</th>
                  <th className="text-left font-medium text-slate px-5 py-3.5">Next Follow-up</th>
                  <th className="text-right font-medium text-slate px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.slice(0, 25).map((v, i) => (
                    <motion.tr
                      key={v.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className="border-b border-border last:border-0 hover:bg-porcelain-dim/40 transition-colors group"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-slate whitespace-nowrap">
                        {format(new Date(v.visitDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft whitespace-nowrap">{v.mrName}</td>
                      <td className="px-5 py-3.5">
                        <Link href={`/visits/${v.id}`} className="font-medium text-ink hover:text-indigo transition-colors">
                          {v.partyName}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-slate max-w-48 truncate">
                        {v.products.map((p) => p.productName).join(", ")}
                      </td>
                      <td className="px-5 py-3.5">
                        <RecommendationBadge level={v.overallRecommendation} />
                      </td>
                      <td className="px-5 py-3.5 text-slate whitespace-nowrap">
                        {v.nextFollowupDate ? format(new Date(v.nextFollowupDate), "MMM d") : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button asChild variant="ghost" size="icon-sm">
                            <Link href={`/visits/${v.id}`}><Eye className="h-4 w-4 text-slate" /></Link>
                          </Button>
                          <Button asChild variant="ghost" size="icon-sm">
                            <Link href={`/visits/new?editId=${v.id}`}><Pencil className="h-4 w-4 text-slate" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(v.id)}><Trash2 className="h-4 w-4 text-signal-rose" /></Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
        )}

        {/* Mobile cards */}
        {filtered.length > 0 && (
        <div className="lg:hidden space-y-3">
          {filtered.slice(0, 20).map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <Link href={`/visits/${v.id}`}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{v.partyName}</p>
                      <p className="text-xs text-slate mt-0.5">{v.mrName} · {format(new Date(v.visitDate), "MMM d, yyyy")}</p>
                    </div>
                    <RecommendationBadge level={v.overallRecommendation} className="shrink-0" />
                  </div>
                  <p className="text-xs text-slate mt-2.5 truncate">{v.products.map((p) => p.productName).join(", ")}</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </AppShell>
  );
}
