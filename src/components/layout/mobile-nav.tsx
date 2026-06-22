"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { Logo } from "./logo";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!currentUser) return null;

  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(currentUser.role));
  const initials = currentUser.name.split(" ").map((n) => n[0]).join("");

  return (
    <>
      {/* Top bar for mobile */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-16 px-4 glass-panel border-b border-border/60">
        <Logo className="h-7" />
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-(--radius-sm) hover:bg-secondary cursor-pointer"
        >
          <Menu className="h-5 w-5 text-ink" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 z-50 h-full w-72 bg-sidebar-elevated text-porcelain flex flex-col lg:hidden shadow-premium-xl"
            >
              <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
                <span className="font-display text-base">Menu</span>
                <button onClick={() => setOpen(false)} className="p-2 rounded-(--radius-sm) hover:bg-white/10 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <Avatar className="h-9 w-9">
                  <AvatarFallback style={{ background: currentUser.avatarColor }}>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-slate-light capitalize">{currentUser.role} · {currentUser.territory}</p>
                </div>
              </div>

              <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                {visibleItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-(--radius-sm) px-3.5 py-3 text-sm font-medium transition-colors",
                        active ? "bg-gradient-indigo text-porcelain shadow-indigo-glow" : "text-slate-light hover:bg-white/5 hover:text-porcelain"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-white/10">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 rounded-(--radius-sm) px-3.5 py-3 text-sm text-slate-light hover:text-signal-rose hover:bg-white/5 transition-colors cursor-pointer">
                  <LogOut className="h-[18px] w-[18px]" />
                  Log out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
