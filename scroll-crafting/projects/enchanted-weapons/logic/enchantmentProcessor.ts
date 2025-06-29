import { EnchRecord } from "../../../types/enchSchema.js";
import { MgefRecordFromSchema } from "../../../types/mgefSchema.js";
import {
  hydrateMgefDescription,
  getBestDisplayName,
} from "../../../utils/weaponKeywordResolver.js";
import { formIdResolver } from "../../../utils/formIdResolver.js";
import { EnchantedWeaponEffect, EnchantedWeaponEnchantment } from "./types.js";
import { errorLogger } from "../utils/error-logger-instance.js";

interface EnchantmentCost {
  cost: number;
  method: "manual" | "auto";
}

/**
 * Calculates the cost of an enchantment based on either manual cost or auto-calculation from effects
 * @param enchantment The enchantment record
 * @param magicEffectMap Map of magic effects by FormID for effect resolution
 * @returns The calculated cost and method used
 */
function calculateEnchantmentCost(
  enchantment: EnchRecord,
  magicEffectMap: Map<string, MgefRecordFromSchema>
): EnchantmentCost {
  // Check for manual calculation flag
  const isManualCost = enchantment.data.ENIT.flags?.includes("ManualCostCalc");

  if (isManualCost) {
    return {
      cost: enchantment.data.ENIT.enchantmentCost || 0,
      method: "manual",
    };
  }

  // Auto calculation mode
  let totalCost = 0;

  // Process each effect
  for (const effect of enchantment.data.effects) {
    const effectId = effect.EFID.toLowerCase();
    const effectData = effect.EFIT;
    const magicEffect = magicEffectMap.get(effectId);

    if (!magicEffect) {
      errorLogger.logDataQuality(
        "Magic effect not found for cost calculation",
        undefined,
        effect.EFID,
        enchantment.meta.plugin
      );
      continue;
    }

    // Get effect parameters
    const baseCost = magicEffect.data.DATA.baseCost || 0;
    const magnitude = effectData.magnitude || 1;
    const duration = effectData.duration || 1;
    const area = effectData.area || 0;

    // Calculate effect cost using the formula:
    // effectCost = baseCost × magnitude × (duration / 10) × sqrt(area + 1)
    const durationMultiplier = duration / 10;
    const areaMultiplier = Math.sqrt(area + 1);
    const effectCost =
      baseCost * magnitude * durationMultiplier * areaMultiplier;

    totalCost += effectCost;
  }

  return {
    cost: Math.round(totalCost), // Round to nearest integer
    method: "auto",
  };
}

/**
 * Processes enchantment effects and creates the enchantment object.
 * @param enchantment The ENCH record.
 * @param mgefMap Pre-built Map of magic effect records keyed by globalFormId.
 * @returns The processed enchantment object, or null if no valid effects.
 */
export async function processEnchantment(
  enchantment: EnchRecord,
  mgefMap: Map<string, MgefRecordFromSchema>
): Promise<EnchantedWeaponEnchantment | null> {
  try {
    // Process effects
    const effects = enchantment.data.effects.map((effect) => {
      const effectId = effect.EFID.toLowerCase();
      const magicEffect = mgefMap.get(effectId);

      if (!magicEffect) {
        errorLogger.logDataQuality(
          `Magic effect not found: ${effectId}`,
          enchantment.data.EDID,
          effect.EFID,
          enchantment.meta.plugin,
          {
            availableEffects: Array.from(mgefMap.keys()),
            enchantmentFormId: enchantment.meta.globalFormId,
            effectFormId: effect.EFID,
          }
        );
        return {
          formId: effect.EFID,
          name: "Unknown Effect",
          description: `Effect data not found (${effect.EFID})`,
          magnitude: 0,
          duration: 0,
          area: 0,
          school: "Unknown",
        };
      }

      const hydratedDescription = hydrateMgefDescription(
        magicEffect.data.DNAM,
        effect.EFIT.magnitude,
        effect.EFIT.duration,
        effect.EFIT.area
      );

      return {
        formId: effect.EFID,
        name: magicEffect.data.FULL || magicEffect.data.EDID,
        description: hydratedDescription,
        magnitude: effect.EFIT.magnitude || 0,
        duration: effect.EFIT.duration || 0,
        area: effect.EFIT.area || 0,
        school: String(magicEffect.data.DATA.skill || "Unknown"),
      };
    });

    // Calculate enchantment cost
    const costInfo = calculateEnchantmentCost(enchantment, mgefMap);

    return {
      name: enchantment.data.FULL || enchantment.data.EDID,
      cost: costInfo.cost,
      costMethod: costInfo.method,
      chargeAmount: enchantment.data.ENIT.enchAmount || 0,
      effects,
    };
  } catch (error) {
    errorLogger.logError(
      `Error processing enchantment ${enchantment.data.EDID}`,
      {
        enchantmentName: enchantment.data.EDID,
        formId: enchantment.meta.globalFormId,
        plugin: enchantment.meta.plugin,
        error: error instanceof Error ? error.message : String(error),
      }
    );

    return {
      name:
        enchantment.data.FULL || enchantment.data.EDID || "Unknown Enchantment",
      cost: 0,
      costMethod: "auto",
      chargeAmount: 0,
      effects: [],
    };
  }
}
