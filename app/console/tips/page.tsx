"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Lightbulb,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Award,
  Code,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type PythonTip = {
  id: string;
  title: string;
  content: string;
  codeExample?: string;
  category: string;
  difficulty: string;
  xpReward: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const CATEGORIES = [
  "Basics",
  "Data Structures",
  "Functions",
  "OOP",
  "Control Flow",
  "Error Handling",
  "File I/O",
  "Libraries",
  "Best Practices",
  "Performance",
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function TipsConsolePage() {
  const [tips, setTips] = useState<PythonTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<PythonTip | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTip, setDeletingTip] = useState<PythonTip | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    codeExample: "",
    category: "Basics",
    difficulty: "Beginner",
    xpReward: 10,
    isActive: true,
  });

  // Pagination calculations will be computed after filteredTips is defined

  useEffect(() => {
    loadTips();
  }, []);

  useEffect(() => {
    // reset to first page when filters/search change
    setPage(1);
    loadTips();
  }, [searchTerm, filterCategory, filterActive]);

  const loadTips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchTerm) params.set("search", searchTerm);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterActive !== "all") params.set("isActive", filterActive);

      const response = await fetch(`/api/python-tips?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setTips(Array.isArray(data.tips) ? data.tips : []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch tips");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tips",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTip(null);
    setFormData({
      title: "",
      content: "",
      codeExample: "",
      category: "Basics",
      difficulty: "Beginner",
      xpReward: 10,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (tip: PythonTip) => {
    setEditingTip(tip);
    setFormData({
      title: tip.title,
      content: tip.content,
      codeExample: tip.codeExample || "",
      category: tip.category,
      difficulty: tip.difficulty,
      xpReward: tip.xpReward,
      isActive: tip.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url = editingTip
        ? `/api/python-tips/${editingTip.id}`
        : "/api/python-tips";
      const method = editingTip ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Tip ${editingTip ? "updated" : "created"} successfully`,
        });
        setIsDialogOpen(false);
        loadTips();
      } else {
        throw new Error("Failed to save tip");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingTip ? "update" : "create"} tip`,
        variant: "destructive",
      });
    }
  };

  const toggleTipStatus = async (tip: PythonTip) => {
    try {
      const response = await fetch(`/api/python-tips/${tip.id}/toggle`, {
        method: "PATCH",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Tip ${tip.isActive ? "deactivated" : "activated"}`,
        });
        loadTips();
      } else {
        throw new Error("Failed to toggle tip status");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tip status",
        variant: "destructive",
      });
    }
  };

  const deleteTip = async (tip: PythonTip) => {
    try {
      const response = await fetch(`/api/python-tips/${tip.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Tip deleted successfully",
        });
        setIsDeleteOpen(false);
        setDeletingTip(null);
        loadTips();
      } else {
        throw new Error("Failed to delete tip");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tip",
        variant: "destructive",
      });
    }
  };

  const filteredTips = tips.filter((tip) => {
    const matchesSearch =
      tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tip.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || tip.category === filterCategory;
    const matchesActive =
      filterActive === "all" ||
      (filterActive === "active" && tip.isActive) ||
      (filterActive === "inactive" && !tip.isActive);

    return matchesSearch && matchesCategory && matchesActive;
  });

  // Pagination calculations (after filteredTips is available)
  const totalItems = filteredTips.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(totalItems, startIndex + pageSize);
  const paginatedTips: PythonTip[] = filteredTips.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Python Tips Management
          </h1>
          <p className="text-gray-600">
            Create and manage daily Python tips for users
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Tip
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-200/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tips</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tips.length}
                </p>
              </div>
              <Lightbulb className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-200/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Tips</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tips.filter((tip) => tip.isActive).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-amber-200/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(tips.map((tip) => tip.category)).size}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-violet-200/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total XP Rewards</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tips.reduce((sum, tip) => sum + tip.xpReward, 0)}
                </p>
              </div>
              <Award className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search tips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("all");
                setFilterActive("all");
                loadTips();
              }}
            >
              Clear & Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Loading tips...</p>
            </CardContent>
          </Card>
        ) : filteredTips.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No tips found</p>
            </CardContent>
          </Card>
        ) : (
          paginatedTips.map((tip) => (
            <Card
              key={tip.id}
              className={`relative overflow-hidden ${
                tip.isActive
                  ? "border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50"
                  : "border-gray-200 bg-gradient-to-r from-gray-50/50 to-slate-50/50 opacity-75"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{tip.title}</CardTitle>
                      <Badge variant={tip.isActive ? "default" : "secondary"}>
                        {tip.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {tip.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {tip.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        +{tip.xpReward} XP
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      <div className="max-h-32 overflow-y-auto pr-1 whitespace-pre-wrap">
                        {tip.content}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTipStatus(tip)}
                      className={
                        tip.isActive
                          ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          : "text-green-600 hover:text-green-700 hover:bg-green-50"
                      }
                    >
                      {tip.isActive ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => {
        setIsDeleteOpen(open);
        if (!open) {
          setDeletingTip(null);
          setDeleteConfirmText("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Tip</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              tip{deletingTip ? ` "${deletingTip.title}"` : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Please type <span className="font-semibold text-red-600">DELETE</span>
              {" "}to confirm.
            </p>
            <Input
              autoFocus
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteOpen(false);
              setDeletingTip(null);
              setDeleteConfirmText("");
            }}>Cancel</Button>
            <Button variant="destructive" disabled={deleteConfirmText !== "DELETE"} onClick={() => {
              if (deletingTip) {
                deleteTip(deletingTip);
              } else {
                setIsDeleteOpen(false);
              }
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(tip)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingTip(tip);
                        setIsDeleteOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {tip.codeExample && (
                <CardContent className="pt-0">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        Code Example
                      </span>
                    </div>
                    <pre className="text-sm text-gray-100 overflow-x-auto max-h-48 overflow-y-auto">
                      <code>{tip.codeExample}</code>
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {filteredTips.length > 0 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(totalItems, startIndex + 1)}-
            {Math.min(totalItems, endIndex)} of {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <span className="text-sm">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTip ? "Edit Tip" : "Create New Tip"}
            </DialogTitle>
            <DialogDescription>
              {editingTip
                ? "Update the tip information below."
                : "Create a new Python tip for users."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter tip title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Enter tip content..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Code Example (Optional)
              </label>
              <Textarea
                value={formData.codeExample}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    codeExample: e.target.value,
                  }))
                }
                placeholder="Enter code example..."
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Difficulty
                </label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, difficulty: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  XP Reward
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.xpReward}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      xpReward: parseInt(e.target.value) || 10,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active (visible to users)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title || !formData.content}
            >
              {editingTip ? "Update Tip" : "Create Tip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
