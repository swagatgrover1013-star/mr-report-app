"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProduct } from "@/lib/hooks/use-products";
import { useVisits } from "@/lib/hooks/use-visits";
import { useDoctors } from "@/lib/hooks/use-doctors";
import { ArrowLeft, FlaskConical, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { product, loading } = useProduct(params.id as string);
  const { visits } = useVisits();
  const { doctors } = useDoctors();
  const relatedVisits = visits.filter((v) => v.products.some((p) => p.productId === params.id));

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8 text-slate-light gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading product...
        </div>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-ink font-medium">Product not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/doctors?tab=product")}>Back to Products</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const doctorIds = Array.from(
    new Set(relatedVisits.filter((v) => v.partyType === "doctor").map((v) => v.partyId))
  );
  const associatedDoctors = doctors.filter((d) => doctorIds.includes(d.id));

  return (
    <AppShell>
      <TopBar title="Product" subtitle={product.name} />
      <div className="flex-1 p-5 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-5">
          <Button variant="ghost" size="sm" onClick={() => router.push("/doctors?tab=product")}>
            <ArrowLeft className="h-4 w-4" /> Back to Products
          </Button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 lg:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-(--radius) bg-indigo-soft">
                  <FlaskConical className="h-6 w-6 text-indigo-deep" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-2xl text-ink">{product.name}</h2>
                  <p className="text-sm text-slate mt-1">{product.brand} · {product.strength !== "—" ? product.strength : ""} {product.dosageForm}</p>
                  <p className="text-sm text-ink-soft leading-relaxed mt-3">{product.description}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="secondary">{product.category}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                <div className="text-center">
                  <p className="font-display text-3xl text-ink">{product.totalMentions}</p>
                  <p className="text-xs text-slate mt-0.5">Total Mentions</p>
                </div>
                <div className="text-center border-l border-border">
                  <p className="font-display text-3xl text-ink">{product.doctorsRecommending}</p>
                  <p className="text-xs text-slate mt-0.5">Doctors Recommending</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <Card>
            <CardHeader>
              <CardTitle>Doctors Associated</CardTitle>
              <CardDescription>{associatedDoctors.length} doctors have discussed this product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 max-h-72 overflow-y-auto">
              {associatedDoctors.map((d) => (
                <Link key={d.id} href={`/doctors/${d.id}`} className="flex items-center justify-between rounded-(--radius-sm) px-3 py-2.5 hover:bg-porcelain-dim transition-colors">
                  <div>
                    <p className="text-sm font-medium text-ink">{d.name}</p>
                    <p className="text-xs text-slate">{d.hospital}</p>
                  </div>
                </Link>
              ))}
              {associatedDoctors.length === 0 && <p className="text-sm text-slate-light text-center py-6">No doctors yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
