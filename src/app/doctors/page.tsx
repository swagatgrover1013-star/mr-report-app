"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { PageHeaderMobile } from "@/components/layout/page-header-mobile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useDoctors } from "@/lib/hooks/use-doctors";
import { useChemists } from "@/lib/hooks/use-chemists";
import { useStockists } from "@/lib/hooks/use-stockists";
import { useProducts } from "@/lib/hooks/use-products";
import { useUsers } from "@/lib/hooks/use-users";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import {
  Plus, Search, MapPin, Building2, Phone, ArrowUpRight, Loader2,
  User2, Store, Warehouse, Wallet, Stethoscope, FlaskConical,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const tierStyles = {
  platinum: { label: "Platinum", badge: "ink" as const },
  gold: { label: "Gold", badge: "brass" as const },
  silver: { label: "Silver", badge: "secondary" as const },
};

type NetworkTab = "doctor" | "chemist" | "stockist" | "product";

const tabMeta: Record<NetworkTab, { label: string; singular: string; icon: typeof Stethoscope }> = {
  doctor: { label: "Doctors", singular: "Doctor", icon: Stethoscope },
  chemist: { label: "Chemists", singular: "Chemist", icon: Store },
  stockist: { label: "Stockists", singular: "Stockist", icon: Warehouse },
  product: { label: "Products", singular: "Product", icon: FlaskConical },
};

const currency = (n: number) => `₹${(n / 1000).toFixed(0)}K`;

function PartiesPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as NetworkTab | null) ?? "doctor";
  const [activeTab, setActiveTab] = useState<NetworkTab>(
    initialTab === "chemist" || initialTab === "stockist" || initialTab === "product" ? initialTab : "doctor"
  );
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [open, setOpen] = useState(false);

  const { doctors, loading: doctorsLoading, refetch: refetchDoctors } = useDoctors();
  const { chemists, loading: chemistsLoading, refetch: refetchChemists } = useChemists();
  const { stockists, loading: stockistsLoading, refetch: refetchStockists } = useStockists();
  const { products, loading: productsLoading, refetch: refetchProducts } = useProducts();
  const { users } = useUsers();
  const { user: currentUser } = useCurrentUser();
  const mrs = users.filter((u) => u.role === "mr");
  const canAssignMr = currentUser?.role === "admin" || currentUser?.role === "manager";

  const switchTab = (tab: NetworkTab) => {
    setActiveTab(tab);
    setSearch("");
    setCityFilter("all");
    router.replace(`/doctors?tab=${tab}`, { scroll: false });
  };

  const cities = useMemo(() => {
    if (activeTab === "product") return [];
    const source = activeTab === "doctor" ? doctors : activeTab === "chemist" ? chemists : stockists;
    return Array.from(new Set(source.map((p) => p.city)));
  }, [activeTab, doctors, chemists, stockists]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.hospital.toLowerCase().includes(search.toLowerCase())) return false;
      if (cityFilter !== "all" && d.city !== cityFilter) return false;
      return true;
    });
  }, [doctors, search, cityFilter]);

  const filteredChemists = useMemo(() => {
    return chemists.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.ownerName.toLowerCase().includes(search.toLowerCase())) return false;
      if (cityFilter !== "all" && c.city !== cityFilter) return false;
      return true;
    });
  }, [chemists, search, cityFilter]);

  const filteredStockists = useMemo(() => {
    return stockists.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.ownerName.toLowerCase().includes(search.toLowerCase())) return false;
      if (cityFilter !== "all" && s.city !== cityFilter) return false;
      return true;
    });
  }, [stockists, search, cityFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const count =
    activeTab === "doctor" ? filteredDoctors.length :
    activeTab === "chemist" ? filteredChemists.length :
    activeTab === "stockist" ? filteredStockists.length :
    filteredProducts.length;
  const loading =
    activeTab === "doctor" ? doctorsLoading :
    activeTab === "chemist" ? chemistsLoading :
    activeTab === "stockist" ? stockistsLoading :
    productsLoading;
  const meta = tabMeta[activeTab];

  return (
    <AppShell>
      <TopBar
        title={meta.label}
        subtitle={`${count} ${meta.label.toLowerCase()} in your network`}
        action={
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add {meta.singular}</Button>
        }
      />

      <div className="flex-1 p-5 lg:p-8 space-y-5">
        <div className="flex items-center justify-between lg:hidden">
          <PageHeaderMobile title={meta.label} subtitle={`${count} ${meta.label.toLowerCase()}`} />
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add</Button>
        </div>

        <Card className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["doctor", "chemist", "stockist", "product"] as NetworkTab[]).map((tab) => {
              const tm = tabMeta[tab];
              return (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-(--radius-sm) border px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
                    activeTab === tab ? "border-indigo bg-indigo-soft/60 text-indigo-deep shadow-sm" : "border-border text-slate hover:border-stone-deep"
                  )}
                >
                  <tm.icon className="h-4 w-4" />
                  {tm.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-light" />
              <Input placeholder={`Search ${meta.label.toLowerCase()}${activeTab === "product" ? " or brands" : ""}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            {activeTab !== "product" && (
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="City" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </Card>

        {loading && count === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-light gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading {meta.label.toLowerCase()}...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === "doctor" && filteredDoctors.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                <Link href={`/doctors/${d.id}`}>
                  <Card className="p-5 h-full hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink truncate">{d.name}</p>
                        <p className="text-xs text-slate mt-0.5">{d.specialization}</p>
                      </div>
                      <Badge variant={tierStyles[d.tier].badge}>{tierStyles[d.tier].label}</Badge>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate">
                      <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{d.hospital}</span></div>
                      <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{d.area}, {d.city}</span></div>
                      <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{d.phone}</span></div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border">
                      <div>
                        <span className="text-xs text-slate">Last visit</span>
                        <p className="text-xs font-medium text-ink-soft">{d.lastVisitDate ? format(new Date(d.lastVisitDate), "MMM d") : "—"}</p>
                      </div>
                      <div className="flex items-center gap-1 text-indigo text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View profile <ArrowUpRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}

            {activeTab === "chemist" && filteredChemists.map((c, i) => {
              const stockist = stockists.find((s) => s.id === c.stockistId);
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                  <Link href={`/chemists/${c.id}`}>
                    <Card className="p-5 h-full hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">{c.name}</p>
                          <p className="text-xs text-slate mt-0.5">{c.ownerName}</p>
                        </div>
                        <Badge variant={tierStyles[c.tier].badge}>{tierStyles[c.tier].label}</Badge>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate">
                        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{c.area}, {c.city}</span></div>
                        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{c.phone}</span></div>
                        {stockist && (
                          <div className="flex items-center gap-1.5"><Store className="h-3.5 w-3.5 shrink-0" /><span className="truncate">Supplied by {stockist.name}</span></div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border">
                        <div>
                          <span className="text-xs text-slate">Last visit</span>
                          <p className="text-xs font-medium text-ink-soft">{c.lastVisitDate ? format(new Date(c.lastVisitDate), "MMM d") : "—"}</p>
                        </div>
                        <div className="flex items-center gap-1 text-indigo text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          View profile <ArrowUpRight className="h-3 w-3" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}

            {activeTab === "stockist" && filteredStockists.map((s, i) => {
              const suppliedCount = chemists.filter((c) => c.stockistId === s.id).length;
              return (
                <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                  <Link href={`/stockists/${s.id}`}>
                    <Card className="p-5 h-full hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">{s.name}</p>
                          <p className="text-xs text-slate mt-0.5">{s.ownerName}</p>
                        </div>
                        <Badge variant={tierStyles[s.tier].badge}>{tierStyles[s.tier].label}</Badge>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate">
                        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{s.area}, {s.city}</span></div>
                        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{s.phone}</span></div>
                        <div className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{currency(s.monthlyOrderValue)}/mo · {suppliedCount} chemists supplied</span></div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border">
                        <div>
                          <span className="text-xs text-slate">Last visit</span>
                          <p className="text-xs font-medium text-ink-soft">{s.lastVisitDate ? format(new Date(s.lastVisitDate), "MMM d") : "—"}</p>
                        </div>
                        <div className="flex items-center gap-1 text-indigo text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          View profile <ArrowUpRight className="h-3 w-3" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}

            {activeTab === "product" && filteredProducts.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                <Link href={`/products/${p.id}`}>
                  <Card className="p-5 h-full hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className="flex items-start gap-3 mb-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-sm) bg-indigo-soft">
                        <FlaskConical className="h-5 w-5 text-indigo-deep" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-ink text-sm leading-snug">{p.name}</p>
                        <p className="text-xs text-slate mt-0.5">{p.brand}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3.5">
                      <Badge variant="secondary">{p.category}</Badge>
                      <Badge variant="outline">{p.dosageForm}</Badge>
                    </div>
                    <p className="text-xs text-slate leading-relaxed line-clamp-2">{p.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-sm font-mono text-ink-soft">{p.totalMentions}</p>
                          <p className="text-[10px] text-slate">mentions</p>
                        </div>
                        <div>
                          <p className="text-sm font-mono text-ink-soft">{p.doctorsRecommending}</p>
                          <p className="text-[10px] text-slate">doctors</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-indigo text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Details <ArrowUpRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        {activeTab === "doctor" && (
          <AddDoctorDialogContent mrs={canAssignMr ? mrs : []} onClose={() => setOpen(false)} onSaved={refetchDoctors} />
        )}
        {activeTab === "chemist" && (
          <AddChemistDialogContent stockists={stockists} mrs={canAssignMr ? mrs : []} onClose={() => setOpen(false)} onSaved={refetchChemists} />
        )}
        {activeTab === "stockist" && (
          <AddStockistDialogContent onClose={() => setOpen(false)} onSaved={refetchStockists} />
        )}
        {activeTab === "product" && (
          <AddProductDialogContent onClose={() => setOpen(false)} onSaved={refetchProducts} />
        )}
      </Dialog>
    </AppShell>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex-1 flex items-center justify-center p-8 text-slate-light">Loading...</div>
        </AppShell>
      }
    >
      <PartiesPageInner />
    </Suspense>
  );
}

function AddDoctorDialogContent({ mrs, onClose, onSaved }: { mrs: { id: string; name: string }[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", specialization: "", qualification: "", hospital: "",
    city: "", area: "", address: "", phone: "", email: "",
    visitFrequency: "Bi-weekly", notes: "", assignedMrId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.specialization || !form.city) {
      setError("Doctor name, specialization, and city are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assignedMrId: form.assignedMrId || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to add doctor.");
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add Doctor</DialogTitle>
        <DialogDescription>Add a new doctor to your visit network.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5 col-span-2">
          <Label>Doctor Name</Label>
          <Input placeholder="Dr. Jane Doe" value={form.name} onChange={set("name")} />
        </div>
        <div className="space-y-1.5">
          <Label>Specialization</Label>
          <Input placeholder="Dermatology" value={form.specialization} onChange={set("specialization")} />
        </div>
        <div className="space-y-1.5">
          <Label>Qualification</Label>
          <Input placeholder="MD, DVD" value={form.qualification} onChange={set("qualification")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Hospital / Clinic</Label>
          <Input placeholder="City Hospital" value={form.hospital} onChange={set("hospital")} />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input placeholder="Mumbai" value={form.city} onChange={set("city")} />
        </div>
        <div className="space-y-1.5">
          <Label>Area</Label>
          <Input placeholder="Bandra West" value={form.area} onChange={set("area")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Address</Label>
          <Input placeholder="Full address" value={form.address} onChange={set("address")} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone Number</Label>
          <Input placeholder="+91 22 0000 0000" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" placeholder="doctor@hospital.in" value={form.email} onChange={set("email")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Frequency of Visits</Label>
          <Select value={form.visitFrequency} onValueChange={(v) => setForm((f) => ({ ...f, visitFrequency: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Notes</Label>
          <Textarea rows={3} placeholder="Preferences, interests, etc." value={form.notes} onChange={set("notes")} />
        </div>
        {mrs.length > 0 && (
          <div className="space-y-1.5 col-span-2">
            <Label>Assign to MR</Label>
            <Select value={form.assignedMrId} onValueChange={(v) => setForm((f) => ({ ...f, assignedMrId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select medical representative" /></SelectTrigger>
              <SelectContent>
                {mrs.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {error && <p className="text-xs text-signal-rose col-span-2">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Add Doctor"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AddChemistDialogContent({
  stockists, mrs, onClose, onSaved,
}: { stockists: { id: string; name: string }[]; mrs: { id: string; name: string }[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", ownerName: "", city: "", area: "", address: "", phone: "", gstNumber: "", stockistId: "", assignedMrId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.city) {
      setError("Shop name and city are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/chemists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, stockistId: form.stockistId || null, assignedMrId: form.assignedMrId || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to add chemist.");
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add Chemist</DialogTitle>
        <DialogDescription>Add a new chemist/pharmacy to your visit network.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5 col-span-2">
          <Label>Shop Name</Label>
          <Input placeholder="Raj Medicos" value={form.name} onChange={set("name")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Owner Name</Label>
          <div className="relative">
            <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-light" />
            <Input className="pl-9" placeholder="Rajendra Shah" value={form.ownerName} onChange={set("ownerName")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input placeholder="Mumbai" value={form.city} onChange={set("city")} />
        </div>
        <div className="space-y-1.5">
          <Label>Area</Label>
          <Input placeholder="Bandra West" value={form.area} onChange={set("area")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Address</Label>
          <Input placeholder="Full address" value={form.address} onChange={set("address")} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone Number</Label>
          <Input placeholder="+91 22 0000 0000" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label>GST Number</Label>
          <Input placeholder="27AAAAA0000A1Z5" value={form.gstNumber} onChange={set("gstNumber")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Supplying Stockist</Label>
          <Select value={form.stockistId} onValueChange={(v) => setForm((f) => ({ ...f, stockistId: v }))}>
            <SelectTrigger><SelectValue placeholder="Select stockist" /></SelectTrigger>
            <SelectContent>
              {stockists.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {mrs.length > 0 && (
          <div className="space-y-1.5 col-span-2">
            <Label>Assign to MR</Label>
            <Select value={form.assignedMrId} onValueChange={(v) => setForm((f) => ({ ...f, assignedMrId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select medical representative" /></SelectTrigger>
              <SelectContent>
                {mrs.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {error && <p className="text-xs text-signal-rose col-span-2">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Add Chemist"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AddStockistDialogContent({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", ownerName: "", city: "", area: "", address: "", phone: "", gstNumber: "", monthlyOrderValue: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.city) {
      setError("Distributor name and city are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/stockists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, monthlyOrderValue: Number(form.monthlyOrderValue) || 0 }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to add stockist.");
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add Stockist</DialogTitle>
        <DialogDescription>Add a new distributor to your visit network.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5 col-span-2">
          <Label>Distributor Name</Label>
          <Input placeholder="Mumbai Pharma Distributors" value={form.name} onChange={set("name")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Owner Name</Label>
          <div className="relative">
            <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-light" />
            <Input className="pl-9" placeholder="Dinesh Aggarwal" value={form.ownerName} onChange={set("ownerName")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input placeholder="Mumbai" value={form.city} onChange={set("city")} />
        </div>
        <div className="space-y-1.5">
          <Label>Area</Label>
          <Input placeholder="Andheri East" value={form.area} onChange={set("area")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Address</Label>
          <Input placeholder="Full address" value={form.address} onChange={set("address")} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone Number</Label>
          <Input placeholder="+91 22 0000 0000" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label>GST Number</Label>
          <Input placeholder="27AAAAA0000A1Z5" value={form.gstNumber} onChange={set("gstNumber")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Monthly Order Value (₹)</Label>
          <Input type="number" placeholder="500000" value={form.monthlyOrderValue} onChange={set("monthlyOrderValue")} />
        </div>
        {error && <p className="text-xs text-signal-rose col-span-2">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Add Stockist"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AddProductDialogContent({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", category: "Cosmeceutical", brand: "", strength: "", dosageForm: "", description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name) {
      setError("Product name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to add product.");
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add Product</DialogTitle>
        <DialogDescription>Add a new product to the catalog.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5 col-span-2">
          <Label>Product Name</Label>
          <Input placeholder="e.g. Lumiclear Retinol Serum" value={form.name} onChange={set("name")} />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Cosmeceutical">Cosmeceutical</SelectItem>
              <SelectItem value="Sun Care">Sun Care</SelectItem>
              <SelectItem value="Trichology">Trichology</SelectItem>
              <SelectItem value="General">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Brand</Label>
          <Input placeholder="Aurel Derma" value={form.brand} onChange={set("brand")} />
        </div>
        <div className="space-y-1.5">
          <Label>Strength</Label>
          <Input placeholder="e.g. 0.3%" value={form.strength} onChange={set("strength")} />
        </div>
        <div className="space-y-1.5">
          <Label>Dosage Form</Label>
          <Input placeholder="Serum, Cream, Gel..." value={form.dosageForm} onChange={set("dosageForm")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Description</Label>
          <Textarea rows={3} placeholder="Brief product description" value={form.description} onChange={set("description")} />
        </div>
        {error && <p className="text-xs text-signal-rose col-span-2">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Add Product"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
