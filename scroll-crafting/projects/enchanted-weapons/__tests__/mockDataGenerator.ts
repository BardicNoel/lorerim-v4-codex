import { WeapRecord } from "../../../types/weapSchema.js";
import { EnchRecord } from "../../../types/enchSchema.js";
import { MgefRecordFromSchema } from "../../../types/mgefSchema.js";
import { KywdRecord } from "../../../types/kywdSchema.js";

export interface MockDataOptions {
  weaponCount?: number;
  enchantmentCount?: number;
  magicEffectCount?: number;
  keywordCount?: number;
  includeEnchantments?: boolean;
  weaponTypes?: string[];
  enchantmentTypes?: string[];
  materials?: string[];
}

export interface MockData {
  weapons: WeapRecord[];
  enchantments: EnchRecord[];
  magicEffects: MgefRecordFromSchema[];
  keywords: KywdRecord[];
}

/**
 * Generates a unique FormID for testing
 */
function generateFormId(prefix: string, index: number): string {
  return `0x${prefix}${index.toString().padStart(8, "0")}`;
}

/**
 * Generates mock weapon records
 */
function generateWeaponRecords(
  count: number,
  enchantmentFormIds: string[],
  keywordFormIds: string[],
  options: MockDataOptions
): WeapRecord[] {
  const weapons: WeapRecord[] = [];
  const weaponTypes = options.weaponTypes || [
    "Sword",
    "Dagger",
    "Bow",
    "Axe",
    "Mace",
  ];
  const materials = options.materials || [
    "Iron",
    "Steel",
    "Dwarven",
    "Elven",
    "Ebony",
  ];

  // Add a template weapon that will be referenced by CNAM
  const templateWeapon: WeapRecord = {
    meta: {
      type: "WEAP",
      formId: "0x000302CA",
      globalFormId: "0x000302CA",
      plugin: "TestPlugin.esp",
      stackOrder: 0,
      isWinner: true,
    },
    data: {
      EDID: "TemplateWeapon",
      FULL: "Template Weapon",
      MODL: "Weapons\\Sword\\TemplateSword.nif",
      EITM: undefined, // No enchantment for template
      EAMT: 0,
      ETYP: "0x00013F42",
      KSIZ: 0,
      KWDA: [],
      DESC: "A template weapon for testing",
      DATA: {
        value: 100,
        weight: 5.0,
        damage: 10,
      },
      DNAM: {
        animationType: 1,
        speed: 1.0,
        reach: 1.0,
        flags1: [],
        flags2: [],
      },
      CRDT: {
        criticalDamage: 0,
        criticalPercent: 1,
        flags: ["On Death"],
        criticalEffect: "0x00000001",
      },
      CNAM: "", // Template has no CNAM
    },
  };
  weapons.push(templateWeapon);

  for (let i = 0; i < count; i++) {
    const weaponType = weaponTypes[i % weaponTypes.length];
    const material = materials[i % materials.length];
    const hasEnchantment =
      options.includeEnchantments !== false && enchantmentFormIds.length > 0;
    const enchantmentFormId = hasEnchantment
      ? enchantmentFormIds[i % enchantmentFormIds.length]
      : undefined;

    // Calculate keyword indices to ensure we get both weapon type and material
    const weaponTypeIndex = i % weaponTypes.length;
    const materialIndex = i % materials.length;

    // Get the corresponding keyword FormIDs
    const weaponTypeKeywordFormId = keywordFormIds[weaponTypeIndex];
    const materialKeywordFormId =
      keywordFormIds[materials.length + materialIndex];

    // Add MagicDisallowEnchanting keyword to every third weapon
    const magicDisallowEnchantingFormId =
      i % 3 === 0 ? keywordFormIds[keywordFormIds.length - 1] : undefined;

    const kwda = [
      weaponTypeKeywordFormId,
      materialKeywordFormId,
      magicDisallowEnchantingFormId,
    ].filter((id): id is string => typeof id === "string");

    const weapon: WeapRecord = {
      meta: {
        type: "WEAP",
        formId: generateFormId("WEAP", i + 1),
        globalFormId: generateFormId("WEAP", i + 1),
        plugin: "TestPlugin.esp",
        stackOrder: 0,
        isWinner: true,
      },
      data: {
        EDID: `Test${weaponType}${i + 1}`,
        FULL: `${material} ${weaponType}`,
        MODL: `Weapons\\${weaponType}\\${material}${weaponType}.nif`,
        EITM: enchantmentFormId,
        EAMT: 100,
        ETYP: "0x00013F42",
        KSIZ: kwda.length,
        KWDA: kwda,
        DESC: `A test ${material.toLowerCase()} ${weaponType.toLowerCase()}`,
        DATA: {
          value: 50 + i * 10,
          weight: 3.0 + i * 0.5,
          damage: 8 + i * 2,
        },
        DNAM: {
          animationType: (i % 9) + 1, // 1-9 for different weapon types
          speed: 1.0,
          reach: 1.0,
          flags1: [],
          flags2: [],
        },
        CRDT: {
          criticalDamage: 0,
          criticalPercent: 1,
          flags: ["On Death"],
          criticalEffect: "0x00000001",
        },
        CNAM: "0x000302CA", // Reference to the template weapon
      },
    };
    weapons.push(weapon);
  }

  return weapons;
}

/**
 * Generates mock enchantment records
 */
function generateEnchantmentRecords(
  count: number,
  magicEffectFormIds: string[],
  options: MockDataOptions
): EnchRecord[] {
  const enchantments: EnchRecord[] = [];
  const enchantmentTypes = options.enchantmentTypes || [
    "Fire Damage",
    "Frost Damage",
    "Shock Damage",
    "Absorb Health",
  ];

  for (let i = 0; i < count; i++) {
    const enchantmentType = enchantmentTypes[i % enchantmentTypes.length];
    const magicEffectFormId =
      magicEffectFormIds.length > 0
        ? magicEffectFormIds[i % magicEffectFormIds.length]
        : generateFormId("MGEF", i + 1);

    const enchantment: EnchRecord = {
      meta: {
        type: "ENCH",
        formId: generateFormId("ENCH", i + 1),
        globalFormId: generateFormId("ENCH", i + 1),
        plugin: "TestPlugin.esp",
        stackOrder: 0,
        isWinner: true,
      },
      data: {
        EDID: `Test${enchantmentType}${i + 1}`,
        FULL: `${enchantmentType} Enchantment`,
        ENIT: {
          enchantmentCost: 50 + i * 10,
          flags: ["ManualCalc"],
          castType: "Fire and Forget",
          enchAmount: 100,
          delivery: "Touch",
          enchantType: "Enchantment",
          chargeTime: 0,
          baseEnchantment: "",
          wornRestrictions: "",
        },
        effects: [
          {
            EFID: magicEffectFormId,
            EFIT: {
              magnitude: 10 + i * 2,
              area: 0,
              duration: 0,
            },
          },
        ],
      },
    };
    enchantments.push(enchantment);
  }

  return enchantments;
}

/**
 * Generates mock magic effect records
 */
function generateMagicEffectRecords(
  count: number,
  options: MockDataOptions
): MgefRecordFromSchema[] {
  const magicEffects: MgefRecordFromSchema[] = [];
  const effectTypes = options.enchantmentTypes || [
    "Fire Damage",
    "Frost Damage",
    "Shock Damage",
    "Absorb Health",
  ];

  for (let i = 0; i < count; i++) {
    const effectType = effectTypes[i % effectTypes.length];

    const magicEffect: MgefRecordFromSchema = {
      meta: {
        type: "MGEF",
        formId: generateFormId("MGEF", i + 1),
        globalFormId: generateFormId("MGEF", i + 1),
        plugin: "TestPlugin.esp",
        stackOrder: 0,
        isWinner: true,
      },
      data: {
        EDID: `TestEffect${i + 1}`,
        FULL: effectType,
        DATA: {
          flags: [],
          baseCost: 25 + i * 5,
          relatedID: "",
          skill: 0,
          resistanceAV: null,
          skillLevel: 0,
          effectType: 0,
          primaryAV: null,
          secondAV: 0,
          perkID: "",
        },
        DNAM: `Deals {magnitude} points of ${effectType.toLowerCase()}`,
      },
    };
    magicEffects.push(magicEffect);
  }

  return magicEffects;
}

/**
 * Generates mock keyword records
 */
function generateKeywordRecords(
  count: number,
  options: MockDataOptions
): KywdRecord[] {
  const keywords: KywdRecord[] = [];
  const weaponTypes = options.weaponTypes || [
    "Sword",
    "Dagger",
    "Bow",
    "Axe",
    "Mace",
  ];
  const materials = options.materials || [
    "Iron",
    "Steel",
    "Dwarven",
    "Elven",
    "Ebony",
  ];

  // Generate weapon type keywords
  for (let i = 0; i < Math.min(count / 2, weaponTypes.length); i++) {
    const keyword: KywdRecord = {
      meta: {
        type: "KYWD",
        formId: generateFormId("KYWD", i + 1),
        globalFormId: generateFormId("KYWD", i + 1),
        plugin: "TestPlugin.esp",
        stackOrder: 0,
        isWinner: true,
      },
      data: {
        EDID: `WeapType${weaponTypes[i]}`,
      },
    };
    keywords.push(keyword);
  }

  // Generate material keywords
  for (let i = 0; i < Math.min(count / 2, materials.length); i++) {
    const keyword: KywdRecord = {
      meta: {
        type: "KYWD",
        formId: generateFormId("KYWD", i + 100),
        globalFormId: generateFormId("KYWD", i + 100),
        plugin: "TestPlugin.esp",
        stackOrder: 0,
        isWinner: true,
      },
      data: {
        EDID: `WeapMaterial${materials[i]}`,
      },
    };
    keywords.push(keyword);
  }

  // Add MagicDisallowEnchanting keyword
  const magicDisallowEnchanting: KywdRecord = {
    meta: {
      type: "KYWD",
      formId: generateFormId("KYWD", 999),
      globalFormId: generateFormId("KYWD", 999),
      plugin: "TestPlugin.esp",
      stackOrder: 0,
      isWinner: true,
    },
    data: {
      EDID: "MagicDisallowEnchanting",
    },
  };
  keywords.push(magicDisallowEnchanting);

  return keywords;
}

/**
 * Main function to generate mock data for testing
 */
export function generateMockData(options: MockDataOptions = {}): MockData {
  const {
    weaponCount = 5,
    enchantmentCount = 3,
    magicEffectCount = 3,
    keywordCount = 10,
  } = options;

  // Generate magic effects first (they're referenced by enchantments)
  const magicEffects = generateMagicEffectRecords(magicEffectCount, options);
  const magicEffectFormIds = magicEffects.map(
    (effect) => effect.meta.globalFormId
  );

  // Generate enchantments (they reference magic effects)
  const enchantments = generateEnchantmentRecords(
    enchantmentCount,
    magicEffectFormIds,
    options
  );
  const enchantmentFormIds = enchantments.map((ench) => ench.meta.globalFormId);

  // Generate keywords
  const keywords = generateKeywordRecords(keywordCount, options);
  const keywordFormIds = keywords.map((keyword) => keyword.meta.globalFormId);

  // Generate weapons (they reference enchantments and keywords)
  const weapons = generateWeaponRecords(
    weaponCount,
    enchantmentFormIds,
    keywordFormIds,
    options
  );

  return {
    weapons,
    enchantments,
    magicEffects,
    keywords,
  };
}

/**
 * Generates a simple test case with one weapon, one enchantment, one magic effect, and two keywords
 */
export function generateSimpleTestCase(): MockData {
  return generateMockData({
    weaponCount: 1,
    enchantmentCount: 1,
    magicEffectCount: 1,
    keywordCount: 2,
    weaponTypes: ["Sword"],
    enchantmentTypes: ["Fire Damage"],
    materials: ["Steel"],
  });
}

/**
 * Generates test data for weapon categorization testing
 */
export function generateCategorizationTestCase(): MockData {
  return generateMockData({
    weaponCount: 3,
    enchantmentCount: 2,
    magicEffectCount: 2,
    keywordCount: 6,
    weaponTypes: ["Sword", "Dagger", "Bow"],
    enchantmentTypes: ["Fire Damage", "Frost Damage"],
    materials: ["Iron", "Steel", "Dwarven"],
  });
}
