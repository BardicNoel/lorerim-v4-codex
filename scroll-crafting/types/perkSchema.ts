import { z } from "zod";
import { PrimaryRecordSchema } from "./recordSchema.js";

// Shape for the DATA subfield inside PERK data
const PerkDataFieldSchema = z.object({
  isTrait: z.number(),
  level: z.number(),
  numRanks: z.number(),
  isPlayable: z.number(),
  isHidden: z.number(),
});

// Shape for PRKE section
const PrkeSectionSchema = z.object({
  sectionType: z.string(),
  rank: z.number(),
  priority: z.number(),
});

// Shape for CTDA condition
const CtdaConditionSchema = z.object({
  operator: z.object({
    compareOperator: z.string(),
    flags: z.array(z.string()),
    rawOperator: z.number(),
    rawCompareOperator: z.number(),
    rawFlags: z.number(),
  }),
  unknown: z.number(),
  unknown2: z.number(),
  unknown3: z.number(),
  comparisonValue: z.number(),
  function: z.object({
    functionName: z.string(),
    functionIndex: z.number(),
    description: z.string(),
  }),
  padding: z.number(),
  padding2: z.number(),
  param1: z.union([z.number(), z.string()]), // Can be number or string FormID
  param2: z.union([z.number(), z.string()]), // Can be number or string FormID
  runOnType: z.string(),
  reference: z.string(),
  unknown4: z.number(),
});

// Shape for section data
const SectionDataSchema = z.object({
  spellId: z.string().optional(),
  effectType: z.string().optional(),
  functionType: z.string().optional(),
  conditionCount: z.number().optional(),
});

// Shape for a perk section
const PerkSectionSchema = z.object({
  PRKE: PrkeSectionSchema,
  DATA: SectionDataSchema,
  PRKC: z.string().optional(),
  CTDA: z.array(CtdaConditionSchema).optional(),
  EPFT: z.string().optional(),
  EPFD: z.string().optional(),
  PRKF: z.string(),
});

// Shape for the main data field of PERK
export const PerkDataSchema = z.object({
  EDID: z.string(),
  FULL: z.string(),
  DESC: z.string().optional(),
  DATA: PerkDataFieldSchema,
  sections: z.array(PerkSectionSchema),
  CTDA: z.array(CtdaConditionSchema).optional(), // Top-level CTDA conditions for prerequisites
});

// PERK record schema extending PrimaryRecordSchema
export const PerkRecordSchema = PrimaryRecordSchema.extend({
  data: PerkDataSchema,
});

export type PerkRecordFromSchema = z.infer<typeof PerkRecordSchema>;
