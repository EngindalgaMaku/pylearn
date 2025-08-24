"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  value: string;
  q: string;
  category: string;
  size: number;
  sortKey: string;
  dir: string;
};

const OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "games", label: "Games" },
  { value: "learning", label: "Learning Activities" },
  { value: "lessons", label: "Lessons" },
  { value: "challenges", label: "Challenges" },
];

export default function TypeGroupSelect({ value, q, category, size, sortKey, dir }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Boş string değerini "all" olarak gösterelim
  const displayValue = value === "" ? "all" : value;

  const handleValueChange = (newValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    // "all" değerini boş string olarak ayarlayalım
    params.set("typeGroup", newValue === "all" ? "" : newValue);
    params.set("page", "1"); // Reset to first page
    router.push(`/console/activities?${params.toString()}`);
  };

  return (
    <Select value={displayValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Filter by type" />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}