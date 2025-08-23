// Lightweight local OCR/analysis adapter to avoid cross-project sharp dependency.
// This extracts basic metadata from filename and category and returns a low/medium confidence result.

export type CardAnalysisResult = {
  ocrText: string;
  confidence: number;
  story?: string;
  cardInfo: {
    name?: string | null;
    series?: string | null;
    character?: string | null;
    rarity?: string | null;
    stats?: { attack?: number; defense?: number; speed?: number } | null;
  };
};

function titleCase(s: string) {
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function isLikelyHashToken(token: string) {
  // Pure hex length >= 6, or mostly hex-like
  const t = token.replace(/[^a-z0-9]/gi, "");
  if (!t) return true;
  if (/^[0-9a-f]{6,}$/i.test(t)) return true;
  if (/^[0-9]{6,}$/.test(t)) return true;
  return false;
}

function isMeaningfulWord(word: string) {
  if (!word) return false;
  if (isLikelyHashToken(word)) return false;
  // At least 2 letters
  if (!/[a-zA-Z]{2,}/.test(word)) return false;
  return true;
}

function guessFromFileName(fileName: string) {
  const base = fileName.replace(/\.[a-z0-9]+$/i, "");
  // Strip leading upload prefixes like: <digits>_<hex>_rest or <digits>-<hex>-rest
  const stripped = base.replace(/^\d{8,}[_-][0-9a-f]{6,}[_-]/i, "");
  const cleaned = stripped.replace(/\d{6,}/g, "");
  const rawParts = cleaned.split(/[-_]+/).filter(Boolean);
  const parts = rawParts.filter((p) => !isLikelyHashToken(p));
  let series: string | undefined;
  let character: string | undefined;

  if (parts.length >= 2) {
    series = isMeaningfulWord(parts[0]) ? titleCase(parts[0]) : undefined;
    const charTokens = parts.slice(1).filter(isMeaningfulWord);
    if (charTokens.length) character = titleCase(charTokens.join(" "));
  } else if (parts.length === 1) {
    if (isMeaningfulWord(parts[0])) character = titleCase(parts[0]);
  }

  let rarity: string | undefined;
  const lower = cleaned.toLowerCase();
  if (/legend|myth|ultra|ssr/.test(lower)) rarity = "Legendary";
  else if (/epic|ur|sr/.test(lower)) rarity = "Epic";
  else if (/rare|r\b/.test(lower)) rarity = "Rare";
  else rarity = undefined;

  return { series, character, rarity };
}

// Deterministic small hash to pick from arrays (consistent results)
function hashToIndex(seed: string, modulo: number) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % Math.max(1, modulo);
}

function detectSeriesFromFilename(fileName: string, category?: string): string {
  const lower = fileName.toLowerCase();
  const categoryLower = (category || "anime-collection").toLowerCase();

  if (categoryLower === "movies") {
    const map: Record<string, string> = {
      marvel: "Marvel Cinematic Universe",
      avengers: "Marvel Cinematic Universe",
      dc: "DC Extended Universe",
      batman: "DC Comics",
      superman: "DC Comics",
      star: "Star Wars",
      wars: "Star Wars",
      harry: "Harry Potter",
      potter: "Harry Potter",
      rings: "Lord of the Rings",
      mission: "Mission Impossible",
      transformer: "Transformers",
      matrix: "The Matrix",
    };
    for (const [k, v] of Object.entries(map)) if (lower.includes(k)) return v;
    return "Action Movie Collection";
  }

  if (categoryLower === "car" || categoryLower === "cars") {
    const map: Record<string, string> = {
      ferrari: "Ferrari Collection",
      lamborghini: "Lamborghini Collection",
      porsche: "Porsche Collection",
      mercedes: "Mercedes-Benz Collection",
      bmw: "BMW Collection",
      audi: "Audi Collection",
      toyota: "Toyota Collection",
      honda: "Honda Collection",
      nissan: "Nissan Collection",
      supra: "Toyota Supra Series",
      skyline: "Nissan Skyline Series",
      gtr: "Nissan GT-R Series",
      mustang: "Ford Mustang Series",
      corvette: "Chevrolet Corvette Series",
      camaro: "Chevrolet Camaro Series",
    };
    for (const [k, v] of Object.entries(map)) if (lower.includes(k)) return v;
    return "Automotive Collection";
  }

  if (categoryLower === "games") {
    const map: Record<string, string> = {
      pokemon: "Pokemon",
      fantasy: "Final Fantasy",
      zelda: "The Legend of Zelda",
      mario: "Super Mario",
      sonic: "Sonic the Hedgehog",
      street: "Street Fighter",
      tekken: "Tekken",
      mortal: "Mortal Kombat",
      league: "League of Legends",
      warcraft: "World of Warcraft",
    };
    for (const [k, v] of Object.entries(map)) if (lower.includes(k)) return v;
    return "Gaming Collection";
  }

  if (categoryLower === "sports") {
    const map: Record<string, string> = {
      nba: "NBA",
      nfl: "NFL",
      fifa: "FIFA",
      uefa: "UEFA",
      premier: "Premier League",
      mlb: "MLB",
      nhl: "NHL",
    };
    for (const [k, v] of Object.entries(map)) if (lower.includes(k)) return v;
    return "Sports Collection";
  }

  // Default anime detection (anime-collection)
  const animeMap: Record<string, string> = {
    naruto: "Naruto",
    dragon: "Dragon Ball",
    ball: "Dragon Ball",
    pokemon: "Pokemon",
    yugioh: "Yu-Gi-Oh!",
    onepiece: "One Piece",
    piece: "One Piece",
    bleach: "Bleach",
    attack: "Attack on Titan",
    titan: "Attack on Titan",
    demon: "Demon Slayer",
    slayer: "Demon Slayer",
    jujutsu: "Jujutsu Kaisen",
    kaisen: "Jujutsu Kaisen",
    hero: "My Hero Academia",
    academia: "My Hero Academia",
    hunter: "Hunter x Hunter",
    death: "Death Note",
    sailor: "Sailor Moon",
    moon: "Sailor Moon",
  };
  for (const [k, v] of Object.entries(animeMap)) if (lower.includes(k)) return v;
  return "Anime Collection";
}

function generateCharacterForSeries(series: string, category?: string, seed: string = ""): string {
  const idx = (arrLen: number) => hashToIndex(series + "|" + (category || "") + "|" + seed, arrLen);
  const categoryLower = (category || "anime-collection").toLowerCase();

  if (categoryLower === "movies") {
    const map: Record<string, string[]> = {
      "Marvel Cinematic Universe": ["Iron Man", "Captain America", "Thor", "Black Widow", "Hulk"],
      "DC Extended Universe": ["Wonder Woman", "Batman", "Superman", "Aquaman", "Flash"],
      "DC Comics": ["Bruce Wayne", "Clark Kent", "Diana Prince", "Barry Allen"],
      "Star Wars": ["Luke Skywalker", "Darth Vader", "Princess Leia", "Han Solo"],
      "Harry Potter": ["Harry Potter", "Hermione Granger", "Ron Weasley", "Albus Dumbledore"],
      "Lord of the Rings": ["Aragorn", "Legolas", "Gandalf", "Frodo"],
      "Mission Impossible": ["Ethan Hunt", "Ilsa Faust", "Benji Dunn", "Luther Stickell"],
      Transformers: ["Optimus Prime", "Bumblebee", "Megatron"],
      "The Matrix": ["Neo", "Morpheus", "Trinity", "Agent Smith"],
      "Action Movie Collection": ["Action Hero", "Elite Agent", "Special Forces"],
    };
    const arr = map[series] || ["Movie Hero", "Action Star", "Film Character"];
    return arr[idx(arr.length)];
  }

  if (categoryLower === "car" || categoryLower === "cars") {
    const map: Record<string, string[]> = {
      "Ferrari Collection": ["Ferrari F40", "Ferrari F50", "Ferrari Enzo", "LaFerrari"],
      "Lamborghini Collection": ["Gallardo", "Huracan", "Aventador", "Murcielago"],
      "Porsche Collection": ["Porsche 911", "Cayman GT4", "Boxster S"],
      "Mercedes-Benz Collection": ["Mercedes AMG GT", "S-Class", "E-Class AMG"],
      "BMW Collection": ["BMW M3", "BMW M5", "BMW i8"],
      "Audi Collection": ["Audi RS6", "Audi R8", "Audi RS4"],
      "Automotive Collection": ["Super Car", "Race Car", "Sports Car", "Muscle Car"],
    };
    const arr = map[series] || ["Classic Car", "Performance Vehicle", "Racing Machine"];
    return arr[idx(arr.length)];
  }

  if (categoryLower === "games") {
    const map: Record<string, string[]> = {
      Pokemon: ["Pikachu", "Charizard", "Blastoise", "Mew"],
      "Final Fantasy": ["Cloud Strife", "Sephiroth", "Tifa"],
      "League of Legends": ["Ahri", "Yasuo", "Jinx", "Ezreal"],
      "World of Warcraft": ["Thrall", "Jaina", "Arthas", "Illidan"],
      "The Legend of Zelda": ["Link", "Zelda", "Ganondorf", "Midna"],
      "Super Mario": ["Mario", "Luigi", "Peach", "Bowser"],
      "Sonic the Hedgehog": ["Sonic", "Tails", "Knuckles", "Shadow"],
      "Street Fighter": ["Ryu", "Chun-Li", "Ken", "Akuma"],
      Tekken: ["Jin Kazama", "Kazuya Mishima", "Nina"],
      "Mortal Kombat": ["Scorpion", "Sub-Zero", "Liu Kang", "Raiden"],
      "Gaming Collection": ["Game Hero", "Player Character", "Digital Warrior"],
    };
    const arr = map[series] || ["Gamer", "Player One", "Digital Hero"];
    return arr[idx(arr.length)];
  }

  if (categoryLower === "sports") {
    const map: Record<string, string[]> = {
      NBA: ["LeBron James", "Stephen Curry", "Michael Jordan", "Kobe Bryant"],
      NFL: ["Tom Brady", "Aaron Rodgers", "Patrick Mahomes"],
      FIFA: ["Lionel Messi", "Cristiano Ronaldo", "Neymar Jr"],
      "Premier League": ["Harry Kane", "Mohamed Salah", "Kevin De Bruyne"],
      MLB: ["Babe Ruth", "Derek Jeter", "Mike Trout"],
      NHL: ["Wayne Gretzky", "Sidney Crosby", "Alex Ovechkin"],
      "Sports Collection": ["All-Star Player", "MVP Athlete", "Sports Legend"],
    };
    const arr = map[series] || ["Athlete", "Sports Star", "Champion"];
    return arr[idx(arr.length)];
  }

  // Default anime characters
  const map: Record<string, string[]> = {
    Naruto: ["Naruto Uzumaki", "Sasuke Uchiha", "Sakura Haruno", "Kakashi Hatake"],
    "Dragon Ball": ["Goku", "Vegeta", "Gohan", "Piccolo"],
    Pokemon: ["Pikachu", "Charizard", "Mewtwo"],
    "One Piece": ["Luffy", "Zoro", "Sanji", "Nami"],
    "Attack on Titan": ["Eren Yeager", "Mikasa", "Levi"],
    "Demon Slayer": ["Tanjiro", "Nezuko", "Zenitsu", "Inosuke"],
    "Jujutsu Kaisen": ["Yuji Itadori", "Megumi", "Nobara", "Gojo"],
    "My Hero Academia": ["Izuku Midoriya", "Bakugo", "Todoroki", "Uraraka"],
    "Death Note": ["Light Yagami", "L", "Misa"],
    "Sailor Moon": ["Sailor Moon", "Sailor Mercury", "Sailor Mars"],
  };
  const arr = map[series] || ["Anime Character", "Mystery Hero", "Unknown Fighter"];
  return arr[idx(arr.length)];
}

export async function processCardImage(imagePath: string, category?: string): Promise<CardAnalysisResult> {
  // We only look at file name here (no heavy OCR).
  try {
    const fileName = imagePath?.split(/[\/\\]/).pop() || "card.jpg";
    const baseNoExt = fileName.replace(/\.[a-z0-9]+$/i, "");
    const guessed = guessFromFileName(fileName);

    // Category-aware series/character
    const detectedSeries = detectSeriesFromFilename(baseNoExt, category);
    // Important: Do NOT use filename tokens for character (matches admin analyze logic)
    const character = generateCharacterForSeries(detectedSeries, category, baseNoExt);
    const baseSeries = detectedSeries || guessed.series || (category ? titleCase(String(category)) : undefined);
    const stats = {
      attack: 50 + Math.floor(Math.random() * 40),
      defense: 40 + Math.floor(Math.random() * 40),
      speed: 30 + Math.floor(Math.random() * 40),
    };

    const name = character ? `${baseSeries || "Series"} - ${character}` : baseSeries || guessed.series || undefined;

    const story = `In the ${baseSeries || "Anime"} universe, ${character || "a mysterious hero"} emerges with balanced power.`;

    return {
      ocrText: name || fileName,
      confidence: guessed.series || guessed.character ? 68 : 40,
      story,
      cardInfo: {
        name,
        series: baseSeries || null,
        character: character || null,
        rarity: guessed.rarity || null,
        stats,
      },
    };
  } catch {
    return {
      ocrText: "",
      confidence: 30,
      story: undefined,
      cardInfo: { name: null, series: category || null, character: null, rarity: null, stats: null },
    };
  }
}
