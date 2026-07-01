"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StepIndicator } from "@/components/visits/step-indicator";
import { useDoctors } from "@/lib/hooks/use-doctors";
import { useChemists } from "@/lib/hooks/use-chemists";
import { useStockists } from "@/lib/hooks/use-stockists";
import { useProducts } from "@/lib/hooks/use-products";
import { useVisit } from "@/lib/hooks/use-visits";
import { ProductPicker } from "@/components/shared/product-picker";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  X,
  CheckCircle2,
  Stethoscope,
  Store,
  Warehouse,
  Loader2,
  ShoppingCart,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { PartyType, VisitType } from "@/types";

const STEPS = [
  "Visit Type",
  "Party",
  "Visit & Products",
  "Feedback",
];

const partyTypeOptions: { value: PartyType; label: string; description: string; icon: typeof Stethoscope }[] = [
  { value: "doctor", label: "Doctor", description: "Prescriber visit", icon: Stethoscope },
  { value: "chemist", label: "Chemist", description: "Retail pharmacy visit", icon: Store },
  { value: "stockist", label: "Stockist", description: "Distributor visit", icon: Warehouse },
];

const feedbackLabel: Record<PartyType, string> = {
  doctor: "Doctor Feedback",
  chemist: "Chemist Feedback",
  stockist: "Stockist Feedback",
  meeting: "Feedback",
};

interface ProductLine {
  productId: string;
  sampleQuantity: number;
}

interface OrderLine {
  productId: string;
  units: number;
}

interface PartyOption {
  id: string;
  name: string;
  subtitle: string;
}

function buildPartyOptions(
  partyType: PartyType | null,
  doctors: { id: string; name: string; specialization: string; hospital: string; city: string }[],
  chemists: { id: string; name: string; ownerName: string; area: string; city: string }[],
  stockists: { id: string; name: string; ownerName: string; area: string; city: string }[]
): PartyOption[] {
  if (partyType === "doctor") {
    return doctors.map((d) => ({ id: d.id, name: d.name, subtitle: `${d.specialization} · ${d.hospital}, ${d.city}` }));
  }
  if (partyType === "chemist") {
    return chemists.map((c) => ({ id: c.id, name: c.name, subtitle: `${c.ownerName} · ${c.area}, ${c.city}` }));
  }
  if (partyType === "stockist") {
    return stockists.map((s) => ({ id: s.id, name: s.name, subtitle: `${s.ownerName} · ${s.area}, ${s.city}` }));
  }
  return [];
}

function NewVisitPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const planEntryId = searchParams.get("planEntryId");
  const prefillPartyType = (searchParams.get("partyType") as PartyType | null) ?? null;
  const prefillPartyId = searchParams.get("partyId");
  const prefillProductIds = searchParams.get("productIds")?.split(",").filter(Boolean) ?? [];
  const prefillDate = searchParams.get("date");
  const prefillTime = searchParams.get("time");
  const hasPrefill = !!prefillPartyType && !!prefillPartyId;

  const { doctors } = useDoctors();
  const { chemists } = useChemists();
  const { stockists } = useStockists();
  const { products } = useProducts();
  const { visit: editingVisit, loading: editLoading } = useVisit(editId ?? "");
  const [step, setStep] = useState(hasPrefill ? 2 : 0);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 0
  const [partyType, setPartyType] = useState<PartyType | null>(prefillPartyType);

  // Step 1
  const [partySearch, setPartySearch] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(prefillPartyId);

  // Step 2
  const [visitDate, setVisitDate] = useState(prefillDate || format(new Date(), "yyyy-MM-dd"));
  const [visitTime, setVisitTime] = useState(prefillTime || "10:00");
  const [visitType, setVisitType] = useState<VisitType>("new");

  // Step 3
  const [productLines, setProductLines] = useState<ProductLine[]>(
    hasPrefill ? prefillProductIds.map((id) => ({ productId: id, sampleQuantity: 0 })) : []
  );
  const [hasPersonalOrder, setHasPersonalOrder] = useState(false);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);

  // Step 4
  const [feedback, setFeedback] = useState("");
  const [competitorProducts, setCompetitorProducts] = useState("");
  const [marketFeedback, setMarketFeedback] = useState("");
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNotes, setReminderNotes] = useState("");

  const prefilledFromEdit = useRef(false);
  useEffect(() => {
    if (!editingVisit || prefilledFromEdit.current) return;
    prefilledFromEdit.current = true;
    setPartyType(editingVisit.partyType);
    setSelectedPartyId(editingVisit.partyId);
    setVisitDate(editingVisit.visitDate);
    setVisitTime(editingVisit.visitTime);
    setVisitType(editingVisit.visitType);
    setProductLines(editingVisit.products.map((p) => ({
      productId: p.productId,
      sampleQuantity: p.sampleQuantity,
    })));
    setHasPersonalOrder(editingVisit.hasPersonalOrder);
    setOrderLines(editingVisit.orderProducts.map((o) => ({ productId: o.productId, units: o.units })));
    setFeedback(editingVisit.feedback);
    setCompetitorProducts(editingVisit.competitorProducts);
    setMarketFeedback(editingVisit.marketFeedback);
    setHasReminder(!!editingVisit.nextFollowupDate);
    setReminderDate(editingVisit.nextFollowupDate ?? "");
    setReminderNotes(editingVisit.followUpNotes);
  }, [editingVisit]);

  const partyOptions = buildPartyOptions(partyType, doctors, chemists, stockists);
  const selectedParty = partyOptions.find((p) => p.id === selectedPartyId);
  const filteredParties = partyOptions.filter((p) =>
    p.name.toLowerCase().includes(partySearch.toLowerCase()) ||
    p.subtitle.toLowerCase().includes(partySearch.toLowerCase())
  );

  // When a doctor is selected, show only their allocated products in the picker
  const visibleProducts = useMemo(() => {
    if (partyType !== "doctor" || !selectedPartyId) return products;
    const doc = doctors.find((d) => d.id === selectedPartyId);
    const match = doc?.notes?.match(/^Products:\s*(.+)$/i);
    if (!match) return products;
    const allocated = match[1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const filtered = products.filter((p) =>
      allocated.some((a) => p.name.toLowerCase() === a || p.name.toLowerCase().includes(a) || a.includes(p.name.toLowerCase()))
    );
    return filtered.length > 0 ? filtered : products;
  }, [partyType, selectedPartyId, doctors, products]);

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!partyType;
      case 1:
        return !!selectedPartyId;
      case 2:
        return !!visitDate && productLines.length > 0;
      default:
        return true;
    }
  };

  const addProduct = (productId: string) => {
    if (productLines.find((p) => p.productId === productId)) return;
    setProductLines((prev) => [...prev, { productId, sampleQuantity: 0 }]);
  };

  const removeProduct = (productId: string) => {
    setProductLines((prev) => prev.filter((p) => p.productId !== productId));
  };

  const updateProductLine = (productId: string, patch: Partial<ProductLine>) => {
    setProductLines((prev) => prev.map((p) => (p.productId === productId ? { ...p, ...patch } : p)));
  };

  const addOrderLine = (productId: string) => {
    if (orderLines.find((o) => o.productId === productId)) return;
    setOrderLines((prev) => [...prev, { productId, units: 1 }]);
  };

  const removeOrderLine = (productId: string) => {
    setOrderLines((prev) => prev.filter((o) => o.productId !== productId));
  };

  const updateOrderLine = (productId: string, units: number) => {
    setOrderLines((prev) => prev.map((o) => (o.productId === productId ? { ...o, units } : o)));
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!partyType || !selectedParty) return;
    setSubmitting(true);
    const partyCity =
      (partyType === "doctor" ? doctors.find((d) => d.id === selectedParty.id)?.city : undefined) ??
      (partyType === "chemist" ? chemists.find((c) => c.id === selectedParty.id)?.city : undefined) ??
      (partyType === "stockist" ? stockists.find((s) => s.id === selectedParty.id)?.city : undefined) ??
      "";
    setSubmitError(null);
    const res = await fetch(editId ? `/api/visits/${editId}` : "/api/visits", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partyType,
        partyId: selectedParty.id,
        partyName: selectedParty.name,
        visitDate,
        visitTime,
        visitType,
        city: partyCity,
        products: productLines.map((line) => ({
          productId: line.productId,
          productName: products.find((p) => p.id === line.productId)?.name ?? "",
          sampleQuantity: line.sampleQuantity,
        })),
        hasPersonalOrder,
        orderProducts: hasPersonalOrder ? orderLines.map((o) => ({
          productId: o.productId,
          productName: products.find((p) => p.id === o.productId)?.name ?? "",
          units: o.units,
        })) : [],
        feedback,
        competitorProducts,
        marketFeedback,
        nextFollowupDate: hasReminder && reminderDate ? reminderDate : null,
        followUpNotes: hasReminder ? reminderNotes : "",
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setSubmitError(data?.error ?? "Failed to submit visit report.");
      return;
    }
    if (!editId && planEntryId) {
      await fetch(`/api/plan-entries/${planEntryId}`, { method: "DELETE" });
    }
    setSubmitted(true);
    setTimeout(() => {
      router.push(editId ? `/visits/${editId}` : "/visits");
    }, 1800);
  };

  if (editId && editLoading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8 text-slate-light gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading visit report...
        </div>
      </AppShell>
    );
  }

  if (editId && !editLoading && !editingVisit) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-ink font-medium">Visit report not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/visits")}>Back to Visit Reports</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (submitted) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-soft"
            >
              <CheckCircle2 className="h-8 w-8 text-indigo" />
            </motion.div>
            <h2 className="font-display text-2xl text-ink">Visit report {editId ? "updated" : "submitted"}</h2>
            <p className="text-sm text-slate mt-1.5">Redirecting you...</p>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar
        title={editId ? "Edit Visit Report" : "New Visit Report"}
        subtitle={editId ? "Update the details of this visit report" : "Log a field visit in a few quick steps"}
      />

      <div className="flex-1 p-5 lg:p-8">
        <div className="lg:hidden mb-5">
          <h1 className="font-display text-2xl text-ink">{editId ? "Edit Visit Report" : "New Visit Report"}</h1>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="p-5 lg:p-7 mb-6">
            <StepIndicator steps={STEPS} current={step} />
          </Card>

          <Card>
            <CardContent className="p-6 lg:p-8 min-h-[420px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* STEP 0: Visit Type */}
                  {step === 0 && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-display text-xl text-ink">Visit Type</h3>
                        <p className="text-sm text-slate mt-1">Who did you visit for this report?</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {partyTypeOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setPartyType(opt.value);
                              setSelectedPartyId(null);
                            }}
                            className={cn(
                              "flex flex-col items-center gap-2.5 rounded-(--radius) border p-5 text-center transition-all cursor-pointer",
                              partyType === opt.value
                                ? "border-indigo bg-indigo-soft/60 shadow-sm"
                                : "border-border hover:border-stone-deep hover:bg-porcelain-dim/40"
                            )}
                          >
                            <div className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-full",
                              partyType === opt.value ? "bg-indigo text-white" : "bg-porcelain-dim text-slate"
                            )}>
                              <opt.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-ink">{opt.label}</p>
                              <p className="text-xs text-slate mt-0.5">{opt.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 1: Select Party */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-display text-xl text-ink">Select {partyType ? partyTypeOptions.find((o) => o.value === partyType)?.label : "Party"}</h3>
                        <p className="text-sm text-slate mt-1">Search and select who you met for this visit.</p>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-light" />
                        <Input
                          placeholder="Search by name..."
                          value={partySearch}
                          onChange={(e) => setPartySearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
                        {filteredParties.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedPartyId(p.id)}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-(--radius) border p-3.5 text-left transition-all cursor-pointer",
                              selectedPartyId === p.id
                                ? "border-indigo bg-indigo-soft/60 shadow-sm"
                                : "border-border hover:border-stone-deep hover:bg-porcelain-dim/40"
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink">{p.name}</p>
                              <p className="text-xs text-slate mt-0.5">{p.subtitle}</p>
                            </div>
                            {selectedPartyId === p.id && (
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                        {filteredParties.length === 0 && (
                          <p className="text-sm text-slate-light text-center py-6">No matches found.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Visit & Products */}
                  {step === 2 && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-display text-xl text-ink">Visit & Products</h3>
                        <p className="text-sm text-slate mt-1">When did this visit take place, and what did you discuss?</p>
                      </div>
                      {selectedParty && (
                        <div className="flex items-center gap-3 rounded-(--radius) bg-porcelain-dim p-3.5">
                          {partyType && (() => {
                            const Icon = partyTypeOptions.find((o) => o.value === partyType)!.icon;
                            return <Icon className="h-4 w-4 text-indigo shrink-0" />;
                          })()}
                          <div>
                            <p className="text-sm font-medium text-ink">{selectedParty.name}</p>
                            <p className="text-xs text-slate">{selectedParty.subtitle}</p>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Visit Date</Label>
                        <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Visit Type</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {([
                            { value: "new", label: "New Visit" },
                            { value: "follow_up", label: "Follow Up" },
                          ] as { value: VisitType; label: string }[]).map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setVisitType(opt.value)}
                              className={cn(
                                "rounded-(--radius) border px-4 py-3 text-sm font-medium transition-all cursor-pointer",
                                visitType === opt.value
                                  ? "border-indigo bg-indigo-soft text-indigo-deep"
                                  : "border-border text-slate hover:border-stone-deep"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-border pt-5 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-ink">Products</h4>
                          <p className="text-xs text-slate mt-0.5">Add products discussed and samples given.</p>
                        </div>
                      <ProductPicker
                        products={visibleProducts}
                        excludeIds={productLines.map((pl) => pl.productId)}
                        onSelect={addProduct}
                      />

                      <div className="space-y-3">
                        <AnimatePresence>
                          {productLines.map((line) => {
                            const product = products.find((p) => p.id === line.productId);
                            if (!product) return null;
                            return (
                              <motion.div
                                key={line.productId}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="rounded-(--radius) border border-border p-4 overflow-hidden"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-ink">{product.name}</p>
                                    <p className="text-xs text-slate mt-0.5">{product.brand}</p>
                                  </div>
                                  <button onClick={() => removeProduct(line.productId)} className="text-slate-light hover:text-signal-rose transition-colors cursor-pointer">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="mt-3.5">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">{partyType === "doctor" ? "Sample Units Requested" : "Quantity"}</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={line.sampleQuantity}
                                      onChange={(e) => updateProductLine(line.productId, { sampleQuantity: Number(e.target.value) })}
                                      className="h-9"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                        {productLines.length === 0 && (
                          <p className="text-sm text-slate-light text-center py-8 border border-dashed border-stone rounded-(--radius)">
                            No products added yet.
                          </p>
                        )}
                        </div>
                      </div>

                      <div className="border-t border-border pt-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-ink flex items-center gap-1.5"><ShoppingCart className="h-4 w-4 text-indigo" /> Personal Order Booking</h4>
                            <p className="text-xs text-slate mt-0.5">Did they place a personal order for any product?</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              variant={hasPersonalOrder ? "default" : "outline"}
                              onClick={() => setHasPersonalOrder(true)}
                            >
                              Yes
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={!hasPersonalOrder ? "default" : "outline"}
                              onClick={() => { setHasPersonalOrder(false); setOrderLines([]); }}
                            >
                              No
                            </Button>
                          </div>
                        </div>

                        {hasPersonalOrder && (
                          <>
                            <ProductPicker
                              products={products}
                              excludeIds={orderLines.map((o) => o.productId)}
                              onSelect={addOrderLine}
                              placeholder="Add an ordered product"
                            />
                            <div className="space-y-2.5">
                              {orderLines.map((line) => {
                                const product = products.find((p) => p.id === line.productId);
                                return (
                                  <div key={line.productId} className="flex items-center justify-between gap-3 rounded-(--radius) border border-border p-3">
                                    <p className="text-sm font-medium text-ink min-w-0 truncate">{product?.name ?? line.productId}</p>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Label className="text-xs text-slate-light">Units</Label>
                                      <Input
                                        type="number"
                                        min={1}
                                        value={line.units}
                                        onChange={(e) => updateOrderLine(line.productId, Number(e.target.value))}
                                        className="h-8 w-20"
                                      />
                                      <button onClick={() => removeOrderLine(line.productId)} className="text-slate-light hover:text-signal-rose transition-colors cursor-pointer">
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                              {orderLines.length === 0 && (
                                <p className="text-xs text-slate-light text-center py-4 border border-dashed border-stone rounded-(--radius)">
                                  No ordered products added yet.
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Feedback */}
                  {step === 3 && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-display text-xl text-ink">{partyType ? feedbackLabel[partyType] : "Feedback"}</h3>
                        <p className="text-sm text-slate mt-1">Capture their response and market context.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>{partyType ? feedbackLabel[partyType] : "Feedback"}</Label>
                        <Textarea
                          rows={3}
                          placeholder="How did they respond to the discussion?"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Competitor Products Mentioned</Label>
                        <Input
                          placeholder="e.g. Cetaphil PRO, La Roche-Posay Effaclar"
                          value={competitorProducts}
                          onChange={(e) => setCompetitorProducts(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Market Feedback</Label>
                        <Textarea
                          rows={3}
                          placeholder="Any broader market or patient trends mentioned?"
                          value={marketFeedback}
                          onChange={(e) => setMarketFeedback(e.target.value)}
                        />
                      </div>

                      <div className="border-t border-border pt-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-ink flex items-center gap-1.5"><Bell className="h-4 w-4 text-indigo" /> Set a Reminder</h4>
                            <p className="text-xs text-slate mt-0.5">Follow up with them again on a specific date?</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button type="button" size="sm" variant={hasReminder ? "default" : "outline"} onClick={() => setHasReminder(true)}>
                              Yes
                            </Button>
                            <Button type="button" size="sm" variant={!hasReminder ? "default" : "outline"} onClick={() => { setHasReminder(false); setReminderDate(""); setReminderNotes(""); }}>
                              No
                            </Button>
                          </div>
                        </div>

                        {hasReminder && (
                          <>
                            <div className="space-y-2">
                              <Label>Reminder Date</Label>
                              <Input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Reminder Notes</Label>
                              <Textarea
                                rows={2}
                                placeholder="What should the reminder be about?"
                                value={reminderNotes}
                                onChange={(e) => setReminderNotes(e.target.value)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            {/* Footer navigation */}
            <div className="flex items-center justify-between border-t border-border px-6 lg:px-8 py-5 gap-4">
              <Button
                variant="outline"
                onClick={() => (step === 0 ? router.push("/visits") : setStep((s) => s - 1))}
              >
                <ArrowLeft className="h-4 w-4" />
                {step === 0 ? "Cancel" : "Back"}
              </Button>

              {submitError && <p className="text-xs text-signal-rose flex-1 text-right">{submitError}</p>}

              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Saving..." : editId ? "Save Changes" : "Submit Report"} <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default function NewVisitPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex-1 flex items-center justify-center p-8 text-slate-light">Loading...</div>
        </AppShell>
      }
    >
      <NewVisitPageInner />
    </Suspense>
  );
}
