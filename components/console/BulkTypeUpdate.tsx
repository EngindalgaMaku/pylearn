"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const ACTIVITY_TYPES = [
  { value: "quiz", label: "Quiz" },
  { value: "interactive_demo", label: "Interactive Demo" },
  { value: "matching", label: "Matching" },
  { value: "memory_game", label: "Memory Game" },
  { value: "drag_drop", label: "Drag & Drop" },
  { value: "code_builder", label: "Code Builder" },
  { value: "class_builder", label: "Class Builder" },
  { value: "algorithm_visualization", label: "Algorithm Visualization" },
  { value: "data_exploration", label: "Data Exploration" },
  { value: "coding_lab", label: "Coding Lab" },
  { value: "lesson", label: "Lesson" },
  { value: "theory_interactive", label: "Theory Interactive" },
];

type Props = {
  q: string;
  category: string;
  typeGroup: string;
};

export default function BulkTypeUpdate({ q, category, typeGroup }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("quiz");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!window.confirm(`Are you sure you want to change the type of ALL MATCHING ACTIVITIES to "${selectedType}"? This cannot be undone.`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/activities/bulk-update-type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q,
          category,
          typeGroup,
          newType: selectedType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update activity types");
      }

      const data = await response.json();
      
      toast({
        title: "Activity types updated",
        description: `Updated ${data.count} activities to type "${selectedType}"`,
      });
      
      // Reload the page to see the changes
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update activity types",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded-md bg-muted/20 flex items-center gap-2 flex-1">
      <div className="text-sm">Bulk type update</div>
      <select 
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        className="border rounded-md px-3 py-2"
      >
        {ACTIVITY_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
      <Button 
        type="submit" 
        variant="outline"
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Apply to filtered"}
      </Button>
    </form>
  );
}
