import type { Metadata } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ActivitiesClient, { type ActivityDTO } from "@/components/activities/ActivitiesClient";

// Always render this page dynamically to reflect latest completion state
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(
  { searchParams }: { searchParams?: Promise<Record<string, string | string[]>> }
): Promise<Metadata> {
  const hs = await headers();
  const proto = hs.get("x-forwarded-proto") || "http";
  const host = hs.get("x-forwarded-host") || hs.get("host") || "localhost:3000";
  const origin = `${proto}://${host}`;

  const spAny = searchParams ? await searchParams : {};
 const getParam = (key: string): string | undefined => {
   const v = (spAny as Record<string, unknown>)[key];
   if (Array.isArray(v)) return v[0] as string;
   if (typeof v === "string") return v;
   return undefined;
 };

 const categoryParam = getParam("category");
 const typeParam = getParam("type");
 const pageNum = parseInt(getParam("page") || "1", 10);
 const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

 const selectedCategory = (categoryParam && categoryParam.trim()) || "Python Fundamentals";
 const selectedActivityType = typeParam && typeParam.trim() ? typeParam : undefined;

 const titleize = (s?: string) =>
   String(s ?? "")
     .split(/[_\s]+/)
     .filter(Boolean)
     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
     .join(" ");

 const titleParts = ["Learning Activities"];
 if (selectedCategory) titleParts.push(selectedCategory);
 if (selectedActivityType) titleParts.push(titleize(selectedActivityType));
 if (page > 1) titleParts.push(`Page ${page}`);
 const title = titleParts.join(" | ");

 const descriptionBase = "Master Python through interactive challenges and activities.";
 const description = [
   descriptionBase,
   selectedCategory ? `Category: ${selectedCategory}.` : "",
   selectedActivityType ? `Type: ${titleize(selectedActivityType)}.` : "",
   page > 1 ? `Page ${page}.` : "",
 ]
   .filter(Boolean)
   .join(" ");

 const params = new URLSearchParams();
 if (selectedCategory) params.set("category", selectedCategory);
 if (selectedActivityType) params.set("type", selectedActivityType);
 if (page > 1) params.set("page", String(page));
 const pathOnly = params.toString() ? `/activities?${params.toString()}` : "/activities";
 const canonical = `${origin}${pathOnly}`;

 return {
   title,
   description,
   alternates: { canonical },
   robots: { index: true, follow: true },
   openGraph: {
     title,
     description,
     type: "website",
     url: canonical,
   },
   twitter: {
     card: "summary_large_image",
     title,
     description,
   },
   keywords: [
     "Python",
     "Learning",
     "Activities",
     selectedCategory,
     selectedActivityType ? titleize(selectedActivityType) : undefined,
   ].filter(Boolean) as string[],
 };
}

function toArraySafe(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string") as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed.filter((v) => typeof v === "string") as string[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeType(activityType: string | null | undefined): string {
  if (!activityType) return "lesson";
  return activityType;
}

export default async function ActivitiesPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Fixed page size per request: always show 10 activities per page
  const pageSize = 10;

  // Get searchParams and await it
  const sp = await props.searchParams;

  // Helpers to read query params
  const getParam = (key: string): string | undefined => {
    const v = sp[key];
    if (Array.isArray(v)) return v[0];
    if (typeof v === "string") return v;
    return undefined;
  }

  const categoryParam = getParam("category");
  const typeParam = getParam("type");
  const pageNum = parseInt(getParam("page") || "1", 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

  // Default to Python Fundamentals category if not provided
  const selectedCategory = (categoryParam && categoryParam.trim()) || "Python Fundamentals";
  const selectedActivityType = typeParam && typeParam.trim() ? typeParam : undefined;

  // Build category candidates with alias support (merge 'python_fundamentals' etc. into 'Python Fundamentals')
  const normalizedCat = (selectedCategory || "").toLowerCase().replace(/[_\-]+/g, " ").trim();
  const PF_ALIASES = ["Python Fundamentals", "python fundamentals", "python_fundamentals", "python-fundamentals", "py fundamentals", "fundamentals"];
  const isPF = normalizedCat === "python fundamentals" || PF_ALIASES.map((a) => a.toLowerCase()).includes(normalizedCat);
  const categoryCandidates = selectedCategory ? (isPF ? PF_ALIASES : [selectedCategory]) : [];

  // Where clause (exclude lessons per requirement)
  const where = {
    isActive: true,
    NOT: { activityType: "lesson" as const },
    ...(categoryCandidates.length
      ? {
          OR: categoryCandidates.map((c) => ({
            category: { equals: c, mode: "insensitive" as const },
          })),
        }
      : {}),
    ...(selectedActivityType
      ? { activityType: { equals: selectedActivityType, mode: "insensitive" as const } }
      : {}),
  };

  // Parallel queries: total count, page data, distinct categories, distinct activity types
  const [total, rows, categoriesDistinct, activityTypesDistinct] = await Promise.all([
    prisma.learningActivity.count({ where }),
    prisma.learningActivity.findMany({
      where,
      orderBy: [
        { sortOrder: "asc" as const },
        { createdAt: "desc" as const },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        activityType: true,
        category: true,
        difficulty: true,
        diamondReward: true,
        experienceReward: true,
        estimatedMinutes: true,
        isLocked: true,
        tags: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.learningActivity.findMany({
      where: {
        isActive: true,
        NOT: { activityType: "lesson" as const },
      },
      select: { category: true },
      distinct: ["category"],
    }),
    prisma.learningActivity.findMany({
      where: {
        isActive: true,
        NOT: { activityType: "lesson" as const },
      },
      select: { activityType: true },
      distinct: ["activityType"],
    }),
  ]);

  // Determine which of the current page activities are completed by the logged-in user
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  let completedSet = new Set<string>();
  if (userId && rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const attempts = await prisma.activityAttempt.findMany({
      where: {
        userId,
        activityId: { in: ids },
        completed: true,
      },
      select: { activityId: true },
    });
    completedSet = new Set(attempts.map((a) => a.activityId));
  }

  const activities: ActivityDTO[] = rows.map((a) => ({
    id: a.id,
    slug: a.slug ?? a.id,
    title: a.title,
    description: a.description ?? "",
    activityType: normalizeType(a.activityType),
    category: a.category ?? "General",
    difficulty: Math.max(1, Math.min(5, Number(a.difficulty ?? 1))),
    diamondReward: Number(a.diamondReward ?? 0),
    experienceReward: Number(a.experienceReward ?? 0),
    estimatedMinutes: Number(a.estimatedMinutes ?? 5),
    isLocked: false,
    isCompleted: completedSet.has(a.id),
    tags: toArraySafe(a.tags as unknown),
  }));

  const categories = categoriesDistinct
    .map((c) => c.category)
    .filter((v): v is string => typeof v === "string");

  const activityTypes = activityTypesDistinct
    .map((t) => t.activityType)
    .filter((v): v is string => typeof v === "string");

  // Absolute origin for structured data URLs
  const hs2 = await headers();
  const proto2 = hs2.get("x-forwarded-proto") || "http";
  const host2 = hs2.get("x-forwarded-host") || hs2.get("host") || "localhost:3000";
  const origin2 = `${proto2}://${host2}`;

 return (
   <>
     <script
       type="application/ld+json"
       suppressHydrationWarning
       dangerouslySetInnerHTML={{
         __html: JSON.stringify({
           "@context": "https://schema.org",
           "@type": "ItemList",
           itemListOrder: "http://schema.org/ItemListOrderAscending",
           numberOfItems: activities.length,
           itemListElement: activities.map((a, i) => ({
             "@type": "ListItem",
             position: (page - 1) * pageSize + i + 1,
             url: `${origin2}/activities/${a.slug ?? a.id}`,
             name: a.title,
           })),
         }),
       }}
     />
     <ActivitiesClient
       activities={activities}
       total={total}
       page={page}
       pageSize={pageSize}
       categories={categories}
       activityTypes={activityTypes}
       selectedCategory={selectedCategory}
       selectedActivityType={selectedActivityType ?? null}
     />
   </>
 );
}
