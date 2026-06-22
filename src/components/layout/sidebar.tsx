"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { Logo } from "./logo";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { user: currentUser } = useCurrentUser();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!currentUser) return null;

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 264 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden lg:flex flex-col h-screen sticky top-0 bg-sidebar-elevated text-porcelain border-r border-ink-soft shrink-0 z-30"
    >
      {/* Logo */}
      <div className={cn("flex items-center h-20 shrink-0 overflow-hidden", collapsed ? "px-2 justify-center" : "px-6")}>
        <Logo light className={collapsed ? "h-6" : "h-8"} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems
          .filter((item) => !item.roles || item.roles.includes(currentUser.role))
          .map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-(--radius-sm) px-3.5 py-2.5 text-sm font-medium transition-colors group",
                  active
                    ? "text-porcelain"
                    : "text-slate-light hover:text-porcelain hover:bg-white/5"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 rounded-(--radius-sm) bg-gradient-indigo shadow-indigo-glow"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="h-[18px] w-[18px] shrink-0 relative z-10" strokeWidth={2} />
                {!collapsed && <span className="relative z-10 whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <div className={cn("flex items-center gap-3 rounded-(--radius-sm) px-3 py-2.5", !collapsed && "hover:bg-white/5")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback style={{ background: currentUser.avatarColor }}>{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-light truncate capitalize">{currentUser.role} · {currentUser.territory}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center gap-3 rounded-(--radius-sm) px-3.5 py-2.5 text-sm text-slate-light hover:text-porcelain hover:bg-white/5 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        {!collapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-(--radius-sm) px-3.5 py-2.5 text-sm text-slate-light hover:text-signal-rose hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>Log out</span>
          </button>
        )}
      </div>
    </motion.aside>
  );
}
