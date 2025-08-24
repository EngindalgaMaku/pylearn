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
};

// Tüm aktivite tiplerini içeren daha kapsamlı bir liste
const ACTIVITY_TYPES = [
  { value: "all", label: "Tüm Tipler" },
  { value: "quiz", label: "Quiz" },
  { value: "theory_interactive", label: "Theory Interactive" },
  { value: "interactive_demo", label: "Interactive Demo" },
  { value: "matching", label: "Matching" },
  { value: "memory_game", label: "Memory Game" },
  { value: "drag_drop", label: "Drag & Drop" },
  { value: "code_builder", label: "Code Builder" },
  { value: "class_builder", label: "Class Builder" },
  { value: "algorithm_visualization", label: "Algorithm Visualization" },
  { value: "data_exploration", label: "Data Exploration" },
  { value: "coding_lab", label: "Coding Lab" },
  { value: "fill_blanks", label: "Fill Blanks" },
  { value: "interactive_coding", label: "Interactive Coding" },
  { value: "lesson", label: "Lesson" },
];

export default function AdvancedTypeFilter({ value }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Boş string değerini "all" olarak gösterelim
  const displayValue = value || "all";

  const handleValueChange = (newValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    // "all" değerini boş string olarak ayarlayalım
    params.set("activityType", newValue === "all" ? "" : newValue);
    params.set("page", "1"); // Reset to first page
    router.push(`/console/activities?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Aktivite Tipi:</label>
      <Select value={displayValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Tipe göre filtrele" />
        </SelectTrigger>
        <SelectContent>
          {ACTIVITY_TYPES.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
