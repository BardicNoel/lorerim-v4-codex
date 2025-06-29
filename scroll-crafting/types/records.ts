import { ParsedRecord } from "@lorerim/platform-types";

export type RecordOfType<T extends string> = ParsedRecord & {
  meta: Omit<ParsedRecord["meta"], "type"> & {
    type: T;
  };
};

export type SpelRecord = RecordOfType<"SPEL">;
export type MgefRecord = RecordOfType<"MGEF">;
export type FlstRecord = RecordOfType<"FLST">;

export interface EnrichedSpelEffect {
  effectFormId: string; // EFID
  magnitude: number;
  duration: number;
  area: number;
  mgefFormId: string; // MGEF FormID
  mgef: ParsedRecord["decodedData"];
}

export interface EnrichedSpel {
  formId: string; // Original SPEL FormID
  edid: string;
  name: string; // FULL
  description: string; // DESC
  effects: EnrichedSpelEffect[];
}
