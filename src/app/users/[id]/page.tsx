"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/lib/hooks/use-users";
import { useDoctors } from "@/lib/hooks/use-doctors";
import { useChemists } from "@/lib/hooks/use-chemists";
import { ArrowLeft, Building2, MapPin, Stethoscope, Store, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const roleBadge = {
  admin: "ink" as const,
  manager: "brass" as const,
  mr: "default" as const,
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useUser(params.id as string);
  const { doctors, loading: doctorsLoading } = useDoctors();
  const { chemists, loading: chemistsLoading } = useChemists();

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8 text-slate-light gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading user...
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-ink font-medium">User not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/users")}>Back to Users</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const assignedDoctors = doctors.filter((d) => d.assignedMrId === user.id);
  const assignedChemists = chemists.filter((c) => c.assignedMrId === user.id);
  const initials = user.name.split(" ").map((n) => n[0]).join("");

  return (
    <AppShell>
      <TopBar title="User Profile" subtitle={user.name} />

      <div className="flex-1 p-5 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-5">
          <Button variant="ghost" size="sm" onClick={() => router.push("/users")}>
            <ArrowLeft className="h-4 w-4" /> Back to Users
          </Button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarFallback className="text-lg" style={{ background: user.avatarColor }}>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="font-display text-2xl text-ink">{user.name}</h2>
                      <p className="text-sm text-slate mt-1">{user.email} · {user.employeeId}</p>
                    </div>
                    <Badge variant={roleBadge[user.role]} className="capitalize">{user.role}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-sm text-ink-soft">
                    <MapPin className="h-4 w-4 text-indigo shrink-0" /> {user.territory}
                  </div>
                </div>
              </div>

              {user.role === "mr" && (
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                  <div className="text-center">
                    <p className="font-display text-2xl text-ink">{assignedDoctors.length}</p>
                    <p className="text-xs text-slate mt-0.5">Assigned Doctors</p>
                  </div>
                  <div className="text-center border-l border-border">
                    <p className="font-display text-2xl text-ink">{assignedChemists.length}</p>
                    <p className="text-xs text-slate mt-0.5">Assigned Chemists</p>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {user.role === "mr" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <div className="p-5 border-b border-border flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-indigo" />
                  <h3 className="text-sm font-semibold text-ink">Assigned Doctors ({assignedDoctors.length})</h3>
                </div>
                <div className="p-3 space-y-1 max-h-96 overflow-y-auto">
                  {doctorsLoading && assignedDoctors.length === 0 && (
                    <p className="text-sm text-slate-light text-center py-6">Loading...</p>
                  )}
                  {assignedDoctors.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-3 rounded-(--radius-sm) px-3 py-2.5 hover:bg-porcelain-dim transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{d.name}</p>
                        <p className="text-xs text-slate truncate">{d.specialization} · {d.area}, {d.city}</p>
                      </div>
                    </div>
                  ))}
                  {!doctorsLoading && assignedDoctors.length === 0 && (
                    <p className="text-sm text-slate-light text-center py-6">No doctors assigned yet.</p>
                  )}
                </div>
              </Card>

              <Card>
                <div className="p-5 border-b border-border flex items-center gap-2">
                  <Store className="h-4 w-4 text-indigo" />
                  <h3 className="text-sm font-semibold text-ink">Assigned Chemists ({assignedChemists.length})</h3>
                </div>
                <div className="p-3 space-y-1 max-h-96 overflow-y-auto">
                  {chemistsLoading && assignedChemists.length === 0 && (
                    <p className="text-sm text-slate-light text-center py-6">Loading...</p>
                  )}
                  {assignedChemists.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 rounded-(--radius-sm) px-3 py-2.5 hover:bg-porcelain-dim transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                        <p className="text-xs text-slate truncate flex items-center gap-1"><Building2 className="h-3 w-3 shrink-0" />{c.area}, {c.city}</p>
                      </div>
                    </div>
                  ))}
                  {!chemistsLoading && assignedChemists.length === 0 && (
                    <p className="text-sm text-slate-light text-center py-6">No chemists assigned yet.</p>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
