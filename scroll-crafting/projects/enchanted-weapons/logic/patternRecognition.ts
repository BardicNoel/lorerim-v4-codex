import { EnchantedWeapon } from "./types.js";
import { errorLogger } from "../utils/errorLogger.js";

export interface WeaponPattern {
  patternType:
    | "material_weapon_enchantment"
    | "named_weapon"
    | "generic_weapon_enchantment";
  material?: string;
  weaponType: string;
  enchantmentType: string;
  enchantmentName: string;
  examples: EnchantedWeapon[];
  count: number;
  baseStats: {
    damageRange: [number, number];
    weightRange: [number, number];
    valueRange: [number, number];
  };
  enchantments: { name: string; description: string }[];
}

export interface WeaponClassification {
  type: "unique" | "pattern";
  reason?: string;
  confidence: number;
  pattern?: WeaponPattern;
}

export interface ParsedWeaponName {
  material?: string;
  weaponType: string;
  enchantment: string;
  isNamed: boolean;
}

/**
 * Common weapon materials in Skyrim
 */

const WEAPON_MATERIALS = [
  "Ancient Nord",
  "Blades",
  "Bonemold",
  "Chitin",
  "Daedric",
  "Dragonbone",
  "Dwarven",
  "Ebony",
  "Elven",
  "Falmer",
  "Glass",
  "Imperial",
  "Iron",
  "Lunar",
  "Morag Tong",
  "Nordic",
  "Orcish",
  "Skyforge Steel",
  "Silver",
  "Stalhrim",
  "Steel",
  "Stormcloak",
  "Thalmor",
];

/**
 * Comprehensive list of weapon types found in Skyrim
 */
export const WEAPON_TYPES = [
  // Special types (prioritized)
  "Spear",
  "Halberd",
  "Pike",
  "Lance",
  "Trident",
  "Glaive",
  "Polearm",

  // One-handed weapons
  "Sword",
  "Dagger",
  "Mace",
  "War Axe",
  "Battle Axe",
  "Warhammer",

  // Two-handed weapons
  "Greatsword",
  "Battleaxe",
  "Warhammer",
  "Bow",
  "Crossbow",

  // Staff variants
  "Staff",
  "Stave",
  "Quarterstaff",

  // Additional variants
  "Blade",
  "Axe",
  "Hammer",
  "Mace",
  "Dagger",
  "Bow",

  // Special types
  "Katana",
  "Wakizashi",
  "Tanto",
  "Claymore",
  "Falchion",
  "Scimitar",
  "Rapier",
  "Saber",
  "Cutlass",
  "Broadsword",
  "Longsword",
  "Shortsword",
  "Handaxe",
  "Hatchet",
  "Pickaxe",
  "Maul",
  "Club",
  "Flail",
  "Scythe",
];

/**
 * Common enchantment types in Skyrim
 */
export const ENCHANTMENT_TYPES = [
  "Fire Damage",
  "Frost Damage",
  "Shock Damage",
  "Absorb Health",
  "Absorb Magicka",
  "Absorb Stamina",
  "Turn Undead",
  "Banish Daedra",
  "Paralyze",
  "Silence",
  "Fear",
  "Frenzy",
  "Calm",
  "Rally",
  "Courage",
  "Waterbreathing",
  "Waterwalking",
  "Detect Life",
  "Detect Dead",
  "Fortify Health",
  "Fortify Magicka",
  "Fortify Stamina",
];

/**
 * Parses a weapon name to extract material, weapon type, and enchantment
 * This is a reusable utility that could be used in other weapon-related projects
 */
export function parseWeaponName(name: string): ParsedWeaponName | null {
  // Skip empty or null names
  if (!name || name.trim().length === 0) {
    return null;
  }

  // Check for corrupted names (containing non-printable characters or excessive symbols)
  if (isCorruptedName(name)) {
    return null;
  }

  // Try different parsing patterns in order of specificity
  let parsed = parseMaterialWeaponEnchantment(name);
  if (parsed) return parsed;

  parsed = parseWeaponEnchantment(name);
  if (parsed) return parsed;

  parsed = parseNamedWeapon(name);
  if (parsed) return parsed;

  // If all patterns fail, try to extract any recognizable weapon type
  const fallbackWeaponType = extractWeaponTypeFromName(name);
  if (fallbackWeaponType) {
    return {
      weaponType: fallbackWeaponType,
      enchantment: name,
      isNamed: false,
    };
  }

  // Log pattern recognition failures
  errorLogger.logPatternRecognition(name, "No matching pattern found");

  return null;
}

/**
 * Determines if a weapon name represents a named weapon
 */
function isNamedWeapon(name: string): boolean {
  // Named weapons typically don't start with material names
  const startsWithMaterial = WEAPON_MATERIALS.some((material) =>
    name.toLowerCase().startsWith(material.toLowerCase())
  );

  if (startsWithMaterial) return false;

  // Named weapons often have unique names that don't follow standard patterns
  const hasStandardPattern =
    /(sword|dagger|axe|mace|bow|staff|crossbow)\s+of\s+/i.test(name);

  return !hasStandardPattern;
}

/**
 * Extracts weapon type from a named weapon
 */
function extractWeaponTypeFromNamed(name: string): string {
  const lowerName = name.toLowerCase();

  // First check for spear specifically
  if (lowerName.includes("spear")) {
    // Check for specific spear variants
    if (
      lowerName.includes("two-handed spear") ||
      lowerName.includes("2h spear")
    ) {
      return "Two-Handed Spear";
    }
    if (
      lowerName.includes("one-handed spear") ||
      lowerName.includes("1h spear")
    ) {
      return "One-Handed Spear";
    }
    return "Spear";
  }

  // Then check for other weapon types
  for (const weaponType of WEAPON_TYPES) {
    if (lowerName.includes(weaponType.toLowerCase())) {
      return weaponType;
    }
  }

  // Fallback based on common named weapon patterns
  if (lowerName.includes("sword")) return "Sword";
  if (lowerName.includes("dagger")) return "Dagger";
  if (lowerName.includes("axe")) return "Axe";
  if (lowerName.includes("mace")) return "Mace";
  if (lowerName.includes("bow")) return "Bow";
  if (lowerName.includes("staff")) return "Staff";

  return "Unknown";
}

/**
 * Extracts enchantment from a named weapon
 */
function extractEnchantmentFromNamed(name: string): string {
  // Try to find enchantment type in the name
  for (const enchantmentType of ENCHANTMENT_TYPES) {
    if (name.toLowerCase().includes(enchantmentType.toLowerCase())) {
      return enchantmentType;
    }
  }

  // Look for common enchantment keywords
  if (name.toLowerCase().includes("fire")) return "Fire Damage";
  if (
    name.toLowerCase().includes("frost") ||
    name.toLowerCase().includes("ice")
  )
    return "Frost Damage";
  if (
    name.toLowerCase().includes("shock") ||
    name.toLowerCase().includes("lightning")
  )
    return "Shock Damage";
  if (name.toLowerCase().includes("absorb")) return "Absorb Health";
  if (name.toLowerCase().includes("banish")) return "Banish Daedra";
  if (name.toLowerCase().includes("turn")) return "Turn Undead";

  return "Unknown Enchantment";
}

/**
 * Parses material + weapon type + enchantment pattern
 * Example: "Dwarven Sword of Fire Damage", "Golden Sword of Consuming"
 */
function parseMaterialWeaponEnchantment(name: string): ParsedWeaponName | null {
  // Pattern: {Material} {WeaponType} of {Enchantment}
  const pattern = /^([A-Za-z\s]+)\s+([A-Za-z\s]+)\s+of\s+(.+)$/i;
  const match = name.match(pattern);

  if (!match) return null;

  const [, materialPart, weaponTypePart, enchantmentPart] = match;

  // Validate material
  const material = findBestMatch(materialPart.trim(), WEAPON_MATERIALS);
  if (!material) return null;

  // Validate weapon type - be more flexible here
  const weaponType = findBestMatch(weaponTypePart.trim(), WEAPON_TYPES);
  if (!weaponType) {
    // If exact match fails, try to find weapon type in the name
    const foundWeaponType = WEAPON_TYPES.find((type) =>
      weaponTypePart.trim().toLowerCase().includes(type.toLowerCase())
    );
    if (foundWeaponType) {
      return {
        material,
        weaponType: foundWeaponType,
        enchantment: enchantmentPart.trim(),
        isNamed: false,
      };
    }
    return null;
  }

  return {
    material,
    weaponType,
    enchantment: enchantmentPart.trim(),
    isNamed: false,
  };
}

/**
 * Parses weapon type + enchantment pattern (no material)
 * Example: "Sword of Fire"
 */
function parseWeaponEnchantment(name: string): ParsedWeaponName | null {
  // Pattern: {WeaponType} of {Enchantment}
  const pattern = /^([A-Za-z\s]+)\s+of\s+(.+)$/i;
  const match = name.match(pattern);

  if (!match) return null;

  const [, weaponTypePart, enchantmentPart] = match;

  // Validate weapon type - be more flexible here
  const weaponType = findBestMatch(weaponTypePart.trim(), WEAPON_TYPES);
  if (!weaponType) {
    // If exact match fails, try to find weapon type in the name
    const foundWeaponType = WEAPON_TYPES.find((type) =>
      weaponTypePart.trim().toLowerCase().includes(type.toLowerCase())
    );
    if (foundWeaponType) {
      return {
        weaponType: foundWeaponType,
        enchantment: enchantmentPart.trim(),
        isNamed: false,
      };
    }
    return null;
  }

  return {
    weaponType,
    enchantment: enchantmentPart.trim(),
    isNamed: false,
  };
}

/**
 * Finds the best match for a string in a list of known values
 * This is a reusable utility for fuzzy matching
 */
function findBestMatch(input: string, knownValues: string[]): string | null {
  const normalizedInput = input.toLowerCase().trim();

  // Exact match
  const exactMatch = knownValues.find(
    (value) => value.toLowerCase() === normalizedInput
  );
  if (exactMatch) return exactMatch;

  // Contains match
  const containsMatch = knownValues.find(
    (value) =>
      normalizedInput.includes(value.toLowerCase()) ||
      value.toLowerCase().includes(normalizedInput)
  );
  if (containsMatch) return containsMatch;

  return null;
}

/**
 * Checks if a weapon name is corrupted (contains non-printable characters or excessive symbols)
 */
function isCorruptedName(name: string): boolean {
  // Check for excessive special characters or non-printable characters
  const specialCharRatio =
    (name.match(/[^a-zA-Z0-9\s]/g) || []).length / name.length;
  const hasNonPrintable = /[\x00-\x1F\x7F]/.test(name);

  return specialCharRatio > 0.3 || hasNonPrintable || name.length < 3;
}

/**
 * Parses named weapons (unique weapons with special names)
 */
function parseNamedWeapon(name: string): ParsedWeaponName | null {
  // Check if it's a named weapon (no material prefix, not following standard patterns)
  if (isNamedWeapon(name)) {
    return {
      weaponType: extractWeaponTypeFromNamed(name),
      enchantment: extractEnchantmentFromNamed(name),
      isNamed: true,
    };
  }
  return null;
}

/**
 * Groups weapons by their pattern and creates pattern objects
 * This is the main function that could be reused in other projects
 */
export function detectWeaponPatterns(
  weapons: EnchantedWeapon[]
): WeaponPattern[] {
  const patterns = new Map<string, WeaponPattern>();

  for (const weapon of weapons) {
    const parsedName = parseWeaponName(weapon.name);

    if (!parsedName) {
      // Skip weapons that can't be parsed
      continue;
    }

    // Group by material + weapon type, not by individual enchantment
    const patternKey = `${parsedName.material || "Generic"}:${parsedName.weaponType}`;

    if (!patterns.has(patternKey)) {
      patterns.set(patternKey, {
        patternType: parsedName.material
          ? "material_weapon_enchantment"
          : "generic_weapon_enchantment",
        material: parsedName.material,
        weaponType: parsedName.weaponType,
        enchantmentType: "Various", // Will be replaced with summary
        enchantmentName: "Various Enchantments", // Will be replaced with summary
        examples: [],
        count: 0,
        baseStats: {
          damageRange: [weapon.baseDamage, weapon.baseDamage],
          weightRange: [weapon.weight, weapon.weight],
          valueRange: [weapon.value, weapon.value],
        },
        enchantments: [],
      });
    }

    const pattern = patterns.get(patternKey)!;
    pattern.examples.push(weapon);
    pattern.count++;

    // Update stat ranges
    pattern.baseStats.damageRange[0] = Math.min(
      pattern.baseStats.damageRange[0],
      weapon.baseDamage
    );
    pattern.baseStats.damageRange[1] = Math.max(
      pattern.baseStats.damageRange[1],
      weapon.baseDamage
    );
    pattern.baseStats.weightRange[0] = Math.min(
      pattern.baseStats.weightRange[0],
      weapon.weight
    );
    pattern.baseStats.weightRange[1] = Math.max(
      pattern.baseStats.weightRange[1],
      weapon.weight
    );
    pattern.baseStats.valueRange[0] = Math.min(
      pattern.baseStats.valueRange[0],
      weapon.value
    );
    pattern.baseStats.valueRange[1] = Math.max(
      pattern.baseStats.valueRange[1],
      weapon.value
    );

    // Add enchantment to the list (avoid duplicates)
    const existingEnchantment = pattern.enchantments.find(
      (e) => e.name === weapon.enchantment.name
    );
    if (!existingEnchantment) {
      pattern.enchantments.push({
        name: weapon.enchantment.name,
        description: weapon.enchantment.effects
          .map((e) => e.description || e.name)
          .join("; "),
      });
    }
  }

  return Array.from(patterns.values());
}

/**
 * Creates a unique key for grouping weapons by pattern
 * This is a reusable utility for creating grouping keys
 */
function createPatternKey(
  parsedName: ParsedWeaponName,
  enchantmentName: string
): string {
  if (parsedName.isNamed) {
    return `named:${parsedName.weaponType}:${enchantmentName}`;
  }

  if (parsedName.material) {
    return `material:${parsedName.material}:${parsedName.weaponType}:${parsedName.enchantment}`;
  }

  return `generic:${parsedName.weaponType}:${parsedName.enchantment}`;
}

/**
 * Calculates statistical ranges for a group of weapons
 * This is a reusable utility for calculating stat ranges
 */
export function calculateStatRanges(weapons: EnchantedWeapon[]): {
  damageRange: [number, number];
  weightRange: [number, number];
  valueRange: [number, number];
} {
  if (weapons.length === 0) {
    return {
      damageRange: [0, 0],
      weightRange: [0, 0],
      valueRange: [0, 0],
    };
  }

  const damages = weapons.map((w) => w.baseDamage);
  const weights = weapons.map((w) => w.weight);
  const values = weapons.map((w) => w.value);

  return {
    damageRange: [Math.min(...damages), Math.max(...damages)] as [
      number,
      number,
    ],
    weightRange: [Math.min(...weights), Math.max(...weights)] as [
      number,
      number,
    ],
    valueRange: [Math.min(...values), Math.max(...values)] as [number, number],
  };
}

/**
 * Fallback function to extract weapon type from any part of the name
 */
function extractWeaponTypeFromName(name: string): string | null {
  const lowerName = name.toLowerCase();

  // First check for spear specifically
  if (lowerName.includes("spear")) {
    // Check for specific spear variants
    if (
      lowerName.includes("two-handed spear") ||
      lowerName.includes("2h spear")
    ) {
      return "Two-Handed Spear";
    }
    if (
      lowerName.includes("one-handed spear") ||
      lowerName.includes("1h spear")
    ) {
      return "One-Handed Spear";
    }
    return "Spear";
  }

  // Look for weapon types anywhere in the name
  for (const weaponType of WEAPON_TYPES) {
    if (lowerName.includes(weaponType.toLowerCase())) {
      return weaponType;
    }
  }

  return null;
}

export function classifyWeapon(
  weapon: EnchantedWeapon,
  patterns: WeaponPattern[]
): WeaponClassification {
  const parsedName = parseWeaponName(weapon.name);

  if (!parsedName) {
    return {
      type: "unique",
      reason: "unparseable_name",
      confidence: 0.5,
    };
  }

  // Find matching pattern
  const patternKey = createPatternKey(parsedName, weapon.enchantment.name);
  const matchingPattern = patterns.find((p) => {
    const pKey = createPatternKey(
      {
        material: p.material,
        weaponType: p.weaponType,
        enchantment: p.enchantmentType,
        isNamed: false,
      },
      p.enchantmentName
    );
    return pKey === patternKey;
  });

  if (!matchingPattern) {
    return {
      type: "unique",
      reason: "no_matching_pattern",
      confidence: 0.7,
    };
  }

  // If pattern has only one weapon, it's unique
  if (matchingPattern.count === 1) {
    return {
      type: "unique",
      reason: "single_occurrence_pattern",
      confidence: 0.8,
    };
  }

  // Check for uniqueness factors
  const uniquenessFactors = [];

  if (parsedName.isNamed) uniquenessFactors.push("named_weapon");
  if (weapon.baseDamage > 50) uniquenessFactors.push("high_damage");
  if (weapon.value > 1000) uniquenessFactors.push("high_value");
  if (weapon.weight > 20) uniquenessFactors.push("heavy_weapon");
  if (weapon.weight < 5) uniquenessFactors.push("light_weapon");

  // If weapon has multiple uniqueness factors, classify as unique
  if (uniquenessFactors.length >= 2) {
    return {
      type: "unique",
      reason: `multiple_uniqueness_factors: ${uniquenessFactors.join(", ")}`,
      confidence: 0.9,
    };
  }

  // Default to pattern-based
  return {
    type: "pattern",
    pattern: matchingPattern,
    confidence: 0.8,
  };
}

export function summarizePatternEnchantments(
  patternExamples: EnchantedWeapon[]
): { name: string; description: string }[] {
  // Group by enchantment name, summarize effect
  const enchantmentMap = new Map<
    string,
    { name: string; description: string }
  >();
  for (const weapon of patternExamples) {
    const ench = weapon.enchantment;
    let desc = ench.effects.map((e) => e.description || e.name).join("; ");
    if (!desc) desc = ench.name;
    enchantmentMap.set(ench.name, { name: ench.name, description: desc });
  }
  return Array.from(enchantmentMap.values());
}
