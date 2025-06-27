import { describe, it, expect } from "vitest";
import { resolveSubclasses } from "../logic/resolveSubclasses.js";
import { ParsedRecord } from "@lorerim/platform-types";

describe("resolveSubclasses", () => {
  it("returns an array (stub)", () => {
    const flstRecord: ParsedRecord = {
      meta: {
        type: "FLST",
        formId: "0xFE260E91",
        globalFormId: "0xFE260E91",
        plugin: "SubclassesOfSkyrim.esp",
      },
      record: [],
      decodedData: {
        EDID: "DAR_DestinyFormList",
        LNAM: ["0xFE260808", "0xFE26080A"],
      },
      header: "",
    };
    const perks: ParsedRecord[] = [];
    const findByFormId = () => null;
    const result = resolveSubclasses(flstRecord, perks, findByFormId);
    expect(Array.isArray(result)).toBe(true);
  });
});
