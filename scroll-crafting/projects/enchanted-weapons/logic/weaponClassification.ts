import { EnchantedWeapon } from "./types.js";
import { WeapRecord, WeapCategories } from "../../../types/weapSchema.js";
import { errorLogger } from "../utils/errorLogger.js";

export interface UniqueWeapon extends EnchantedWeapon {
  uniquenessFactors: string[];
}

export interface GeneralWeaponTemplate {
  cnamFormId: string;
  templateName: string;
  weaponType: string;
  baseDamage: number;
  weight: number;
  value: number;
  material?: string;
  examples: EnchantedWeapon[];
  count: number;
}

export interface GeneralWeaponEnchantment {
  name: string;
  description: string;
  cost: number;
  chargeAmount: number;
  effects: {
    name: string;
    description: string;
    magnitude: number;
    duration: number;
    area: number;
  }[];
  examples: string[]; // Weapon names that use this enchantment
  count: number;
}

/**
 * Classifies weapons based on CNAM (template) parameter
 * Weapons with CNAM are general weapons based on templates
 * Weapons without CNAM but with EFID are unique weapons
 * Weapons without CNAM and without EFID are base weapon templates
 */
export function separateUniqueAndGeneralWeapons(
  weapons: EnchantedWeapon[],
  weaponRecords: WeapRecord[],
  baseTemplateWeapons: WeapRecord[] = []
): {
  uniqueWeapons: UniqueWeapon[];
  generalWeaponTemplates: GeneralWeaponTemplate[];
  generalWeaponEnchantments: GeneralWeaponEnchantment[];
  baseWeaponTemplates: GeneralWeaponTemplate[];
} {
  console.log("🔍 Classifying weapons based on CNAM templates...");

  // Create a map of weapon records for CNAM lookup
  const weaponRecordMap = new Map<string, WeapRecord>();
  for (const record of weaponRecords) {
    weaponRecordMap.set(record.meta.globalFormId, record);
  }

  // Also add base template weapons to the map
  for (const record of baseTemplateWeapons) {
    weaponRecordMap.set(record.meta.globalFormId, record);
  }

  const uniqueWeapons: UniqueWeapon[] = [];
  const generalWeapons: EnchantedWeapon[] = [];
  const baseWeaponTemplates: GeneralWeaponTemplate[] = [];
  const cnamGroups = new Map<string, EnchantedWeapon[]>();
  const enchantmentGroups = new Map<string, EnchantedWeapon[]>();

  // Separate weapons based on CNAM and EFID
  for (const weapon of weapons) {
    const weaponRecord = weaponRecordMap.get(weapon.globalFormId);

    if (!weaponRecord) {
      errorLogger.logDataQuality(
        "Weapon record not found for classification",
        weapon.name,
        weapon.globalFormId,
        weapon.plugin
      );
      continue;
    }

    // Check if weapon has CNAM (template)
    const cnamFormId = weaponRecord.data.CNAM;
    const hasEnchantment =
      weaponRecord.data.EITM && weaponRecord.data.EITM.trim() !== "";

    if (cnamFormId && cnamFormId.trim() !== "") {
      // This is a general weapon based on a template
      generalWeapons.push(weapon);

      // Group by CNAM template
      if (!cnamGroups.has(cnamFormId)) {
        cnamGroups.set(cnamFormId, []);
      }
      cnamGroups.get(cnamFormId)!.push(weapon);

      // Group by enchantment for enchantment analysis
      const enchantmentKey = weapon.enchantment.name;
      if (!enchantmentGroups.has(enchantmentKey)) {
        enchantmentGroups.set(enchantmentKey, []);
      }
      enchantmentGroups.get(enchantmentKey)!.push(weapon);
    } else if (hasEnchantment) {
      // This is a unique weapon (no template but has enchantment)
      const uniquenessFactors = determineUniquenessFactors(
        weapon,
        weaponRecord
      );
      uniqueWeapons.push({
        ...weapon,
        uniquenessFactors,
      });
    } else {
      // This is a base weapon template (no template and no enchantment)
      const baseTemplate = createBaseWeaponTemplate(weapon, weaponRecord);
      if (baseTemplate) {
        baseWeaponTemplates.push(baseTemplate);
      }
    }
  }

  console.log(
    `📊 Found ${uniqueWeapons.length} unique weapons, ${generalWeapons.length} general weapons, and ${baseWeaponTemplates.length} base weapon templates`
  );

  // Create general weapon templates
  const generalWeaponTemplates: GeneralWeaponTemplate[] = [];
  for (const [cnamFormId, examples] of cnamGroups) {
    const template = createGeneralWeaponTemplate(
      cnamFormId,
      examples,
      weaponRecordMap
    );
    if (template) {
      generalWeaponTemplates.push(template);
    }
  }

  // Create base weapon templates from actual base template weapons
  for (const baseTemplate of baseTemplateWeapons) {
    const baseTemplateObj = createBaseWeaponTemplateFromRecord(
      baseTemplate,
      weaponRecordMap
    );
    if (baseTemplateObj) {
      baseWeaponTemplates.push(baseTemplateObj);
    }
  }

  // Create general weapon enchantments
  const generalWeaponEnchantments: GeneralWeaponEnchantment[] = [];
  for (const [enchantmentName, examples] of enchantmentGroups) {
    const enchantment = createGeneralWeaponEnchantment(
      enchantmentName,
      examples
    );
    if (enchantment) {
      generalWeaponEnchantments.push(enchantment);
    }
  }

  return {
    uniqueWeapons,
    generalWeaponTemplates,
    generalWeaponEnchantments,
    baseWeaponTemplates,
  };
}

/**
 * Creates a general weapon template from CNAM group
 */
function createGeneralWeaponTemplate(
  cnamFormId: string,
  examples: EnchantedWeapon[],
  weaponRecordMap: Map<string, WeapRecord>
): GeneralWeaponTemplate | null {
  if (examples.length === 0) return null;

  // Get the template weapon record
  const templateRecord = weaponRecordMap.get(cnamFormId);
  if (!templateRecord) {
    errorLogger.logDataQuality(
      "Template weapon record not found",
      undefined,
      cnamFormId,
      undefined
    );
    return null;
  }

  // Calculate stat ranges
  const damages = examples.map((w) => w.baseDamage);
  const weights = examples.map((w) => w.weight);
  const values = examples.map((w) => w.value);

  return {
    cnamFormId,
    templateName: templateRecord.data.FULL || templateRecord.data.EDID,
    weaponType: examples[0].weaponType, // All examples should have same type
    baseDamage: Math.min(...damages),
    weight: Math.min(...weights),
    value: Math.min(...values),
    material: examples[0].material || undefined,
    examples,
    count: examples.length,
  };
}

/**
 * Creates a general weapon enchantment from enchantment group
 */
function createGeneralWeaponEnchantment(
  enchantmentName: string,
  examples: EnchantedWeapon[]
): GeneralWeaponEnchantment | null {
  if (examples.length === 0) return null;

  const firstExample = examples[0];
  const enchantment = firstExample.enchantment;

  return {
    name: enchantmentName,
    description: enchantment.effects.map((e) => e.description).join("; "),
    cost: enchantment.cost,
    chargeAmount: enchantment.chargeAmount,
    effects: enchantment.effects.map((effect) => ({
      name: effect.name,
      description: effect.description,
      magnitude: effect.magnitude,
      duration: effect.duration,
      area: effect.area,
    })),
    examples: examples.map((w) => w.name),
    count: examples.length,
  };
}

/**
 * Determines uniqueness factors for a weapon
 */
function determineUniquenessFactors(
  weapon: EnchantedWeapon,
  weaponRecord: WeapRecord
): string[] {
  const factors: string[] = [];

  // No CNAM template
  factors.push("No template (unique base weapon)");

  // Check for named weapon (doesn't start with material)
  const materialPrefixes = [
    "Iron",
    "Steel",
    "Orcish",
    "Dwarven",
    "Elven",
    "Glass",
    "Ebony",
    "Daedric",
    "Dragonbone",
    "Stalhrim",
    "Nordic",
    "Ancient Nord",
    "Falmer",
    "Chitin",
    "Bonemold",
    "Morag Tong",
    "Blades",
    "Imperial",
    "Stormcloak",
    "Thalmor",
  ];

  const hasMaterialPrefix = materialPrefixes.some((material) =>
    weapon.name.toLowerCase().startsWith(material.toLowerCase())
  );

  if (!hasMaterialPrefix) {
    factors.push("Named weapon");
  }

  // Check for unusual stats
  if (weapon.baseDamage > 20) {
    factors.push("High base damage");
  }

  if (weapon.value > 1000) {
    factors.push("High value");
  }

  // Check for multiple effects
  if (weapon.enchantment.effects.length > 1) {
    factors.push("Multiple enchantment effects");
  }

  // Check for unique enchantment
  if (
    weapon.enchantment.name.toLowerCase().includes("unique") ||
    weapon.enchantment.name.toLowerCase().includes("special")
  ) {
    factors.push("Unique enchantment");
  }

  // Check for quest-related keywords
  if (weapon.keywords.some((k) => k.toLowerCase().includes("quest"))) {
    factors.push("Quest-related");
  }

  return factors;
}

/**
 * Creates a base weapon template from a weapon with no CNAM and no enchantment
 */
function createBaseWeaponTemplate(
  weapon: EnchantedWeapon,
  weaponRecord: WeapRecord
): GeneralWeaponTemplate | null {
  return {
    cnamFormId: weaponRecord.meta.globalFormId, // Use the weapon's own FormID as template
    templateName: weaponRecord.data.FULL || weaponRecord.data.EDID,
    weaponType: weapon.weaponType,
    baseDamage: weapon.baseDamage,
    weight: weapon.weight,
    value: weapon.value,
    material: weapon.material || undefined,
    examples: [weapon], // Only this weapon uses this template
    count: 1,
  };
}

/**
 * Creates a base weapon template from a weapon record (for base template weapons)
 */
function createBaseWeaponTemplateFromRecord(
  weaponRecord: WeapRecord,
  weaponRecordMap: Map<string, WeapRecord>
): GeneralWeaponTemplate | null {
  // Get weapon type from animation type using proper categorization
  const animationType = weaponRecord.data.DNAM.animationType;
  let weaponType = "Unknown";

  if (typeof animationType === "string") {
    weaponType = WeapCategories[animationType] || animationType;
  } else if (Array.isArray(animationType)) {
    const firstType = animationType[0];
    weaponType = WeapCategories[firstType] || firstType || "Unknown";
  } else if (typeof animationType === "number") {
    weaponType = WeapCategories[animationType.toString()] || "Unknown";
  }

  // Get material from keywords if available
  let material: string | undefined;
  if (weaponRecord.data.KWDA && weaponRecord.data.KWDA.length > 0) {
    // This is a simplified material detection - in a real implementation,
    // you'd want to use the weaponKeywordResolver utility
    const keywords = weaponRecord.data.KWDA;
    const materialKeywords = [
      "WeapMaterialIron",
      "WeapMaterialSteel",
      "WeapMaterialOrcish",
      "WeapMaterialDwarven",
      "WeapMaterialElven",
      "WeapMaterialGlass",
      "WeapMaterialEbony",
      "WeapMaterialDaedric",
    ];
    for (const keyword of keywords) {
      if (materialKeywords.includes(keyword)) {
        material = keyword.replace("WeapMaterial", "");
        break;
      }
    }
  }

  return {
    cnamFormId: weaponRecord.meta.globalFormId,
    templateName: weaponRecord.data.FULL || weaponRecord.data.EDID,
    weaponType,
    baseDamage: weaponRecord.data.DATA.damage,
    weight: weaponRecord.data.DATA.weight,
    value: weaponRecord.data.DATA.value,
    material,
    examples: [], // Base templates don't have examples since they're not enchanted
    count: 0,
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use separateUniqueAndGeneralWeapons instead
 */
export function separateUniqueAndPatternWeapons(weapons: EnchantedWeapon[]): {
  uniqueWeapons: UniqueWeapon[];
  patternWeapons: EnchantedWeapon[];
} {
  console.warn(
    "⚠️  Using deprecated pattern-based classification. Use CNAM-based classification instead."
  );

  // For backward compatibility, treat all weapons as unique for now
  const uniqueWeapons: UniqueWeapon[] = weapons.map((weapon) => ({
    ...weapon,
    uniquenessFactors: ["Legacy classification - no CNAM data available"],
  }));

  return {
    uniqueWeapons,
    patternWeapons: [],
  };
}
