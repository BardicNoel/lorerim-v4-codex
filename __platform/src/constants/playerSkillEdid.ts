/**
 * Default Skyrim skill ActorValue EDIDs
 * These are the 18 core skills that can be leveled up by the player
 */
export enum PlayerSkillEdid {
  // Combat Skills
  OneHanded = "AVOneHanded",
  TwoHanded = "AVTwoHanded",
  Marksman = "AVMarksman",
  Block = "AVBlock",
  HeavyArmor = "AVHeavyArmor",
  LightArmor = "AVLightArmor",

  // Stealth Skills
  Pickpocket = "AVPickpocket",
  Lockpicking = "AVLockpicking",
  Sneak = "AVSneak",

  // Crafting Skills
  Smithing = "AVSmithing",
  Alchemy = "AVAlchemy",
  Enchanting = "AVEnchanting",

  // Magic Skills
  Alteration = "AVAlteration",
  Conjuration = "AVConjuration",
  Destruction = "AVDestruction",
  Illusion = "AVMysticism", // Uses Mysticism EDID but is Illusion skill
  Restoration = "AVRestoration",

  // Social Skills
  Speechcraft = "AVSpeechcraft",
}
