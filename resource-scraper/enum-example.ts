type ActorValueType =
  | "AI"
  | "Skill"
  | "Attribute"
  | "Status"
  | "Perk"
  | "Exp"
  | "Mult"
  | "Resist"
  | "Stat"
  | "Buffer"
  | "Toggle"
  | "Obsolete"
  | "User-defined";

export const actorValueNames: Record<
  number,
  {
    name: string;
    type: ActorValueType;
    effect: string;
  }
> = {
  0: {
    name: "Aggression",
    type: "AI",
    effect:
      "Enum: Unaggressive (does not initiate combat), Aggressive (attacks Enemies), Very Aggressive (attacks Enemies and Neutrals), Frenzied (attacks anyone). (0-3)",
  },
  1: {
    name: "Confidence",
    type: "AI",
    effect:
      "Willingness to fight, based on their strength vs the attacker's strength. Enum: Cowardly (always flee), Cautious, Average, Brave, Foolhardy (never flee). (0-4)",
  },
};
