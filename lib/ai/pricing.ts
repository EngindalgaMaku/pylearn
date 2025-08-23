export async function calculateDiamondPrice(
  rarity: string,
  estimatedValue: number,
  confidence: number,
  cardId?: string
): Promise<number> {
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
  const seed = `${cardId || ""}:${rarity}:${estimatedValue}:${confidence}`;
  const rng = mulberry32(xmur3(seed)());
  const rarityBase: Record<string, [number, number]> = {
    Common: [50, 150],
    Uncommon: [100, 250],
    Rare: [200, 500],
    Epic: [400, 900],
    Legendary: [800, 1600],
  };
  const [min, max] = rarityBase[rarity] || [100, 300];
  const confFactor = 0.8 + Math.min(1, Math.max(0, confidence / 100)) * 0.4; // 0.8..1.2
  const valueFactor = Math.min(2, Math.max(0.6, estimatedValue / 300));
  const base = min + rng() * (max - min);
  const price = Math.round(base * confFactor * valueFactor);
  return Math.max(1, price);
}
