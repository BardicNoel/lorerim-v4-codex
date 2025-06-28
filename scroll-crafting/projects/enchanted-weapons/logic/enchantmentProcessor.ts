import { EnchRecord } from "../../../types/enchSchema.js";
import { MgefRecordFromSchema } from "../../../types/mgefSchema.js";
import {
  hydrateMgefDescription,
  getBestDisplayName,
} from "../../../utils/weaponKeywordResolver.js";
import { formIdResolver } from "../../../utils/formIdResolver.js";
import { EnchantedWeaponEffect, EnchantedWeaponEnchantment } from "./types.js";
import { errorLogger } from "../utils/errorLogger.js";

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
  // Get effects from the nested effects array
  const effects: EnchantedWeaponEffect[] = [];

  for (const effect of enchantment.data.effects) {
    const effectFormId = effect.EFID;
    const effectData = effect.EFIT;

    if (!effectFormId || !effectData) continue;

    // Resolve FormID if needed
    let resolvedFormId = effectFormId;
    if (formIdResolver.isReady()) {
      const resolved = formIdResolver.resolveFormId(
        effectFormId,
        enchantment.meta.plugin
      );
      if (resolved) resolvedFormId = resolved;
    }

    const mgefRecord = mgefMap.get(resolvedFormId.toLowerCase());
    if (!mgefRecord) {
      errorLogger.logMissingMagicEffect(
        enchantment.data.EDID,
        resolvedFormId,
        enchantment.meta.plugin
      );
      continue;
    }

    const hydratedDescription = hydrateMgefDescription(
      mgefRecord.data.DNAM,
      effectData.magnitude,
      effectData.duration,
      effectData.area
    );

    effects.push({
      formId: resolvedFormId,
      name: mgefRecord.data.FULL || mgefRecord.data.EDID,
      description: hydratedDescription,
      magnitude: effectData.magnitude,
      duration: effectData.duration,
      area: effectData.area,
      school: (mgefRecord.data as any).MDOB || "Unknown",
    });
  }

  if (effects.length === 0) return null;

  return {
    name: getBestDisplayName(enchantment.data),
    cost: enchantment.data.ENIT.enchantmentCost,
    chargeAmount: enchantment.data.ENIT.enchAmount,
    effects,
  };
}
