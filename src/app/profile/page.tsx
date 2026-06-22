"use client";

import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { PageHeaderMobile } from "@/components/layout/page-header-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user: currentUser } = useCurrentUser();

  if (!currentUser) return null;

  const initials = currentUser.name.split(" ").map((n) => n[0]).join("");

  return (
    <AppShell>
      <TopBar title="Profile" subtitle="Manage your account settings" />

      <div className="flex-1 p-5 lg:p-8">
        <PageHeaderMobile title="Profile" subtitle="Account settings" />

        <div className="max-w-2xl mx-auto space-y-5 mt-5 lg:mt-0">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 lg:p-8">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg" style={{ background: currentUser.avatarColor }}>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-display text-xl text-ink">{currentUser.name}</h2>
                  <p className="text-sm text-slate mt-0.5">{currentUser.email}</p>
                  <Badge variant="brass" className="capitalize mt-2">{currentUser.role}</Badge>
                </div>
              </div>
            </Card>
          </motion.div>

          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Profile Info</TabsTrigger>
              <TabsTrigger value="password">Change Password</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input defaultValue={currentUser.name} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Employee ID</Label>
                      <Input defaultValue={currentUser.employeeId} disabled />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" defaultValue={currentUser.email} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Phone Number</Label>
                      <Input defaultValue={currentUser.phone} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Territory</Label>
                      <Input defaultValue={currentUser.territory} />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Use a strong password you don&apos;t use elsewhere.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Current Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm New Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button>Update Password</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
