"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { PageHeaderMobile } from "@/components/layout/page-header-mobile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useLeaves } from "@/lib/hooks/use-leaves";
import type { Leave, LeaveType } from "@/types";
import { Plus, Loader2, CalendarOff, Check, X, Undo2 } from "lucide-react";
import { motion } from "framer-motion";
import { differenceInCalendarDays, format } from "date-fns";
import { cn } from "@/lib/utils";

const leaveTypeMeta: Record<LeaveType, { label: string; badge: "default" | "rose" }> = {
  casual: { label: "Casual", badge: "default" },
  sick: { label: "Sick", badge: "rose" },
};

const statusMeta = {
  pending: { label: "Pending", badge: "amber" as const },
  approved: { label: "Approved", badge: "default" as const },
  rejected: { label: "Rejected", badge: "rose" as const },
};

export default function LeavePage() {
  const { user: currentUser } = useCurrentUser();
  const { leaves, loading, refetch } = useLeaves();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const canReview = currentUser?.role === "admin" || currentUser?.role === "manager";

  const filtered = useMemo(
    () => (statusFilter === "all" ? leaves : leaves.filter((l) => l.status === statusFilter)),
    [leaves, statusFilter]
  );

  const counts = useMemo(() => ({
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  }), [leaves]);

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    setActioningId(id);
    await fetch(`/api/leaves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActioningId(null);
    await refetch();
  };

  const handleWithdraw = async (id: string) => {
    setActioningId(id);
    await fetch(`/api/leaves/${id}`, { method: "DELETE" });
    setActioningId(null);
    await refetch();
  };

  return (
    <AppShell>
      <TopBar
        title="Leave"
        subtitle={canReview ? `${leaves.length} leave requests across your team` : `${leaves.length} leave requests`}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Apply for Leave</Button>}
      />

      <div className="flex-1 p-5 lg:p-8 space-y-5">
        <div className="flex items-center justify-between lg:hidden">
          <PageHeaderMobile title="Leave" subtitle={`${leaves.length} requests`} />
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Apply</Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending", value: counts.pending },
            { label: "Approved", value: counts.approved },
            { label: "Rejected", value: counts.rejected },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 text-center">
                <p className="font-display text-3xl text-ink">{card.value}</p>
                <p className="text-sm text-slate mt-1">{card.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
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

        {loading && leaves.length === 0 && (
          <div className="flex items-center justify-center py-16 text-slate-light gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading leave requests...
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((l, i) => {
            const days = differenceInCalendarDays(new Date(l.toDate), new Date(l.fromDate)) + 1;
            const isOwner = l.userId === currentUser?.id;
            const acting = actioningId === l.id;
            return (
              <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-soft">
                        <CalendarOff className="h-4 w-4 text-indigo" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{l.userName}</p>
                        <p className="text-xs text-slate mt-0.5">
                          {format(new Date(l.fromDate), "MMM d, yyyy")} – {format(new Date(l.toDate), "MMM d, yyyy")} · {days} day{days !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={leaveTypeMeta[l.leaveType].badge}>{leaveTypeMeta[l.leaveType].label}</Badge>
                      <Badge variant={statusMeta[l.status].badge}>{statusMeta[l.status].label}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-slate mt-3">{l.reason}</p>
                  {l.status !== "pending" && l.reviewedBy && (
                    <p className="text-xs text-slate-light mt-2">Reviewed by {l.reviewedBy}{l.reviewNotes ? `: ${l.reviewNotes}` : ""}</p>
                  )}

                  {l.status === "pending" && (
                    <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-border">
                      {canReview ? (
                        <>
                          <Button size="sm" onClick={() => handleReview(l.id, "approved")} disabled={acting}>
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReview(l.id, "rejected")} disabled={acting}>
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </>
                      ) : isOwner ? (
                        <Button size="sm" variant="outline" onClick={() => handleWithdraw(l.id)} disabled={acting}>
                          <Undo2 className="h-3.5 w-3.5" /> Withdraw
                        </Button>
                      ) : null}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-slate-light text-center py-12">No leave requests match this filter.</p>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <ApplyLeaveDialogContent onClose={() => setOpen(false)} onSaved={refetch} />
      </Dialog>
    </AppShell>
  );
}

function ApplyLeaveDialogContent({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [leaveType, setLeaveType] = useState<LeaveType>("casual");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!fromDate && !!toDate && toDate >= fromDate && !!reason.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaveType, fromDate, toDate, reason }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to submit leave request.");
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Apply for Leave</DialogTitle>
        <DialogDescription>Submit a leave request for approval.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label>Leave Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(leaveTypeMeta) as [LeaveType, typeof leaveTypeMeta.casual][]).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => setLeaveType(type)}
                className={cn(
                  "rounded-(--radius-sm) border px-2 py-2.5 text-xs font-medium transition-all cursor-pointer",
                  leaveType === type ? "border-indigo bg-indigo-soft/60 text-indigo-deep shadow-sm" : "border-border text-slate hover:border-stone-deep"
                )}
              >
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>From</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
        {fromDate && toDate && toDate < fromDate && (
          <p className="text-xs text-signal-rose">End date must be on or after the start date.</p>
        )}

        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Textarea rows={3} placeholder="Briefly describe the reason for leave..." value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {error && <p className="text-xs text-signal-rose">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || saving}>{saving ? "Submitting..." : "Submit Request"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
