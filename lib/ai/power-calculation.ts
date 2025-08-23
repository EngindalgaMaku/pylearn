export async function generateRarityAwareCardProperties(
  estimatedValue: number,
  rarity: string,
  cardId: string,
  fileName: string,
  category?: string
) {
  // Deterministic PRNG (mulberry32)
  function xmur3(str: string) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }
  function mulberry32(a: number) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const seedBase = `${cardId}:${fileName}:${rarity}:${category || ""}:${estimatedValue}`;
  const seedFn = xmur3(seedBase);
  const rng = mulberry32(seedFn());

  const rarityLevel = (() => {
    const map: Record<string, number> = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5 };
    return map[rarity] ?? 1;
  })();

  const rand = (min: number, max: number) => Math.floor(min + rng() * (max - min + 1));

  const baseAttack = 30 + rarityLevel * 15;
  const baseDefense = 25 + rarityLevel * 12;
  const baseSpeed = 20 + rarityLevel * 10;

  const attackPower = baseAttack + rand(0, 20);
  const defense = baseDefense + rand(0, 18);
  const speed = baseSpeed + rand(0, 15);

  const elements = ["fire", "water", "earth", "air", "light", "shadow"];
  const abilities = [
    "Power Surge",
    "Arcane Shield",
    "Swift Strike",
    "Elemental Burst",
    "Divine Blessing",
    "Shadow Veil",
  ];

  const element = elements[Math.floor(rng() * elements.length)];
  const specialAbility = abilities[Math.floor(rng() * abilities.length)];

  const ratingRaw = Math.min(5, Math.max(1, 2.5 + rarityLevel * 0.5 + (estimatedValue || 0) / 500));
  const rating = Math.round(ratingRaw * 10) / 10;

  // Simple title generation
  const categoryName = (category || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim() || "Card";
  const baseName = fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
  const cardTitle = `${categoryName} ${baseName}`.trim();

  return { cardTitle, attackPower, defense, speed, specialAbility, element, rarityLevel, rating };
}
