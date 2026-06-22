import {
  LayoutDashboard,
  Stethoscope,
  Users,
  FileBarChart,
  BarChart3,
  UserCog,
  CalendarClock,
  CalendarRange,
  CalendarOff,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: Array<"admin" | "manager" | "mr">;
}

const managerOnly: Array<"admin" | "manager"> = ["admin", "manager"];

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Planning", href: "/planning", icon: CalendarRange },
  { label: "Visit Reports", href: "/visits", icon: Stethoscope },
  { label: "Network", href: "/doctors", icon: Users },
  { label: "Leave", href: "/leave", icon: CalendarOff },
  { label: "Follow-ups", href: "/follow-ups", icon: CalendarClock, roles: managerOnly },
  { label: "Reports", href: "/reports", icon: FileBarChart, roles: managerOnly },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: managerOnly },
  { label: "Users", href: "/users", icon: UserCog, roles: managerOnly },
];
