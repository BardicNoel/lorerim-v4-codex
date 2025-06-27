import { EnrichedSpel, EnrichedSpelEffect } from "../types/records.js";
import { SpelRecordFromSchema } from "../types/spelSchema.js";
import { MgefRecordFromSchema } from "../types/mgefSchema.js";

export function resolveEnrichedSpel(
  spel: SpelRecordFromSchema,
  getMgef: (formId: string) => MgefRecordFromSchema
): EnrichedSpel {
  return {
    formId: spel.meta.globalFormId,
    edid: spel.data.EDID ?? "",
    name: spel.data.FULL ?? "",
    description: spel.data.DESC ?? "",
    effects: spel.data.effects.map((e): EnrichedSpelEffect => {
      const mgef = getMgef(e.EFID);
      return {
        effectFormId: e.EFID,
        magnitude: e.EFIT?.magnitude ?? 0,
        duration: e.EFIT?.duration ?? 0,
        area: e.EFIT?.area ?? 0,
        mgefFormId: mgef.meta.globalFormId,
        mgef: mgef.data,
      };
    }),
  };
}
