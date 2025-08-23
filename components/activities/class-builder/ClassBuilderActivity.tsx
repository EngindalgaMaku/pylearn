"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Trophy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Local types normalized for this component
interface ClassAttribute { name: string; type: string; required: boolean }
interface ClassMethod { name: string; required: boolean; params: string[] }
interface ClassTemplate { name: string; attributes: ClassAttribute[]; methods: ClassMethod[] }

interface ClassBuilderContent {
  instructions?: string;
  classTemplate?: ClassTemplate;
  requirements?: string;
  // seed-style fields (optional)
  className?: string;
  requiredProperties?: Array<{ name: string; type?: string }>;
  availableProperties?: Array<{ name: string; type?: string }>;
  requiredMethods?: Array<{ name: string; params?: string[]; parameters?: string[] }>;
  availableMethods?: Array<{ name: string; params?: string[]; parameters?: string[] }>;
}

interface LearningActivityLike {
  id: string;
  slug: string;
  title: string;
  description?: string;
  activityType: string;
  difficulty: number;
  category?: string;
  diamondReward?: number;
  experienceReward?: number;
  estimatedMinutes?: number;
  content?: ClassBuilderContent | any;
  tags?: string[];
}

export default function ClassBuilderActivity({ activity }: { activity: LearningActivityLike }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { update } = useSession();

  // Preserve filters for back navigation
  const backHref = useMemo(() => {
    const params = new URLSearchParams();
    const category = searchParams?.get("category") || "";
    const type = searchParams?.get("type") || "";
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    return params.toString() ? `/activities?${params.toString()}` : "/activities";
  }, [searchParams]);

  const [selectedAttributes, setSelectedAttributes] = useState<{ name: string; type: string }[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<{ name: string; params: string[] }[]>([]);
  const [customAttribute, setCustomAttribute] = useState({ name: "", type: "" });
  const [customMethod, setCustomMethod] = useState({ name: "", params: "" });
  const [showResults, setShowResults] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [completing, setCompleting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Check authentication status
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const session = await response.json().catch(() => null);
        if (!mounted) return;
        setIsAuthenticated(!!session?.user);
      } catch (error) {
        if (!mounted) return;
        setIsAuthenticated(false);
      }
    };
    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  // Normalize content from activity
  const raw: any = activity?.content ?? {};

  const instructions: string =
    typeof raw.instructions === "string" && raw.instructions.trim() !== ""
      ? raw.instructions
      : "Select attributes and methods to build the class";

  const hasTemplate =
    raw?.classTemplate &&
    Array.isArray(raw.classTemplate.attributes) &&
    Array.isArray(raw.classTemplate.methods);

  let classTemplate: ClassTemplate;

  if (hasTemplate) {
    classTemplate = {
      name: String(raw.classTemplate.name || raw.className || "MyClass"),
      attributes: (raw.classTemplate.attributes || []).map((a: any) => ({
        name: String(a?.name ?? ""),
        type: String(a?.type ?? "any"),
        required: !!a?.required,
      })),
      methods: (raw.classTemplate.methods || []).map((m: any) => ({
        name: String(m?.name ?? ""),
        required: !!m?.required,
        params: Array.isArray(m?.params)
          ? m.params.map((p: any) => String(p))
          : Array.isArray(m?.parameters)
            ? m.parameters.map((p: any) => String(p))
            : [],
      })),
    };
  } else {
    const reqProps: any[] = Array.isArray(raw.requiredProperties) ? raw.requiredProperties : [];
    const availProps: any[] = Array.isArray(raw.availableProperties) ? raw.availableProperties : [];
    const propMap = new Map<string, ClassAttribute>();

    availProps.forEach((p) => {
      const name = String(p?.name ?? "");
      if (!name) return;
      propMap.set(name, { name, type: String(p?.type ?? "any"), required: false });
    });

    reqProps.forEach((p) => {
      const name = String(p?.name ?? "");
      if (!name) return;
      const existing = propMap.get(name);
      if (existing) {
        existing.required = true;
        existing.type = String(p?.type ?? existing.type ?? "any");
        propMap.set(name, existing);
      } else {
        propMap.set(name, { name, type: String(p?.type ?? "any"), required: true });
      }
    });

    const reqMethods: any[] = Array.isArray(raw.requiredMethods) ? raw.requiredMethods : [];
    const availMethods: any[] = Array.isArray(raw.availableMethods) ? raw.availableMethods : [];
    const methodMap = new Map<string, ClassMethod>();

    availMethods.forEach((m) => {
      const name = String(m?.name ?? "");
      if (!name) return;
      const params = Array.isArray(m?.parameters)
        ? m.parameters.map((p: any) => String(p))
        : Array.isArray(m?.params)
          ? m.params.map((p: any) => String(p))
          : [];
      methodMap.set(name, { name, required: false, params });
    });

    reqMethods.forEach((m) => {
      const name = String(m?.name ?? "");
      if (!name) return;
      const params = Array.isArray(m?.parameters)
        ? m.parameters.map((p: any) => String(p))
        : Array.isArray(m?.params)
          ? m.params.map((p: any) => String(p))
          : [];
      const existing = methodMap.get(name);
      if (existing) {
        existing.required = true;
        existing.params = params.length ? params : existing.params;
        methodMap.set(name, existing);
      } else {
        methodMap.set(name, { name, required: true, params });
      }
    });

    classTemplate = {
      name: String(raw.className || "MyClass"),
      attributes: Array.from(propMap.values()),
      methods: Array.from(methodMap.values()),
    };
  }

  const requirements: string =
    typeof raw.requirements === "string" && raw.requirements.trim() !== ""
      ? raw.requirements
      : (() => {
          const reqAttrNames = (Array.isArray(raw.requiredProperties) ? raw.requiredProperties : [])
            .map((p: any) => p?.name)
            .filter(Boolean)
            .join(", ");
          const reqMethodNames = (Array.isArray(raw.requiredMethods) ? raw.requiredMethods : [])
            .map((m: any) => m?.name)
            .filter(Boolean)
            .join(", ");
          return `Include required attributes: ${reqAttrNames || "none"}; and required methods: ${reqMethodNames || "none"}.`;
        })();

  const requiredAttributes = useMemo(() => classTemplate.attributes.filter((a) => a.required), [classTemplate]);
  const requiredMethods = useMemo(() => classTemplate.methods.filter((m) => m.required), [classTemplate]);
  const missingRequiredAttributes = useMemo(
    () => requiredAttributes.filter((reqAttr) => !selectedAttributes.some((sel) => sel.name === reqAttr.name)),
    [requiredAttributes, selectedAttributes]
  );
  const missingRequiredMethods = useMemo(
    () => requiredMethods.filter((req) => !selectedMethods.some((sel) => sel.name === req.name)),
    [requiredMethods, selectedMethods]
  );
  const allRequiredSelected = missingRequiredAttributes.length === 0 && missingRequiredMethods.length === 0;

  // Timer interval
  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const addAttribute = (attribute: ClassAttribute) => {
    const userAttr = { name: attribute.name, type: attribute.type };
    if (!selectedAttributes.find((a) => a.name === attribute.name)) {
      setSelectedAttributes((prev) => [...prev, userAttr]);
    }
  };

  const addCustomAttribute = () => {
    if (customAttribute.name && customAttribute.type) {
      if (!selectedAttributes.find((a) => a.name === customAttribute.name)) {
        setSelectedAttributes((prev) => [...prev, { ...customAttribute }]);
        setCustomAttribute({ name: "", type: "" });
      }
    }
  };

  const removeAttribute = (name: string) => {
    setSelectedAttributes((prev) => prev.filter((a) => a.name !== name));
  };

  const addMethod = (method: ClassMethod) => {
    const userMethod = { name: method.name, params: method.params };
    if (!selectedMethods.find((m) => m.name === method.name)) {
      setSelectedMethods((prev) => [...prev, userMethod]);
    }
  };

  const addCustomMethod = () => {
    if (customMethod.name) {
      const params = customMethod.params
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);
      if (!selectedMethods.find((m) => m.name === customMethod.name)) {
        setSelectedMethods((prev) => [...prev, { name: customMethod.name, params }]);
        setCustomMethod({ name: "", params: "" });
      }
    }
  };

  const removeMethod = (name: string) => {
    setSelectedMethods((prev) => prev.filter((m) => m.name !== name));
  };

  // Persistence: load selections on mount and save on changes
  useEffect(() => {
    try {
      const key = `classBuilder:${(activity as any)?.slug || activity.id}`;
      const tKey = `${key}:start`;
      const saved = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.attributes) && Array.isArray(parsed.methods)) {
          setSelectedAttributes(parsed.attributes);
          setSelectedMethods(parsed.methods);
        }
      }
      if (typeof window !== "undefined") {
        const savedStart = window.localStorage.getItem(tKey);
        if (savedStart && !isNaN(Number(savedStart))) {
          startTimeRef.current = Number(savedStart);
        } else {
          const now = Date.now();
          startTimeRef.current = now;
          window.localStorage.setItem(tKey, String(now));
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const key = `classBuilder:${(activity as any)?.slug || activity.id}`;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          key,
          JSON.stringify({ attributes: selectedAttributes, methods: selectedMethods })
        );
      }
    } catch {
      // ignore
    }
  }, [selectedAttributes, selectedMethods, activity]);

  const computeScore = () => {
    const requiredAttributes = classTemplate.attributes.filter((a) => a.required);
    const requiredMethods = classTemplate.methods.filter((m) => m.required);

    const hasRequiredAttrs = requiredAttributes.every((reqAttr) =>
      selectedAttributes.some((selAttr) => selAttr.name === reqAttr.name)
    );
    const hasRequiredMethods = requiredMethods.every((reqMethod) =>
      selectedMethods.some((selMethod) => selMethod.name === reqMethod.name)
    );

    let score = 0;
    if (hasRequiredAttrs) score += 50;
    if (hasRequiredMethods) score += 50;

    // Bonus points for optional selections
    const optionalAttrs = classTemplate.attributes.filter((a) => !a.required);
    const optionalMethods = classTemplate.methods.filter((m) => !m.required);

    optionalAttrs.forEach((optAttr) => {
      if (selectedAttributes.some((selAttr) => selAttr.name === optAttr.name)) {
        score += 5;
      }
    });
    optionalMethods.forEach((optMethod) => {
      if (selectedMethods.some((selMethod) => selMethod.name === optMethod.name)) {
        score += 5;
      }
    });

    return Math.min(100, score);
  };

  const checkClass = () => {
    setShowResults(true);
  };

  const handleActivityCompletion = async (score: number) => {
    if (!isAuthenticated) return;
    try {
      setCompleting(true);
      const tSpent = Math.max(0, Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000));
      const res = await fetch("/api/activities/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: (activity as any).slug,
          score,
          timeSpent: tSpent,
        }),
        cache: "no-store",
      });

      // If unauthenticated
      if (res.status === 401) {
        toast({
          title: "Login required",
          description: "You must log in to claim your rewards.",
        });
        router.push(backHref);
        return;
      }

      if (!res.ok) {
        toast({ title: "Error", description: "Could not complete activity.", variant: "destructive" });
      } else {
        // Parse response and refresh session values so diamonds/xp update immediately
        const data = await res.json().catch(() => null);
        const userAfter = data?.user;
        if (data?.success && userAfter && typeof update === "function") {
          try {
            await update({
              currentDiamonds: userAfter.currentDiamonds,
              totalDiamonds: userAfter.totalDiamonds,
              experience: userAfter.experience,
              level: userAfter.level,
            } as any);
          } catch (e) {
            // non-fatal; continue redirect
            console.warn("Session update after completion failed:", e);
          }
        }
        toast({ title: "Completed", description: "Rewards claimed. Redirecting..." });
      }
      // proceed regardless of reward dialog; keep UX consistent
      router.push(backHref);
    } catch (e) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
      router.push(backHref);
    } finally {
      setCompleting(false);
    }
  };

  const copyCodeToClipboard = async () => {
    try {
      const code = generateClassCode();
      await navigator.clipboard.writeText(code);
      toast({ title: "Copied", description: "Class code copied to clipboard." });
    } catch (e) {
      toast({ title: "Copy failed", description: "Could not copy code.", variant: "destructive" });
    }
  };

  const resetSelections = () => {
    setSelectedAttributes([]);
    setSelectedMethods([]);
    setCustomAttribute({ name: "", type: "" });
    setCustomMethod({ name: "", params: "" });
    setShowResults(false);
    try {
      const key = `classBuilder:${(activity as any)?.slug || activity.id}`;
      const tKey = `${key}:start`;
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
        window.localStorage.removeItem(tKey);
      }
    } catch {
      // ignore
    }
    startTimeRef.current = Date.now();
  };

  const addAllRequired = () => {
    // Add missing required attributes
    const missingAttrs = requiredAttributes.filter((reqAttr) => !selectedAttributes.some((a) => a.name === reqAttr.name));
    if (missingAttrs.length) {
      setSelectedAttributes((prev) => [
        ...prev,
        ...missingAttrs.map((a) => ({ name: a.name, type: a.type }))
      ]);
    }
    // Add missing required methods
    const missingMeths = requiredMethods.filter((req) => !selectedMethods.some((m) => m.name === req.name));
    if (missingMeths.length) {
      setSelectedMethods((prev) => [
        ...prev,
        ...missingMeths.map((m) => ({ name: m.name, params: m.params }))
      ]);
    }
    if (missingAttrs.length || missingMeths.length) {
      const parts: string[] = [];
      if (missingAttrs.length) parts.push(`${missingAttrs.length} attribute(s)`);
      if (missingMeths.length) parts.push(`${missingMeths.length} method(s)`);
      toast({
        title: "Added required items",
        description: `Automatically added ${parts.join(" and ")}.`,
      });
    } else {
      toast({ title: "All set", description: "All required items are already selected." });
    }
  };

  const generateClassCode = () => {
    let code = `class ${classTemplate.name}:\n`;

    if (selectedMethods.find((m) => m.name === "__init__")) {
      const initMethod = selectedMethods.find((m) => m.name === "__init__");
      code += `    def __init__(self${initMethod?.params.length ? ", " + initMethod.params.join(", ") : ""}):\n`;
      selectedAttributes.forEach((attr) => {
        code += `        self.${attr.name} = ${attr.name}\n`;
      });
      code += "\n";
    }

    selectedMethods
      .filter((m) => m.name !== "__init__")
      .forEach((method) => {
        code += `    def ${method.name}(self${method.params.length ? ", " + method.params.join(", ") : ""}):\n`;
        code += `        # TODO: Implement ${method.name}\n`;
        code += `        pass\n\n`;
      });

    return code;
  };

  // Results view
  if (showResults) {
    const score = computeScore();
    const passed = score >= 70;

    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center">
          <div
            className={`mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full ${
              passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            }`}
          >
            {passed ? <Trophy className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
          </div>

          <h2 className="mb-2 text-3xl font-bold text-gray-900">
            {passed ? "Class Designed Successfully!" : "Keep Designing!"}
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Your {classTemplate.name} class is {passed ? "well-designed" : "missing key components"}
          </p>

          <div className="mb-8 rounded-lg bg-gray-50 p-6">
            <div className="mb-2 text-4xl font-bold text-gray-900">{score}%</div>
            <div className={`text-lg font-semibold ${passed ? "text-green-600" : "text-red-600"}`}>
              {passed ? "Great Class Design!" : "Review OOP Principles"}
            </div>
          </div>

          <div className="mb-8 space-y-6">
            <div className="text-left">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Your Class Code:</h3>
              <pre className="overflow-x-auto rounded-lg bg-white p-4 text-left text-sm text-black">
                <code>{generateClassCode()}</code>
              </pre>
            </div>

            <div className="text-left">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Requirements Check:</h3>
              <div className="space-y-2">
                {/* Required attributes */}
                {(() => {
                  const requiredAttributes = classTemplate.attributes.filter((a) => a.required);
                  const hasRequiredAttrs = requiredAttributes.every((reqAttr) =>
                    selectedAttributes.some((selAttr) => selAttr.name === reqAttr.name)
                  );
                  return (
                    <div className={`flex items-center space-x-2 ${hasRequiredAttrs ? "text-green-600" : "text-red-600"}`}>
                      {hasRequiredAttrs ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      <span>Required attributes: {requiredAttributes.map((a) => a.name).join(", ")}</span>
                    </div>
                  );
                })()}
                {/* Required methods */}
                {(() => {
                  const requiredMethods = classTemplate.methods.filter((m) => m.required);
                  const hasRequiredMethods = requiredMethods.every((reqMethod) =>
                    selectedMethods.some((selMethod) => selMethod.name === reqMethod.name)
                  );
                  return (
                    <div className={`flex items-center space-x-2 ${hasRequiredMethods ? "text-green-600" : "text-red-600"}`}>
                      {hasRequiredMethods ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      <span>Required methods: {requiredMethods.map((m) => m.name).join(", ")}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {isAuthenticated ? (
            <Button
              onClick={() => handleActivityCompletion(score)}
              className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
              disabled={completing}
            >
              {completing ? "Finishing..." : "Finish & Claim Rewards"}
            </Button>
          ) : (
            <Link href={backHref}>
              <Button className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700">
                Finish & Go to List
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Main builder UI (no duplicate headers; page renders title/desc)
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8 rounded-lg bg-purple-50 p-6">
        <h3 className="mb-4 text-xl font-semibold text-purple-900">Instructions</h3>
        <p className="mb-4 text-purple-800">{instructions}</p>
        <div className="rounded-lg bg-purple-100 p-4">
          <h4 className="mb-2 font-semibold text-purple-900">Requirements:</h4>
          <p className="text-purple-800">{requirements}</p>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-purple-900/80">
            <span className="font-semibold">Time Spent:</span> {formatTime(elapsedSeconds)}
          </div>
          <div className="rounded-md bg-white/70 p-3 text-sm w-full sm:w-auto">
            <div className="font-semibold mb-1 text-purple-900">Pre-check status</div>
            <div className="space-y-1">
              <div className={missingRequiredAttributes.length === 0 ? "text-green-700" : "text-red-700"}>
                {missingRequiredAttributes.length === 0 ? "All required attributes selected" : `Missing attributes: ${missingRequiredAttributes.map(a => a.name).join(', ')}`}
              </div>
              <div className={missingRequiredMethods.length === 0 ? "text-green-700" : "text-red-700"}>
                {missingRequiredMethods.length === 0 ? "All required methods selected" : `Missing methods: ${missingRequiredMethods.map(m => m.name).join(', ')}`}
              </div>
            </div>
            <div className="mt-2">
              <Button onClick={addAllRequired} variant="secondary" className="px-3 py-2" disabled={allRequiredSelected}>
                Add All Required
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Class Components */}
        <div className="space-y-6">
          {/* Attributes Section */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Attributes</h3>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4 space-y-2">
                {classTemplate.attributes.map((attr) => (
                  <button
                    key={attr.name}
                    onClick={() => addAttribute(attr)}
                    disabled={selectedAttributes.some((a) => a.name === attr.name)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      selectedAttributes.some((a) => a.name === attr.name)
                        ? "border-green-300 bg-green-50 text-green-800"
                        : attr.required
                          ? "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {attr.name}: {attr.type}
                        </div>
                        <div className="text-sm opacity-75">{attr.required ? "Required" : "Optional"}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {attr.required && selectedAttributes.some((a) => a.name === attr.name) && (
                          <Badge variant="default" className="bg-blue-600 text-white">Required</Badge>
                        )}
                        {selectedAttributes.some((a) => a.name === attr.name) && (
                          <CheckCircle className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Custom Attribute (outside the list card) */}
            <div className="mt-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-700">Add Custom Attribute</h4>
              <div className="flex gap-2 flex-col sm:flex-row">
                <input
                  type="text"
                  placeholder="Attribute name"
                  value={customAttribute.name}
                  onChange={(e) => setCustomAttribute({ ...customAttribute, name: e.target.value })}
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Type"
                  value={customAttribute.type}
                  onChange={(e) => setCustomAttribute({ ...customAttribute, type: e.target.value })}
                  className="sm:w-40 rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                />
                <Button onClick={addCustomAttribute} className="px-3 py-2">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Methods Section */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Methods</h3>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4 space-y-2">
                {classTemplate.methods.map((method) => (
                  <button
                    key={method.name}
                    onClick={() => addMethod(method)}
                    disabled={selectedMethods.some((m) => m.name === method.name)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      selectedMethods.some((m) => m.name === method.name)
                        ? "border-green-300 bg-green-50 text-green-800"
                        : method.required
                          ? "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{method.name}({method.params.join(", ")})</div>
                        <div className="text-sm opacity-75">{method.required ? "Required" : "Optional"}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.required && selectedMethods.some((m) => m.name === method.name) && (
                          <Badge variant="default" className="bg-blue-600 text-white">Required</Badge>
                        )}
                        {selectedMethods.some((m) => m.name === method.name) && (
                          <CheckCircle className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Custom Method (outside the list card) */}
            <div className="mt-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-700">Add Custom Method</h4>
              <div className="flex gap-2 flex-col sm:flex-row">
                <input
                  type="text"
                  placeholder="Method name"
                  value={customMethod.name}
                  onChange={(e) => setCustomMethod({ ...customMethod, name: e.target.value })}
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="param1, param2"
                  value={customMethod.params}
                  onChange={(e) => setCustomMethod({ ...customMethod, params: e.target.value })}
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                />
                <Button onClick={addCustomMethod} className="px-3 py-2">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Class Preview */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Your {classTemplate.name} Class</h3>

          {/* Selected Attributes */}
          <div className="mb-6">
            <h4 className="text-md mb-2 font-medium text-gray-800">Attributes ({selectedAttributes.length})</h4>
            <div className="min-h-20 rounded-lg bg-gray-50 p-4">
              {selectedAttributes.length === 0 ? (
                <div className="text-gray-500">No attributes selected</div>
              ) : (
                <div className="space-y-2">
                  {selectedAttributes.map((attr) => (
                    <div key={attr.name} className="flex items-center justify-between rounded bg-white p-2">
                      <span className="text-sm text-black flex items-center gap-2">
                        {attr.name}: {attr.type}
                        {classTemplate.attributes.find((a) => a.name === attr.name)?.required && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                      </span>
                      <Button variant="ghost" onClick={() => removeAttribute(attr.name)} className="text-red-500 hover:text-red-700 px-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Methods */}
          <div className="mb-6">
            <h4 className="text-md mb-2 font-medium text-gray-800">Methods ({selectedMethods.length})</h4>
            <div className="min-h-20 rounded-lg bg-gray-50 p-4">
              {selectedMethods.length === 0 ? (
                <div className="text-gray-500">No methods selected</div>
              ) : (
                <div className="space-y-2">
                  {selectedMethods.map((method) => (
                    <div key={method.name} className="flex items-center justify-between rounded bg-white p-2">
                      <span className="text-sm text-black flex items-center gap-2">
                        {method.name}({method.params.join(", ")})
                        {classTemplate.methods.find((m) => m.name === method.name)?.required && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                      </span>
                      <Button variant="ghost" onClick={() => removeMethod(method.name)} className="text-red-500 hover:text-red-700 px-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Code Preview */}
          <div className="mb-6">
            <h4 className="text-md mb-2 font-medium text-gray-800">Generated Code</h4>
            <pre className="overflow-x-auto rounded-lg bg-white p-4 text-sm text-black">
              <code>{generateClassCode()}</code>
            </pre>
            <div className="mt-2 flex gap-2">
              <Button onClick={copyCodeToClipboard} variant="outline" className="px-3 py-2">Copy Code</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            onClick={checkClass}
            disabled={!allRequiredSelected}
            className="rounded-lg bg-purple-600 px-8 py-3 text-lg font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Check Class Design
          </Button>
          <Button onClick={resetSelections} variant="outline" className="px-8 py-3 text-lg font-bold">Reset</Button>
        </div>
      </div>
    </div>
  );
}
