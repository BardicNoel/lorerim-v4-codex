import { EnchantedWeapon } from "./types.js";
import { parseWeaponName, WEAPON_MATERIALS } from "./patternRecognition.js";

export interface UniqueWeapon extends EnchantedWeapon {
  uniquenessFactors: string[];
}

export interface ClassificationResult {
  isUnique: boolean;
  uniquenessFactors: string[];
}

/**
 * Classifies a weapon as unique or part of a pattern
 * This is a reusable utility that could be used in other weapon-related projects
 */
export function classifyWeaponUniqueness(
  weapon: EnchantedWeapon,
  allWeapons: EnchantedWeapon[]
): ClassificationResult {
  const uniquenessFactors: string[] = [];

  // Skip weapons with corrupted names (treat as pattern weapons)
  if (isCorruptedName(weapon.name)) {
    return {
      isUnique: false,
      uniquenessFactors: [],
    };
  }

  // Check if it's a named weapon
  const parsedName = parseWeaponName(weapon.name);
  if (parsedName && parsedName.isNamed) {
    uniquenessFactors.push("Named weapon");
  }

  // Check for unusual stats (outliers) - be more conservative
  if (isStatOutlier(weapon, allWeapons)) {
    uniquenessFactors.push("Unusual stats");
  }

  // Check for multiple enchantment effects
  if (weapon.enchantment.effects.length > 1) {
    uniquenessFactors.push("Multiple effects");
  }

  // Check for unique enchantments - be more conservative
  if (isUniqueEnchantment(weapon.enchantment.name, allWeapons)) {
    uniquenessFactors.push("Unique enchantment");
  }

  // Check for quest reward weapons (common unique weapons)
  if (isQuestRewardWeapon(weapon.name)) {
    // Only add as uniqueness factor if not a pattern weapon
    if (!parsedName || parsedName.isNamed) {
      uniquenessFactors.push("Quest reward");
    }
  }

  // Check for special properties
  if (hasSpecialProperties(weapon)) {
    // Only add as uniqueness factor if not a pattern weapon
    if (!parsedName || parsedName.isNamed) {
      uniquenessFactors.push("Special properties");
    }
  }

  // Check for custom/unique names - be more conservative
  if (isCustomNamedWeapon(weapon.name)) {
    uniquenessFactors.push("Custom name");
  }

  // If the weapon matches a material + weapon type + enchantment pattern, do not mark as unique just for quest reward or special properties
  const isPatternWeapon =
    parsedName &&
    parsedName.material &&
    parsedName.weaponType &&
    parsedName.enchantment;
  const filteredFactors = isPatternWeapon
    ? uniquenessFactors.filter((f) =>
        [
          "Named weapon",
          "Unusual stats",
          "Multiple effects",
          "Unique enchantment",
          "Custom name",
        ].includes(f)
      )
    : uniquenessFactors;

  // A weapon is considered unique if it has at least TWO filtered uniqueness factors
  const isUnique = filteredFactors.length >= 2;

  return {
    isUnique,
    uniquenessFactors: filteredFactors,
  };
}

/**
 * Checks if a weapon name is corrupted or invalid
 * This is a reusable utility for name validation
 */
function isCorruptedName(name: string): boolean {
  // Check for common corruption patterns
  const corruptedPatterns = [
    /^[^\x00-\x7F]+$/, // Non-ASCII characters only
    /^[^\w\s]+$/, // No alphanumeric characters
    /^[^\x20-\x7E]+$/, // No printable ASCII characters
    /^ï¿½/, // Common corruption pattern
    /^@\u0001/, // Another corruption pattern
    /^\u0001/, // Control character at start
    /^[^\x20-\x7E]*$/, // Only non-printable characters
    /^[a-zA-Z]\u0001$/, // Single letter followed by control character
    /^[^\x20-\x7E]+\u0001$/, // Non-printable followed by control character
    /^[^\x20-\x7E]*[^\x20-\x7E]$/, // Ends with non-printable
    /^[^\x20-\x7E]*[^\x20-\x7E]\u0001$/, // Non-printable ending with control character
  ];

  // Check if name is too short (likely corrupted)
  if (name.length <= 2) {
    return true;
  }

  // Check if name contains mostly control characters
  const controlCharCount = (name.match(/[\x00-\x1F\x7F]/g) || []).length;
  if (controlCharCount > name.length * 0.5) {
    return true;
  }

  return corruptedPatterns.some((pattern) => pattern.test(name));
}

/**
 * Determines if a weapon has unusual stats compared to similar weapons
 * This is a reusable utility for outlier detection
 */
function isStatOutlier(
  weapon: EnchantedWeapon,
  allWeapons: EnchantedWeapon[]
): boolean {
  // Get weapons of the same type
  const sameTypeWeapons = allWeapons.filter(
    (w) => w.weaponType === weapon.weaponType
  );
  if (sameTypeWeapons.length < 3) return false; // Need at least 3 for statistical analysis

  // Calculate mean and standard deviation for each stat
  const damages = sameTypeWeapons.map((w) => w.baseDamage);
  const weights = sameTypeWeapons.map((w) => w.weight);
  const values = sameTypeWeapons.map((w) => w.value);

  const damageStats = calculateStats(damages);
  const weightStats = calculateStats(weights);
  const valueStats = calculateStats(values);

  // Check if weapon is an outlier (more than 2 standard deviations from mean)
  const isDamageOutlier =
    Math.abs(weapon.baseDamage - damageStats.mean) > 2 * damageStats.stdDev;
  const isWeightOutlier =
    Math.abs(weapon.weight - weightStats.mean) > 2 * weightStats.stdDev;
  const isValueOutlier =
    Math.abs(weapon.value - valueStats.mean) > 2 * valueStats.stdDev;

  return isDamageOutlier || isWeightOutlier || isValueOutlier;
}

/**
 * Calculates mean and standard deviation for a set of numbers
 * This is a reusable utility for statistical calculations
 */
function calculateStats(numbers: number[]): { mean: number; stdDev: number } {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const variance =
    numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) /
    numbers.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

/**
 * Determines if an enchantment is unique among all weapons
 * This is a reusable utility for enchantment analysis
 */
function isUniqueEnchantment(
  enchantmentName: string,
  allWeapons: EnchantedWeapon[]
): boolean {
  const enchantmentCount = allWeapons.filter(
    (w) => w.enchantment.name === enchantmentName
  ).length;
  return enchantmentCount <= 1; // Consider enchantment unique if used on only 1 weapon
}

/**
 * Checks if a weapon is likely a quest reward based on its name
 * This is a reusable utility for quest reward detection
 */
function isQuestRewardWeapon(name: string): boolean {
  const questRewardKeywords = [
    "dawnbreaker",
    "chillrend",
    "windshear",
    "mehrunes",
    "razor",
    "volendrung",
    "mace",
    "molag",
    "bal",
    "wabbajack",
    "sanguine",
    "rose",
    "spellbreaker",
    "peryite",
    "shield",
    "auriel",
    "bow",
    "hircine",
    "ring",
    "namira",
    "ring",
    "vaermina",
    "skull",
    "malacath",
    "mace",
    "boethiah",
    "ebony",
    "mail",
    "clavicus",
    "vile",
    "masque",
    "azura",
    "star",
    "black",
    "star",
    "meridia",
    "beacon",
    "nocturnal",
    "skeleton",
    "key",
    "sheogorath",
    "wabbajack",
  ];

  const normalizedName = name.toLowerCase();
  return questRewardKeywords.some((keyword) =>
    normalizedName.includes(keyword)
  );
}

/**
 * Checks if a weapon has special properties that make it unique
 * This is a reusable utility for special property detection
 */
function hasSpecialProperties(weapon: EnchantedWeapon): boolean {
  // Check for special enchantment effects
  const specialEffects = weapon.enchantment.effects.some(
    (effect) =>
      effect.description.toLowerCase().includes("unique") ||
      effect.description.toLowerCase().includes("special") ||
      effect.description.toLowerCase().includes("legendary")
  );

  // Check for unusual enchantment costs
  const unusualCost =
    weapon.enchantment.cost > 1000 || weapon.enchantment.cost < 10;

  // Check for unusual charge amounts
  const unusualCharge =
    weapon.enchantment.chargeAmount > 10000 ||
    weapon.enchantment.chargeAmount < 100;

  return specialEffects || unusualCost || unusualCharge;
}

/**
 * Checks if a weapon has a custom/unique name
 * This is a reusable utility for name uniqueness detection
 */
function isCustomNamedWeapon(name: string): boolean {
  // Check if name doesn't follow standard patterns
  const hasMaterialPrefix = WEAPON_MATERIALS.some((material) =>
    name.toLowerCase().startsWith(material.toLowerCase())
  );

  const hasStandardPattern =
    /(sword|dagger|axe|mace|bow|staff|crossbow)\s+of\s+/i.test(name);

  // Custom names typically don't follow standard patterns
  return !hasMaterialPrefix && !hasStandardPattern;
}

/**
 * Separates weapons into unique and pattern-based categories
 * This is the main function that could be reused in other projects
 */
export function separateUniqueAndPatternWeapons(weapons: EnchantedWeapon[]): {
  uniqueWeapons: UniqueWeapon[];
  patternWeapons: EnchantedWeapon[];
} {
  const uniqueWeapons: UniqueWeapon[] = [];
  const patternWeapons: EnchantedWeapon[] = [];

  for (const weapon of weapons) {
    const classification = classifyWeaponUniqueness(weapon, weapons);

    if (classification.isUnique) {
      uniqueWeapons.push({
        ...weapon,
        uniquenessFactors: classification.uniquenessFactors,
      });
    } else {
      patternWeapons.push(weapon);
    }
  }

  return { uniqueWeapons, patternWeapons };
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
 * Identifies weapons that are statistical outliers
 * This is a reusable utility for outlier detection
 */
export function findOutlierWeapons(
  weapons: EnchantedWeapon[],
  threshold: number = 2
): EnchantedWeapon[] {
  const outliers: EnchantedWeapon[] = [];

  for (const weapon of weapons) {
    if (isStatOutlier(weapon, weapons)) {
      outliers.push(weapon);
    }
  }

  return outliers;
}

/**
 * Groups weapons by their uniqueness factors
 * This is a reusable utility for grouping by characteristics
 */
export function groupWeaponsByUniquenessFactors(
  uniqueWeapons: UniqueWeapon[]
): Map<string, UniqueWeapon[]> {
  const groups = new Map<string, UniqueWeapon[]>();

  for (const weapon of uniqueWeapons) {
    for (const factor of weapon.uniquenessFactors) {
      if (!groups.has(factor)) {
        groups.set(factor, []);
      }
      groups.get(factor)!.push(weapon);
    }
  }

  return groups;
}
