import {
  EnrichedEnch,
  EnrichedEnchEffect,
  MgefRecord,
} from "../../types/records.js";
import { EnchRecord } from "../../types/enchSchema.js";

export function resolveEnrichedEnch(
  ench: EnchRecord,
  getMgef: (formId: string) => MgefRecord
): EnrichedEnch {
  // Get effects from the nested effects array
  return {
    formId: ench.meta.globalFormId,
    edid: ench.data.EDID ?? "",
    name: ench.data.FULL ?? "",
    description: undefined, // ENCH doesn't always have a description field
    effects: ench.data.effects.map((effect): EnrichedEnchEffect => {
      const mgef = getMgef(effect.EFID);
      return {
        effectFormId: effect.EFID,
        magnitude: effect.EFIT.magnitude ?? 0,
        duration: effect.EFIT.duration ?? 0,
        area: effect.EFIT.area ?? 0,
        mgefFormId: mgef.meta.globalFormId,
        mgef: mgef,
      };
    }),
  };
}
