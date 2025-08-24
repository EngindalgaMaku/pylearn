"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  value: string;
  makeHref: (v: string) => string;
};

const OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All types" },
  { value: "games", label: "Games" },
  { value: "learning", label: "Learning Activities" },
  { value: "lessons", label: "Lessons" },
  { value: "challenges", label: "Challenges" },
];

export default function TypeGroupSelect({ value, makeHref }: Props) {
  const router = useRouter();

  return (
    <Select value={value} onValueChange={(v) => router.push(makeHref(v))}>
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
