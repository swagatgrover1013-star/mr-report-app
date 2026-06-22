"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartyOption {
  id: string;
  name: string;
  area: string;
}

interface PartyPickerProps {
  parties: PartyOption[];
  value: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PartyPicker({ parties, value, onSelect, placeholder = "Select party", disabled }: PartyPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = parties.find((p) => p.id === value);
  const filtered = parties.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-between font-normal", !selected && "text-slate-light")}
        >
          <span className="truncate">{selected ? `${selected.name} · ${selected.area}` : placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-light" />
          <Input
            autoFocus
            placeholder="Search by name or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="max-h-56 overflow-y-auto space-y-0.5">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.id); setOpen(false); setSearch(""); }}
              className="w-full flex items-center justify-between gap-2 text-left px-2.5 py-2 rounded-(--radius-sm) text-sm text-ink hover:bg-porcelain-dim transition-colors cursor-pointer"
            >
              <span className="truncate">{p.name} <span className="text-slate-light">· {p.area}</span></span>
              {p.id === value && <Check className="h-3.5 w-3.5 text-indigo shrink-0" />}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-slate-light text-center py-4">No matching results.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
