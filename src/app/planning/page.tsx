"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { PageHeaderMobile } from "@/components/layout/page-header-mobile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductPicker } from "@/components/shared/product-picker";
import { PartyPicker } from "@/components/shared/party-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDoctors } from "@/lib/hooks/use-doctors";
import { useChemists } from "@/lib/hooks/use-chemists";
import { useStockists } from "@/lib/hooks/use-stockists";
import { useProducts } from "@/lib/hooks/use-products";
import { usePlanEntries } from "@/lib/hooks/use-plan-entries";
import { useVisits } from "@/lib/hooks/use-visits";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useUsers } from "@/lib/hooks/use-users";
import { usePlanSubmission } from "@/lib/hooks/use-plan-submission";
import { lockDateForMonth, isMonthLocked } from "@/lib/plan-lock";
import type { PartyType, PlanEntry } from "@/types";
import {
  Stethoscope, Store, Warehouse, Users, MapPin, Plus, X, Loader2, Pencil, Trash2,
  ClipboardCheck, CheckCircle2, ChevronLeft, ChevronRight, Lock, Send, ShieldCheck,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

const TODAY = format(new Date(), "yyyy-MM-dd");

const partyMeta: Record<PartyType, { label: string; icon: typeof Stethoscope; badge: "default" | "brass" | "amber" | "ink" }> = {
  doctor: { label: "Doctor", icon: Stethoscope, badge: "default" },
  chemist: { label: "Chemist", icon: Store, badge: "brass" },
  stockist: { label: "Stockist", icon: Warehouse, badge: "amber" },
  meeting: { label: "Meeting", icon: Users, badge: "ink" },
};

const statusMeta: Record<string, { label: string; badge: "amber" | "default" | "rose" | "secondary" }> = {
  pending: { label: "Pending", badge: "amber" },
  met: { label: "Met", badge: "default" },
  not_available: { label: "Not Available", badge: "secondary" },
  refused: { label: "Refused", badge: "rose" },
  other: { label: "Other", badge: "secondary" },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface PartyOption {
  id: string;
  name: string;
  area: string;
}

function getPartiesFor(
  city: string | null,
  partyType: PartyType | null,
  doctors: { id: string; name: string; area: string; city: string }[],
  chemists: { id: string; name: string; area: string; city: string }[],
  stockists: { id: string; name: string; area: string; city: string }[]
): PartyOption[] {
  if (!city || !partyType) return [];
  if (partyType === "doctor") return doctors.filter((d) => d.city === city).map((d) => ({ id: d.id, name: d.name, area: d.area }));
  if (partyType === "chemist") return chemists.filter((c) => c.city === city).map((c) => ({ id: c.id, name: c.name, area: c.area }));
  if (partyType === "stockist") return stockists.filter((s) => s.city === city).map((s) => ({ id: s.id, name: s.name, area: s.area }));
  return [];
}

interface Stop {
  key: string;
  partyType: PartyType | null;
  partyId: string;
  meetingTitle: string;
  productIds: string[];
  notes: string;
  isJointVisit: boolean;
  jointWithId: string;
}

function emptyStop(key: string): Stop {
  return { key, partyType: null, partyId: "", meetingTitle: "", productIds: [], notes: "", isJointVisit: false, jointWithId: "" };
}

function isStopValid(stop: Stop): boolean {
  if (stop.partyType === "meeting") return !!stop.meetingTitle.trim();
  return !!stop.partyType && !!stop.partyId && stop.productIds.length > 0;
}

export default function PlanningPage() {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const { users } = useUsers();
  const { doctors } = useDoctors();
  const { chemists } = useChemists();
  const { stockists } = useStockists();
  const { products } = useProducts();
  const { visits } = useVisits();

  const isManager = currentUser?.role === "admin" || currentUser?.role === "manager";
  const reps = useMemo(() => users.filter((u) => u.role === "mr"), [users]);
  const managers = useMemo(() => users.filter((u) => u.role === "admin" || u.role === "manager"), [users]);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const effectiveRepId = isManager ? (selectedRepId ?? reps[0]?.id ?? null) : currentUser?.id ?? null;
  const effectiveRepName = isManager
    ? reps.find((r) => r.id === effectiveRepId)?.name ?? ""
    : currentUser?.name ?? "";

  const currentRealMonth = useMemo(() => startOfMonth(new Date()), []);
  const [viewMonth, setViewMonth] = useState(currentRealMonth);
  const monthStr = format(viewMonth, "yyyy-MM");
  const monthLabel = format(viewMonth, "MMMM yyyy");
  const lockDate = lockDateForMonth(monthStr);
  const monthLocked = isMonthLocked(monthStr);
  const canEdit = isManager || !monthLocked;
  const canGoToPrevMonth = isManager || viewMonth > currentRealMonth;

  const goPrevMonth = () => {
    if (!canGoToPrevMonth) return;
    setViewMonth((m) => {
      const prev = subMonths(m, 1);
      return isManager || prev >= currentRealMonth ? prev : m;
    });
  };

  const { planEntries: entries, loading, refetch } = usePlanEntries(effectiveRepId ?? undefined);
  const { submission, refetch: refetchSubmission } = usePlanSubmission(monthStr, effectiveRepId ?? undefined);

  const allCities = useMemo(() => Array.from(new Set([...doctors, ...chemists, ...stockists].map((p) => p.city))), [doctors, chemists, stockists]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PlanEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);

  // Create-plan (multi-stop) form state
  const stopKeyRef = useRef(1);
  const [formDate, setFormDate] = useState(TODAY);
  const [formCity, setFormCity] = useState<string | null>(null);
  const [stops, setStops] = useState<Stop[]>([emptyStop("stop-0")]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const requiresCity = stops.some((s) => s.partyType !== "meeting");
  const canCreate = !!formDate && (!requiresCity || !!formCity) && stops.length > 0 && stops.every(isStopValid);

  const defaultDateForMonth = () => {
    const monthStart = format(startOfMonth(viewMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(viewMonth), "yyyy-MM-dd");
    return TODAY >= monthStart && TODAY <= monthEnd ? TODAY : monthStart;
  };

  const resetForm = () => {
    setFormDate(defaultDateForMonth());
    setFormCity(null);
    setStops([emptyStop("stop-0")]);
    stopKeyRef.current = 1;
    setCreateError(null);
  };

  const addStop = () => {
    setStops((prev) => [...prev, emptyStop(`stop-${stopKeyRef.current++}`)]);
  };
  const removeStop = (key: string) => {
    setStops((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev));
  };
  const updateStop = (key: string, patch: Partial<Stop>) => {
    setStops((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const handleCreatePlan = async () => {
    if (!canCreate) return;
    setCreating(true);
    setCreateError(null);

    const mrOverride = isManager ? { mrId: effectiveRepId, mrName: effectiveRepName } : {};

    const results = await Promise.all(
      stops.map(async (stop) => {
        if (stop.partyType === "meeting") {
          const res = await fetch("/api/plan-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: formDate,
              partyType: "meeting",
              partyId: `meeting-${Date.now()}-${stop.key}`,
              partyName: stop.meetingTitle,
              city: formCity ?? "",
              area: "",
              productIds: [],
              notes: stop.notes,
              ...mrOverride,
            }),
          });
          return { ok: res.ok };
        }
        const parties = getPartiesFor(formCity, stop.partyType, doctors, chemists, stockists);
        const party = parties.find((p) => p.id === stop.partyId);
        if (!party || !stop.partyType || !formCity) return { ok: false };
        const jointManager = managers.find((m) => m.id === stop.jointWithId);
        const res = await fetch("/api/plan-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: formDate,
            partyType: stop.partyType,
            partyId: party.id,
            partyName: party.name,
            city: formCity,
            area: party.area,
            productIds: stop.productIds,
            notes: stop.notes,
            isJointVisit: stop.isJointVisit && !!jointManager,
            jointWithId: jointManager?.id ?? "",
            jointWithName: jointManager?.name ?? "",
            ...mrOverride,
          }),
        });
        return { ok: res.ok };
      })
    );

    setCreating(false);
    const failedCount = results.filter((r) => !r.ok).length;
    if (failedCount > 0) {
      setCreateError(`${failedCount} of ${stops.length} visit${stops.length > 1 ? "s" : ""} failed to save. Please try again.`);
      await refetch();
      return;
    }
    await refetch();
    setCreateOpen(false);
    resetForm();
  };

  const entriesByDate = useMemo(() => {
    const map = new Map<string, typeof entries>();
    entries.forEach((e) => {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    });
    map.forEach((list) => list.sort((a, b) => a.partyName.localeCompare(b.partyName)));
    return map;
  }, [entries]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) }),
    [viewMonth]
  );

  const leadingBlanks = (getDay(days[0]) + 6) % 7; // Monday-first offset

  const selectedEntries = selectedDate ? entriesByDate.get(selectedDate) ?? [] : [];

  const visitFor = (entry: PlanEntry) => visits.find((v) => v.partyId === entry.partyId && v.visitDate === entry.date);

  const handleDeleteEntry = async (id: string) => {
    await fetch(`/api/plan-entries/${id}`, { method: "DELETE" });
    await refetch();
  };

  const openCreateForDate = (date: string) => {
    setFormDate(date);
    setFormCity(null);
    setStops([emptyStop("stop-0")]);
    stopKeyRef.current = 1;
    setCreateError(null);
    setSelectedDate(null);
    setCreateOpen(true);
  };

  const goToVisitReport = (entry: PlanEntry) => {
    const existing = visitFor(entry);
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

  const handleSubmitForApproval = async () => {
    if (!effectiveRepId) return;
    setSubmitting(true);
    await fetch("/api/plan-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: monthStr, userId: effectiveRepId }),
    });
    setSubmitting(false);
    await refetchSubmission();
  };

  const handleApprove = async () => {
    if (!effectiveRepId) return;
    setApproving(true);
    await fetch("/api/plan-submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: monthStr, userId: effectiveRepId, status: "approved" }),
    });
    setApproving(false);
    await refetchSubmission();
  };

  return (
    <AppShell>
      <TopBar
        title="Tour Planning"
        subtitle={`${monthLabel} · ${entries.length} planned visits${isManager && effectiveRepName ? ` · ${effectiveRepName}` : ""}`}
        action={
          <Button onClick={() => setCreateOpen(true)} disabled={!canEdit}>
            <Plus className="h-4 w-4" /> Create Plan
          </Button>
        }
      />

      <div className="flex-1 p-5 lg:p-8 space-y-5">
        <div className="flex items-center justify-between lg:hidden">
          <PageHeaderMobile title="Tour Planning" subtitle={monthLabel} />
          <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!canEdit}><Plus className="h-4 w-4" /> New</Button>
        </div>

        {isManager && reps.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium text-slate uppercase tracking-wider shrink-0">Viewing Plan For</span>
              <Select value={effectiveRepId ?? undefined} onValueChange={setSelectedRepId}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reps.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}

        {/* Month navigator */}
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon-sm" onClick={goPrevMonth} disabled={!canGoToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-display text-lg text-ink">{monthLabel}</span>
            <Button variant="ghost" size="icon-sm" onClick={() => setViewMonth((m) => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {!isManager && !canGoToPrevMonth && (
            <p className="text-xs text-slate-light text-center mt-1.5">Past months aren't visible here — ask your manager if you need to reference an earlier plan.</p>
          )}
        </Card>

        {/* Submission status banner */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              {monthLocked ? <Lock className="h-4 w-4 text-signal-amber shrink-0" /> : <ClipboardCheck className="h-4 w-4 text-indigo shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {submission?.status === "approved" && `Approved${submission.approvedBy ? ` by ${submission.approvedBy}` : ""}`}
                  {submission?.status === "submitted" && "Submitted — awaiting manager approval"}
                  {(!submission || submission.status === "draft") && (monthLocked ? "Locked — not submitted in time" : "Draft")}
                </p>
                <p className="text-xs text-slate mt-0.5">
                  {isManager
                    ? `${effectiveRepName || "This rep"} can edit this plan until ${format(lockDate, "MMM d, yyyy")}. You can always edit.`
                    : monthLocked
                    ? "This month is locked. Contact your manager for any changes."
                    : `Submit by ${format(lockDate, "MMM d, yyyy")} — after that it locks and your manager takes over.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isManager && submission?.status !== "approved" && (
                <Button size="sm" onClick={handleSubmitForApproval} disabled={submitting || submission?.status === "submitted"}>
                  <Send className="h-3.5 w-3.5" /> {submission?.status === "submitted" ? "Submitted" : submitting ? "Submitting..." : "Submit for Approval"}
                </Button>
              )}
              {isManager && submission?.status === "submitted" && (
                <Button size="sm" onClick={handleApprove} disabled={approving}>
                  <ShieldCheck className="h-3.5 w-3.5" /> {approving ? "Approving..." : "Approve Plan"}
                </Button>
              )}
              {submission?.status === "approved" && <Badge variant="default">Approved</Badge>}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-5 flex-wrap">
            <span className="text-xs font-medium text-slate uppercase tracking-wider">Legend</span>
            {(Object.entries(partyMeta) as [PartyType, typeof partyMeta.doctor][]).map(([type, meta]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-ink-soft">
                <meta.icon className="h-3.5 w-3.5 text-indigo" />
                {meta.label}
              </div>
            ))}
          </div>
        </Card>

        {loading && entries.length === 0 && (
          <div className="flex items-center justify-center py-16 text-slate-light gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading plan...
          </div>
        )}

        <Card className="p-3 lg:p-5">
          <div className="grid grid-cols-7 gap-1.5 lg:gap-2.5 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate py-1.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 lg:gap-2.5">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEntries = entriesByDate.get(dateKey) ?? [];
              const visible = dayEntries.slice(0, 2);
              const extra = dayEntries.length - visible.length;

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={cn(
                    "min-h-20 lg:min-h-28 rounded-(--radius-sm) border p-1.5 lg:p-2.5 text-left transition-all flex flex-col gap-1 cursor-pointer",
                    dayEntries.length > 0
                      ? "border-border hover:border-indigo hover:shadow-sm bg-card"
                      : "border-border/60 bg-porcelain-dim/40 hover:border-indigo/60 hover:bg-porcelain-dim"
                  )}
                >
                  <span className="text-xs font-medium text-ink-soft">{format(day, "d")}</span>
                  <div className="flex flex-col gap-1">
                    {visible.map((e) => {
                      const meta = partyMeta[e.partyType];
                      return (
                        <span key={e.id} className="flex items-center gap-1 text-[10px] lg:text-xs text-ink-soft truncate">
                          <meta.icon className="h-3 w-3 text-indigo shrink-0" />
                          <span className="truncate">{e.partyName}</span>
                        </span>
                      );
                    })}
                    {extra > 0 && <span className="text-[10px] lg:text-xs text-slate-light">+{extra} more</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Day detail dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDate ? format(new Date(selectedDate), "EEEE, MMMM d, yyyy") : ""}</DialogTitle>
            <DialogDescription>{selectedEntries.length} item{selectedEntries.length !== 1 ? "s" : ""} planned</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {selectedEntries.length === 0 && (
              <p className="text-sm text-slate-light text-center py-6">No visits planned for this day yet.</p>
            )}
            {selectedEntries.map((e) => {
              const meta = partyMeta[e.partyType];
              const isMeeting = e.partyType === "meeting";
              const loggedVisit = !isMeeting ? visitFor(e) : undefined;
              const sm = statusMeta[e.visitStatus] ?? statusMeta.pending;
              return (
                <div key={e.id} className="rounded-(--radius) border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-soft">
                        <meta.icon className="h-4 w-4 text-indigo" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{e.partyName}</p>
                        {!isMeeting && (
                          <p className="flex items-center gap-1 text-xs text-slate mt-0.5 truncate"><MapPin className="h-3 w-3 shrink-0" />{e.area}, {e.city}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={meta.badge}>{meta.label}</Badge>
                      {e.isJointVisit && <Badge variant="brass">Joint w/ {e.jointWithName}</Badge>}
                      {e.visitStatus !== "pending" && <Badge variant={sm.badge}>{sm.label}</Badge>}
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="icon-sm" aria-label="Edit plan" onClick={() => setEditingEntry(e)}>
                            <Pencil className="h-3.5 w-3.5 text-slate" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label="Delete plan" onClick={() => handleDeleteEntry(e.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-signal-rose" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {!isMeeting && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {e.productIds.map((pid) => {
                        const product = products.find((p) => p.id === pid);
                        return product ? <Badge key={pid} variant="secondary">{product.name}</Badge> : null;
                      })}
                    </div>
                  )}
                  {e.notes && <p className="text-xs text-slate mt-2.5">{e.notes}</p>}
                  {!isMeeting && (
                    <Button
                      size="sm"
                      variant={loggedVisit ? "outline" : "default"}
                      className="w-full mt-3"
                      onClick={() => goToVisitReport(e)}
                    >
                      {loggedVisit ? (
                        <><CheckCircle2 className="h-4 w-4" /> View Visit Report</>
                      ) : (
                        <><ClipboardCheck className="h-4 w-4" /> Submit Visit Report</>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
            {canEdit ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => selectedDate && openCreateForDate(selectedDate)}
              >
                <Plus className="h-4 w-4" /> Add Plan for This Day
              </Button>
            ) : (
              <p className="text-xs text-slate-light text-center py-2">This month is locked. Contact your manager for changes.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create plan dialog (multi-stop) */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <CreatePlanDialogContent
          allCities={allCities}
          doctors={doctors} chemists={chemists} stockists={stockists} products={products} managers={managers}
          formDate={formDate} setFormDate={setFormDate}
          formCity={formCity} setFormCity={setFormCity}
          stops={stops} addStop={addStop} removeStop={removeStop} updateStop={updateStop}
          canCreate={canCreate}
          creating={creating}
          createError={createError}
          onCreate={handleCreatePlan}
          onCancel={() => setCreateOpen(false)}
        />
      </Dialog>

      {/* Edit single entry dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        {editingEntry && (
          <EditPlanDialogContent
            entry={editingEntry}
            allCities={allCities}
            doctors={doctors} chemists={chemists} stockists={stockists} products={products} managers={managers}
            onClose={() => setEditingEntry(null)}
            onSaved={async () => { await refetch(); setEditingEntry(null); }}
          />
        )}
      </Dialog>
    </AppShell>
  );
}

interface CreatePlanDialogContentProps {
  allCities: string[];
  doctors: { id: string; name: string; area: string; city: string }[];
  chemists: { id: string; name: string; area: string; city: string }[];
  stockists: { id: string; name: string; area: string; city: string }[];
  products: { id: string; name: string }[];
  managers: { id: string; name: string }[];
  formDate: string;
  setFormDate: (v: string) => void;
  formCity: string | null;
  setFormCity: (v: string) => void;
  stops: Stop[];
  addStop: () => void;
  removeStop: (key: string) => void;
  updateStop: (key: string, patch: Partial<Stop>) => void;
  canCreate: boolean;
  creating: boolean;
  createError: string | null;
  onCreate: () => void;
  onCancel: () => void;
}

function CreatePlanDialogContent({
  allCities, doctors, chemists, stockists, products, managers,
  formDate, setFormDate,
  formCity, setFormCity,
  stops, addStop, removeStop, updateStop,
  canCreate, creating, createError, onCreate, onCancel,
}: CreatePlanDialogContentProps) {
  return (
    <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Plan</DialogTitle>
        <DialogDescription>Schedule a full day at once — add every doctor, chemist, stockist, or meeting you have.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Select value={formCity ?? undefined} onValueChange={setFormCity}>
              <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                {allCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Visits for this day</Label>
          {stops.map((stop, i) => {
            const parties = getPartiesFor(formCity, stop.partyType, doctors, chemists, stockists);
            const isMeeting = stop.partyType === "meeting";
            return (
              <div key={stop.key} className="rounded-(--radius) border border-border p-3.5 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-light">Visit {i + 1}</span>
                  {stops.length > 1 && (
                    <button onClick={() => removeStop(stop.key)} className="text-slate-light hover:text-signal-rose cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(partyMeta) as [PartyType, typeof partyMeta.doctor][]).map(([type, meta]) => (
                    <button
                      key={type}
                      onClick={() => updateStop(stop.key, { partyType: type, partyId: "", meetingTitle: "", productIds: [] })}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-(--radius-sm) border p-2 text-center transition-all cursor-pointer",
                        stop.partyType === type ? "border-indigo bg-indigo-soft/60 shadow-sm" : "border-border hover:border-stone-deep"
                      )}
                    >
                      <meta.icon className={cn("h-3.5 w-3.5", stop.partyType === type ? "text-indigo" : "text-slate")} />
                      <span className="text-[11px] font-medium text-ink">{meta.label}</span>
                    </button>
                  ))}
                </div>

                {isMeeting ? (
                  <Input
                    placeholder="Meeting title (e.g. Monthly Sales Review)"
                    value={stop.meetingTitle}
                    onChange={(e) => updateStop(stop.key, { meetingTitle: e.target.value })}
                  />
                ) : (
                  <>
                    <PartyPicker
                      parties={parties}
                      value={stop.partyId}
                      onSelect={(v) => updateStop(stop.key, { partyId: v })}
                      disabled={!formCity || !stop.partyType || parties.length === 0}
                      placeholder={!formCity || !stop.partyType ? "Pick city & type first" : `Select ${partyMeta[stop.partyType].label.toLowerCase()}`}
                    />
                    {formCity && stop.partyType && parties.length === 0 && (
                      <p className="text-xs text-signal-amber">
                        No {partyMeta[stop.partyType].label.toLowerCase()}s found in {formCity} yet. Try a different city, or add one from the Network page first.
                      </p>
                    )}

                    <ProductPicker
                      products={products}
                      excludeIds={stop.productIds}
                      onSelect={(id) => updateStop(stop.key, { productIds: [...stop.productIds, id] })}
                      placeholder="Add a product to target"
                    />
                    {stop.productIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {stop.productIds.map((id) => {
                          const product = products.find((p) => p.id === id);
                          if (!product) return null;
                          return (
                            <Badge key={id} variant="secondary" className="gap-1 pr-1.5">
                              {product.name}
                              <button onClick={() => updateStop(stop.key, { productIds: stop.productIds.filter((p) => p !== id) })} className="cursor-pointer hover:text-signal-rose">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    {managers.length > 0 && (
                      <div className="rounded-(--radius-sm) border border-dashed border-stone-deep p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-ink-soft">Joint visit with manager?</span>
                          <div className="flex gap-1.5">
                            <Button type="button" size="sm" variant={stop.isJointVisit ? "default" : "outline"} className="h-7 px-2.5 text-xs" onClick={() => updateStop(stop.key, { isJointVisit: true, jointWithId: stop.jointWithId || managers[0].id })}>Yes</Button>
                            <Button type="button" size="sm" variant={!stop.isJointVisit ? "default" : "outline"} className="h-7 px-2.5 text-xs" onClick={() => updateStop(stop.key, { isJointVisit: false })}>No</Button>
                          </div>
                        </div>
                        {stop.isJointVisit && (
                          <Select value={stop.jointWithId || managers[0].id} onValueChange={(v) => updateStop(stop.key, { jointWithId: v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </>
                )}

                <Input
                  placeholder={isMeeting ? "Agenda / notes (optional)" : "Notes for this visit (optional)"}
                  value={stop.notes}
                  onChange={(e) => updateStop(stop.key, { notes: e.target.value })}
                />
              </div>
            );
          })}

          <Button variant="outline" className="w-full" onClick={addStop}>
            <Plus className="h-4 w-4" /> Add Another Visit
          </Button>
        </div>

        {createError && <p className="text-xs text-signal-rose">{createError}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onCreate} disabled={!canCreate || creating}>
          {creating ? "Saving..." : `Create Plan${stops.length > 1 ? ` (${stops.length} visits)` : ""}`}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

interface EditPlanDialogContentProps {
  entry: PlanEntry;
  allCities: string[];
  doctors: { id: string; name: string; area: string; city: string }[];
  chemists: { id: string; name: string; area: string; city: string }[];
  stockists: { id: string; name: string; area: string; city: string }[];
  products: { id: string; name: string }[];
  managers: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}

function EditPlanDialogContent({ entry, allCities, doctors, chemists, stockists, products, managers, onClose, onSaved }: EditPlanDialogContentProps) {
  const [date, setDate] = useState(entry.date);
  const [city, setCity] = useState<string>(entry.city);
  const [partyType, setPartyType] = useState<PartyType>(entry.partyType);
  const [partyId, setPartyId] = useState(entry.partyId);
  const [meetingTitle, setMeetingTitle] = useState(entry.partyType === "meeting" ? entry.partyName : "");
  const [productIds, setProductIds] = useState<string[]>(entry.productIds);
  const [notes, setNotes] = useState(entry.notes);
  const [isJointVisit, setIsJointVisit] = useState(entry.isJointVisit);
  const [jointWithId, setJointWithId] = useState(entry.jointWithId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMeeting = partyType === "meeting";
  const parties = getPartiesFor(city, partyType, doctors, chemists, stockists);
  const canSave = !!date && (isMeeting ? !!meetingTitle.trim() : !!city && !!partyType && !!partyId && productIds.length > 0);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    if (isMeeting) {
      const res = await fetch(`/api/plan-entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, partyType: "meeting", partyId: entry.partyId, partyName: meetingTitle, city: city || "", area: "", productIds: [], notes,
        }),
      });
      setSaving(false);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to update plan.");
        return;
      }
      onSaved();
      return;
    }

    const party = parties.find((p) => p.id === partyId);
    if (!party) {
      setSaving(false);
      setError("Selected party is no longer valid for this city.");
      return;
    }
    const jointManager = managers.find((m) => m.id === jointWithId);
    const res = await fetch(`/api/plan-entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date, partyType, partyId: party.id, partyName: party.name, city, area: party.area, productIds, notes,
        isJointVisit: isJointVisit && !!jointManager,
        jointWithId: jointManager?.id ?? "",
        jointWithName: jointManager?.name ?? "",
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to update plan.");
      return;
    }
    onSaved();
  };

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Plan</DialogTitle>
        <DialogDescription>Update this planned item.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Visit Type</Label>
          <div className="grid grid-cols-4 gap-2.5">
            {(Object.entries(partyMeta) as [PartyType, typeof partyMeta.doctor][]).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => { setPartyType(type); setPartyId(""); }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-(--radius) border p-3 text-center transition-all cursor-pointer",
                  partyType === type ? "border-indigo bg-indigo-soft/60 shadow-sm" : "border-border hover:border-stone-deep"
                )}
              >
                <meta.icon className={cn("h-4 w-4", partyType === type ? "text-indigo" : "text-slate")} />
                <span className="text-xs font-medium text-ink">{meta.label}</span>
              </button>
            ))}
          </div>
        </div>

        {isMeeting ? (
          <div className="space-y-1.5">
            <Label>Meeting Title</Label>
            <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="e.g. Monthly Sales Review" />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Select value={city} onValueChange={(v) => { setCity(v); setPartyId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{partyMeta[partyType].label}</Label>
              <PartyPicker
                parties={parties}
                value={partyId}
                onSelect={setPartyId}
                disabled={parties.length === 0}
                placeholder={`Select ${partyMeta[partyType].label.toLowerCase()}`}
              />
              {parties.length === 0 && (
                <p className="text-xs text-signal-amber">
                  No {partyMeta[partyType].label.toLowerCase()}s found in {city || "this city"}. Try a different city.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Products to Target</Label>
              <ProductPicker
                products={products}
                excludeIds={productIds}
                onSelect={(id) => setProductIds([...productIds, id])}
              />
              {productIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {productIds.map((id) => {
                    const product = products.find((p) => p.id === id);
                    if (!product) return null;
                    return (
                      <Badge key={id} variant="secondary" className="gap-1 pr-1.5">
                        {product.name}
                        <button onClick={() => setProductIds(productIds.filter((p) => p !== id))} className="cursor-pointer hover:text-signal-rose">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {managers.length > 0 && (
              <div className="rounded-(--radius-sm) border border-dashed border-stone-deep p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-soft">Joint visit with manager?</span>
                  <div className="flex gap-1.5">
                    <Button type="button" size="sm" variant={isJointVisit ? "default" : "outline"} className="h-7 px-2.5 text-xs" onClick={() => { setIsJointVisit(true); if (!jointWithId) setJointWithId(managers[0].id); }}>Yes</Button>
                    <Button type="button" size="sm" variant={!isJointVisit ? "default" : "outline"} className="h-7 px-2.5 text-xs" onClick={() => setIsJointVisit(false)}>No</Button>
                  </div>
                </div>
                {isJointVisit && (
                  <Select value={jointWithId || managers[0].id} onValueChange={setJointWithId}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </>
        )}

        <div className="space-y-1.5">
          <Label>Notes (optional)</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="text-xs text-signal-rose">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!canSave || saving}>{saving ? "Saving..." : "Save Changes"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
