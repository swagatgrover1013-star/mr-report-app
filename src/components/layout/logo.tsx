import { cn } from "@/lib/utils";

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <img
      src="/logo.svg"
      alt="Logo"
      className={cn("w-auto object-contain shrink-0", light && "brightness-0 invert", className)}
    />
  );
}
