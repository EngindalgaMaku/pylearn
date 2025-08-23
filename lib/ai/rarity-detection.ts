export type ImageAnalysisData = {
  fileName: string;
  fileSize?: number;
  imagePath?: string;
  ocrText?: string;
  detectedSeries?: string;
  detectedCharacter?: string;
};

export type RarityAnalysis = {
  detectedRarity: string;
  confidence: number;
  factors: Record<string, number | string | undefined>;
  reasoning: string;
};

const ORDER = ["Common", "Uncommon", "Rare", "Epic", "Legendary"] as const;

function fromIndicators(txt: string) {
  const t = txt.toLowerCase();
  if (/legend|myth|ultra|ssr/.test(t)) return "Legendary";
  if (/epic|ur|sr/.test(t)) return "Epic";
  if (/(\brare\b| r\b)/.test(t)) return "Rare";
  if (/uncommon|uc/.test(t)) return "Uncommon";
  return "Common";
}

export async function detectCardRarity(data: ImageAnalysisData): Promise<RarityAnalysis> {
  const name = data.fileName || "";
  const hintFromText = fromIndicators([data.ocrText, data.detectedSeries, data.detectedCharacter, name].filter(Boolean).join(" "));

  const sizeScore = Math.min(1, Math.max(0, (data.fileSize || 0) / (400 * 1024))); // 0..1 based on ~400KB
  const nameScore = ORDER.indexOf(hintFromText as any) / (ORDER.length - 1); // 0..1

  const mix = 0.4 * sizeScore + 0.6 * nameScore; // weighted
  let idx = Math.round(mix * (ORDER.length - 1));
  idx = Math.min(ORDER.length - 1, Math.max(0, idx));
  const detectedRarity = ORDER[idx];

  const confidence = Math.round(60 + nameScore * 35);
  const factors = { sizeScore, nameScore, hint: hintFromText };
  const reasoning = `Derived from filename/ocr indicators and file size; weighted to ${detectedRarity}.`;
  return { detectedRarity, confidence, factors, reasoning };
}
