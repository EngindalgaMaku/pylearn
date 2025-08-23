export type ValueEstimationData = {
  rarity: string;
  condition?: string;
  series?: string;
  character?: string;
  ocrConfidence?: number;
};

export type ValueEstimationResult = {
  estimatedValue: number;
  confidence: number;
  factors: Record<string, number | string | undefined>;
  reasoning: string;
};

const RARITY_MULT: Record<string, number> = {
  Common: 1,
  Uncommon: 1.2,
  Rare: 1.6,
  Epic: 2.2,
  Legendary: 3.5,
};

const CONDITION_MULT: Record<string, number> = {
  mint: 1.3,
  good: 1.1,
  fair: 0.95,
  poor: 0.8,
};

export function estimateCardValue(data: ValueEstimationData): ValueEstimationResult {
  const base = 50;
  const rarityMult = RARITY_MULT[data.rarity] ?? 1.0;
  const condMult = data.condition ? (CONDITION_MULT[data.condition.toLowerCase()] ?? 1.0) : 1.0;
  const seriesMult = data.series ? 1.05 : 1.0;
  const charMult = data.character ? 1.05 : 1.0;
  const confMult = data.ocrConfidence != null ? 0.8 + Math.min(1, Math.max(0, data.ocrConfidence / 100)) * 0.4 : 1.0;

  const factors = {
    baseValue: base,
    rarityMult,
    condMult,
    seriesMult,
    charMult,
    confMult,
  } as const;

  const estimated = Math.round(base * rarityMult * condMult * seriesMult * charMult * confMult);
  const confidence = Math.min(95, 50 + Math.round((data.ocrConfidence ?? 60) / 2));
  const reasoning = `Estimated from rarity(${data.rarity}), condition(${data.condition || 'n/a'}), series/character presence and OCR confidence.`;
  return { estimatedValue: Math.max(estimated, 1), confidence, factors: { ...factors }, reasoning };
}
