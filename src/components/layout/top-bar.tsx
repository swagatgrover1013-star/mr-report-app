"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const notifications = [
  { id: 1, text: "Follow-up due today with Dr. Sunita Verma", time: "2h ago" },
  { id: 2, text: "Dr. Farah Sheikh requested clinical literature", time: "5h ago" },
  { id: 3, text: "Monthly report ready for review", time: "1d ago" },
];

export function TopBar({ title, subtitle, action }: TopBarProps) {
  return (
    <div className="hidden lg:flex items-center justify-between gap-6 h-20 px-8 border-b border-border/60 glass-panel sticky top-0 z-20">
      <div className="min-w-0">
        <h1 className="font-display text-2xl text-ink tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-slate mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-light" />
          <Input placeholder="Search doctors, visits..." className="pl-9 bg-card" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-[18px] w-[18px] text-ink-soft" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-signal-rose text-[10px] text-white flex items-center justify-center font-medium">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2.5">
                <span className="text-sm text-ink-soft leading-snug">{n.text}</span>
                <span className="text-xs text-slate-light">{n.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {action}
      </div>
    </div>
  );
}
