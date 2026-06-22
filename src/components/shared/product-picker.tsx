"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

interface ProductPickerProps {
  products: { id: string; name: string }[];
  excludeIds: string[];
  onSelect: (id: string) => void;
  placeholder?: string;
}

export function ProductPicker({ products, excludeIds, onSelect, placeholder = "Add a product" }: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const available = products.filter((p) => !excludeIds.includes(p.id) && p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-slate-light font-normal">
          <Plus className="h-4 w-4" /> {placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-light" />
          <Input
            autoFocus
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="max-h-56 overflow-y-auto space-y-0.5">
          {available.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.id); setOpen(false); setSearch(""); }}
              className="w-full text-left px-2.5 py-2 rounded-(--radius-sm) text-sm text-ink hover:bg-porcelain-dim transition-colors cursor-pointer"
            >
              {p.name}
            </button>
          ))}
          {available.length === 0 && (
            <p className="text-xs text-slate-light text-center py-4">No matching products.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
