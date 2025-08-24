"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

type ActivityTypeEditorProps = {
  id: string;
  title: string;
  currentType: string;
};

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

export default function ActivityTypeEditor({ id, title, currentType }: ActivityTypeEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(currentType);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (selectedType === currentType) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/activities/update-type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          activityType: selectedType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update activity type");
      }

      toast({
        title: "Activity type updated",
        description: `Changed "${title}" from ${currentType} to ${selectedType}`,
      });
      // Reload the page to see the changes
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update activity type",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs"
      >
        Edit Type
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Activity Type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <h3 className="font-medium mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Current type: <span className="font-medium">{currentType}</span>
            </p>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Select new type:</label>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
