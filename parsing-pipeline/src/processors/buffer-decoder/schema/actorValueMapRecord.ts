export const actorValueMap: Record<
  number,
  {
    name: string;
    type:
      | 'AI'
      | 'Skill'
      | 'Attribute'
      | 'Status'
      | 'Perk'
      | 'Exp'
      | 'Mult'
      | 'Resist'
      | 'Stat'
      | 'Buffer'
      | 'Toggle'
      | 'Obsolete'
      | 'User-defined'
      | 'Mod';
    effect: string;
    formId: string;
  }
> = {
  0: {
    name: 'Aggression',
    type: 'AI',
    effect:
      'Enum: Unaggressive (does not initiate combat), Aggressive (attacks Enemies), Very Aggressive (attacks Enemies and Neutrals), Frenzied (attacks anyone). (0-3)',
    formId: '0x000004B0',
  },
  1: {
    name: 'Confidence',
    type: 'AI',
    effect:
      "Willingness to fight, based on their strength vs the attacker's strength. Enum: Cowardly (always flee), Cautious, Average, Brave, Foolhardy (never flee). (0-4)",
    formId: '0x000004B1',
  },
  2: {
    name: 'Energy',
    type: 'AI',
    effect:
      'Used by sandbox AI to determine how often to perform a different sandbox behavior. (%)',
    formId: '0x000004B2',
  },
  3: {
    name: 'Morality',
    type: 'AI',
    effect:
      'Will this Follower comply when the player asks him/her to perform a crime? Enum: Any Crime, Violence Against Enemies, Property Crime Only, No Crime. (0-3)',
    formId: '0x000004B3',
  },
  4: {
    name: 'Mood',
    type: 'AI',
    effect:
      'Default facial expression. May have no effect in certain cases. Enum: Neutral, Angry, Fear, Happy, Sad, Surprised, Puzzled, Disgusted. (0-7)',
    formId: '0x000004B4',
  },
  5: {
    name: 'Assistance',
    type: 'AI',
    effect:
      'Will this actor feel compelled to help others in combat? Enum: Helps Nobody, Helps Allies, Helps Friends and Allies. (0-2)',
    formId: '0x000004B5',
  },
  6: {
    name: 'OneHanded',
    type: 'Skill',
    effect: '',
    formId: '0x0000044C',
  },
  7: {
    name: 'TwoHanded',
    type: 'Skill',
    effect: '',
    formId: '0x0000044D',
  },
  8: {
    name: 'Marksman',
    type: 'Skill',
    effect: '',
    formId: '0x0000044E',
  },
  9: {
    name: 'Block',
    type: 'Skill',
    effect: '',
    formId: '0x0000044F',
  },
  10: {
    name: 'Smithing',
    type: 'Skill',
    effect: '',
    formId: '0x00000450',
  },
  11: {
    name: 'HeavyArmor',
    type: 'Skill',
    effect: '',
    formId: '0x00000451',
  },
  12: {
    name: 'LightArmor',
    type: 'Skill',
    effect: '',
    formId: '0x00000452',
  },
  13: {
    name: 'Pickpocket',
    type: 'Skill',
    effect: '',
    formId: '0x00000453',
  },
  14: {
    name: 'Lockpicking',
    type: 'Skill',
    effect: '',
    formId: '0x00000454',
  },
  15: {
    name: 'Sneak',
    type: 'Skill',
    effect: '',
    formId: '0x00000455',
  },
  16: {
    name: 'Alchemy',
    type: 'Skill',
    effect: '',
    formId: '0x00000456',
  },
  17: {
    name: 'Speechcraft',
    type: 'Skill',
    effect: '',
    formId: '0x00000457',
  },
  18: {
    name: 'Alteration',
    type: 'Skill',
    effect: '',
    formId: '0x00000458',
  },
  19: {
    name: 'Conjuration',
    type: 'Skill',
    effect: '',
    formId: '0x00000459',
  },
  20: {
    name: 'Destruction',
    type: 'Skill',
    effect: '',
    formId: '0x0000045A',
  },
  21: {
    name: 'Illusion',
    type: 'Skill',
    effect: '',
    formId: '0x0000045B',
  },
  22: {
    name: 'Restoration',
    type: 'Skill',
    effect: '',
    formId: '0x0000045C',
  },
  23: {
    name: 'Enchanting',
    type: 'Skill',
    effect: '',
    formId: '0x0000045D',
  },
  24: {
    name: 'Health',
    type: 'Attribute',
    effect: 'Actual Current and Maximum Health, 0 results in death',
    formId: '0x000003E8',
  },
  25: {
    name: 'Magicka',
    type: 'Attribute',
    effect: 'Actual Current and Maximum Magicka, can not be lower than 0',
    formId: '0x000003E9',
  },
  26: {
    name: 'Stamina',
    type: 'Attribute',
    effect: 'Actual Current and Maximum Stamina, can not be lower than 0',
    formId: '0x000003EA',
  },
  27: {
    name: 'HealRate',
    type: 'Mult',
    effect: 'Percentage of max health to regenerate per second (default 0.7 for each player race).',
    formId: '0x000003EB',
  },
  28: {
    name: 'MagickaRate',
    type: 'Mult',
    effect:
      'Percentage of max magicka to regenerate per second (default 3.0 for each player race).',
    formId: '0x000003EC',
  },
  29: {
    name: 'StaminaRate',
    type: 'Mult',
    effect:
      'Percentage of max stamina to regenerate per second (default 5.0 for each player race).',
    formId: '0x000003ED',
  },
  30: {
    name: 'SpeedMult',
    type: 'Mult',
    effect: 'Movement speed percentage (default 100). (%)',
    formId: '0x000003EE',
  },
  31: {
    name: 'InventoryWeight',
    type: 'Stat',
    effect: 'Collective weight of everything in your inventory.',
    formId: '0x000003EF',
  },
  32: {
    name: 'CarryWeight',
    type: 'Stat',
    effect: 'Max points of weight you can carry without being forced to walk.',
    formId: '0x000003F0',
  },
  33: {
    name: 'CritChance',
    type: 'Stat',
    effect:
      'Your chance to score a critical hit; critical hit damage is based on weapon stats, but can be increased through perks. (%)',
    formId: '0x000003F1',
  },
  34: {
    name: 'MeleeDamage',
    type: 'Stat',
    effect:
      'Modifies the listed damage of your weapons (default 0). The modifier actually affects the damage display of the weapons in your inventory. (+points)',
    formId: '0x000003F2',
  },
  35: {
    name: 'UnarmedDamage',
    type: 'Stat',
    effect: 'Modifies the damage of your fists. (+points)',
    formId: '0x000003F3',
  },
  36: {
    name: 'Mass',
    type: 'Stat',
    effect: 'Hidden stat that affects staggering, etc.',
    formId: '0x000003F4',
  },
  37: {
    name: 'VoicePoints',
    type: 'Obsolete',
    effect:
      'Unknown, is supposedly related to a pool of points from which NPCs tap when shouting, but seems to be always 0 for NPCs and 100 for the player. Probably unused.',
    formId: '0x000003F5',
  },
  38: {
    name: 'VoiceRate',
    type: 'Obsolete',
    effect:
      'Unknown, is supposedly related to a pool of points from which NPCs tap when shouting. Seems to be always 5. Probably unused.',
    formId: '0x000003F6',
  },
  39: {
    name: 'DamageResist',
    type: 'Resist',
    effect: 'Armor rating (points, not damage reduction %).',
    formId: '0x000005CE',
  },
  40: {
    name: 'PoisonResist',
    type: 'Resist',
    effect: 'Poison resistance.',
    formId: '0x000005CF',
  },
  41: {
    name: 'FireResist',
    type: 'Resist',
    effect: 'Fire resistance.',
    formId: '0x000005D0',
  },
  42: {
    name: 'ElectricResist',
    type: 'Resist',
    effect: 'Shock resistance.',
    formId: '0x000005D1',
  },
  43: {
    name: 'FrostResist',
    type: 'Resist',
    effect: 'Frost resistance.',
    formId: '0x000005D2',
  },
  44: {
    name: 'MagicResist',
    type: 'Resist',
    effect:
      'Magic resistance (resistance against all types of damage as well as paralysis duration).',
    formId: '0x000005D3',
  },
  45: {
    name: 'DiseaseResist',
    type: 'Resist',
    effect: 'Chance to not contract a disease.',
    formId: '0x000005D4',
  },
  46: {
    name: 'PerceptionCondition',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005D5',
  },
  47: {
    name: 'EnduranceCondition',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005D6',
  },
  48: {
    name: 'LeftAttackCondition',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005D7',
  },
  49: {
    name: 'RightAttackCondition',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005D8',
  },
  50: {
    name: 'LeftMobilityCondition',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005D9',
  },
  51: {
    name: 'RightMobilityCondition',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005DA',
  },
  52: {
    name: 'BrainCondition',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005DB',
  },
  53: {
    name: 'Paralysis',
    type: 'Status',
    effect: 'When not 0, prevents movement and attacking.',
    formId: '0x000005DC',
  },
  54: {
    name: 'Invisibility',
    type: 'Status',
    effect: 'When not 0, grants invisibility (not the associated visuals).',
    formId: '0x000005DD',
  },
  55: {
    name: 'NightEye',
    type: 'Obsolete',
    effect: 'Not actually used by the Night Eye effect.',
    formId: '0x000005DE',
  },
  56: {
    name: 'DetectLifeRange',
    type: 'Obsolete',
    effect:
      'Werewolf version of Detect Life applies this to NPCs with a magnitude of 20; this is the only place where this is used.',
    formId: '0x000005DF',
  },
  57: {
    name: 'WaterBreathing',
    type: 'Status',
    effect: 'When not 0, grants waterbreathing.',
    formId: '0x000005E0',
  },
  58: {
    name: 'WaterWalking',
    type: 'Status',
    effect: 'When not 0, grants waterwalking.',
    formId: '0x000005E1',
  },
  59: {
    name: 'IgnoreCrippledLimbs',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005E2',
  },
  60: {
    name: 'Fame',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005E3',
  },
  61: {
    name: 'Infamy',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005E4',
  },
  62: {
    name: 'JumpingBonus',
    type: 'Obsolete',
    effect: 'No effect.',
    formId: '0x000005E5',
  },
  63: {
    name: 'WardPower',
    type: 'Buffer',
    effect:
      'Absorbs incoming spell damage by subtracting the damage from itself, used in ward spells. Exists as a straight bonus on Spellbreaker, or "Accum. Magnitude" (charge-up) on wards.',
    formId: '0x000005E6',
  },
  64: {
    name: 'RightItemCharge',
    type: 'Stat',
    effect:
      'The number of charges remaining in an item equipped in the right hand (i.e. enchanted weapons, magical staffs, etc.).',
    formId: '0x000005E7',
  },
  65: {
    name: 'ArmorPerks',
    type: 'Perk',
    effect: 'Armor rating multiplier (default 0). (0.25 = +25% armor rating)',
    formId: '0x000005E8',
  },
  66: {
    name: 'ShieldPerks',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005E9',
  },
  67: {
    name: 'WardDeflection',
    type: 'Obsolete',
    effect: 'Is 0 and does not seem to change when using wards.',
    formId: '0x000005EA',
  },
  68: {
    name: 'Variable01',
    type: 'User-defined',
    effect: 'See the Creation Kit Wiki.',
    formId: '0x000005EB',
  },
  69: {
    name: 'Variable02',
    type: 'User-defined',
    effect: '',
    formId: '0x000005EC',
  },
  70: {
    name: 'Variable03',
    type: 'User-defined',
    effect: '',
    formId: '0x000005ED',
  },
  71: {
    name: 'Variable04',
    type: 'User-defined',
    effect: '',
    formId: '0x000005EE',
  },
  72: {
    name: 'Variable05',
    type: 'User-defined',
    effect: '',
    formId: '0x000005EF',
  },
  73: {
    name: 'Variable06',
    type: 'User-defined',
    effect: '',
    formId: '0x000005F0',
  },
  74: {
    name: 'Variable07',
    type: 'User-defined',
    effect: '',
    formId: '0x000005F1',
  },
  75: {
    name: 'Variable08',
    type: 'User-defined',
    effect: '',
    formId: '0x000005F2',
  },
  76: {
    name: 'Variable09',
    type: 'User-defined',
    effect: '',
    formId: '0x000005F3',
  },
  77: {
    name: 'Variable10',
    type: 'User-defined',
    effect: '',
    formId: '0x000005F4',
  },
  78: {
    name: 'BowSpeedBonus',
    type: 'Perk',
    effect: 'Slows time when zoomed in with a bow (1 = normal time, 0.5 = half speed).',
    formId: '0x000005F5',
  },
  79: {
    name: 'FavorActive',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005F6',
  },
  80: {
    name: 'FavorsPerDay',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005F7',
  },
  81: {
    name: 'FavorsPerDayTimer',
    type: 'Obsolete',
    effect: '',
    formId: '0x000005F8',
  },
  82: {
    name: 'LeftItemCharge',
    type: 'Stat',
    effect:
      'The number of charges remaining in an item equipped in the left hand (i.e. enchanted weapons, magical staffs, etc.).',
    formId: '0x000005F9',
  },
  83: {
    name: 'AbsorbChance',
    type: 'Stat',
    effect:
      'Chance to negate an incoming spell and grant magicka equal to its base casting cost. (%)',
    formId: '0x000005FA',
  },
  84: {
    name: 'Blindness',
    type: 'Stat',
    effect:
      "Affects this actor's ability to spot you while sneaking and out of combat (default 0). At maximum, you can only be detected by this actor through sound, but it does not work in combat. (%)",
    formId: '0x000005FB',
  },
  85: {
    name: 'WeaponSpeedMult',
    type: 'Mult',
    effect:
      'Weapon attack speed, Bow draw speed. (This is an odd modifier because the default is 0 and yet it is a multiplier, meaning 1 = 100%, 0.5 = 50%, 2 = 200% but 0 = also 100%)',
    formId: '0x000005FC',
  },
  86: {
    name: 'ShoutRecoveryMult',
    type: 'Mult',
    effect: 'How much are you waiting for shout recovery. (1 = 100%, 0.5 = 50% of original time).',
    formId: '0x000005FD',
  },
  87: {
    name: 'BowStaggerBonus',
    type: 'Stat',
    effect:
      "Chance to stagger enemies with bow shots. (1 = Sets the stagger bonus for a heavy stagger no matter the bow's damage or how much the bow's drawn. For example, if you spend a skill point on Power Shot in the Archery skill tree, it will add to the bonus.)",
    formId: '0x000005FE',
  },
  88: {
    name: 'Telekinesis',
    type: 'Status',
    effect:
      'Is set to 1 when the Telekinesis spell is equipped, otherwise 0. Responsible for toggling the UI to display the name and stats of distant items, as well as the ability to grab distant items with Telekinesis as opposed to being limited to pick-up range. Other values are the same as 1.',
    formId: '0x000005FF',
  },
  89: {
    name: 'FavorPointsBonus',
    type: 'Obsolete',
    effect: '',
    formId: '0x00000600',
  },
  90: {
    name: 'LastBribedIntimidated',
    type: 'Obsolete',
    effect: '',
    formId: '0x00000601',
  },
  91: {
    name: 'LastFlattered',
    type: 'Obsolete',
    effect: '',
    formId: '0x00000602',
  },
  92: {
    name: 'MovementNoiseMult',
    type: 'Stat',
    effect: 'Reduction in movement noise. (1 = no reduction, 0 = 100% reduction)',
    formId: '0x00000603',
  },
  93: {
    name: 'BypassVendorStolenCheck',
    type: 'Status',
    effect: 'Sell stolen items to any vendor.',
    formId: '0x00000604',
  },
  94: {
    name: 'BypassVendorKeywordCheck',
    type: 'Status',
    effect: 'Sell non-stolen items of any type to any vendor.',
    formId: '0x00000605',
  },
  95: {
    name: 'WaitingForPlayer',
    type: 'AI',
    effect: 'Returns 1 if Follower is waiting for player.',
    formId: '0x00000606',
  },
  96: {
    name: 'OneHandedMod',
    type: 'Mod',
    effect: 'Skill modifiers',
    formId: '0x00000607',
  },
  97: {
    name: 'TwoHandedMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000608',
  },
  98: {
    name: 'MarksmanMod',
    type: 'Mod',
    effect: 'Bow damage',
    formId: '0x00000609',
  },
  99: {
    name: 'BlockMod',
    type: 'Mod',
    effect: '',
    formId: '0x0000060A',
  },
  100: {
    name: 'SmithingMod',
    type: 'Mod',
    effect: '',
    formId: '0x0000060B',
  },
  101: {
    name: 'HeavyArmorMod',
    type: 'Mod',
    effect: '',
    formId: '0x0000060C',
  },
  102: {
    name: 'LightArmorMod',
    type: 'Mod',
    effect: '',
    formId: '0x0000060D',
  },
  103: {
    name: 'PickPocketMod',
    type: 'Mod',
    effect: '',
    formId: '0x0000060E',
  },
  104: {
    name: 'LockpickingMod',
    type: 'Mod',
    effect: '',
    formId: '0x0000060F',
  },
  105: {
    name: 'SneakMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000610',
  },
  106: {
    name: 'AlchemyMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000611',
  },
  107: {
    name: 'SpeechcraftMod',
    type: 'Mod',
    effect: 'Used for price/"Haggling" enchantment calculations',
    formId: '0x00000612',
  },
  108: {
    name: 'AlterationMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000613',
  },
  109: {
    name: 'ConjurationMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000614',
  },
  110: {
    name: 'DestructionMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000615',
  },
  111: {
    name: 'IllusionMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000616',
  },
  112: {
    name: 'RestorationMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000617',
  },
  113: {
    name: 'EnchantingMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000618',
  },
  114: {
    name: 'OneHandedSkillAdvance',
    type: 'Exp',
    effect:
      'These values previously controlled the skill XP for each individual skill. As of Patch 1.9, they no longer serve that purpose and have no effect.',
    formId: '0x00000619',
  },
  115: {
    name: 'TwoHandedSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x0000061A',
  },
  116: {
    name: 'MarksmanSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x0000061B',
  },
  117: {
    name: 'BlockSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x0000061C',
  },
  118: {
    name: 'SmithingSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x0000061D',
  },
  119: {
    name: 'HeavyArmorSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x0000061E',
  },
  120: {
    name: 'LightArmorSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x0000061F',
  },
  121: {
    name: 'PickPocketSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x00000620',
  },
  122: {
    name: 'LockpickingSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x00000621',
  },
  123: {
    name: 'SneakSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x00000622',
  },
  124: {
    name: 'AlchemySkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x00000623',
  },
  125: {
    name: 'SpeechcraftSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x00000624',
  },
  126: {
    name: 'AlterationSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x00000625',
  },
  127: {
    name: 'ConjurationSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x00000626',
  },
  128: {
    name: 'DestructionSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x00000627',
  },
  129: {
    name: 'IllusionSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x00000628',
  },
  130: {
    name: 'RestorationSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x00000629',
  },
  131: {
    name: 'EnchantingSkillAdvance',
    type: 'Exp',
    effect: '',
    formId: '0x0000062A',
  },
  132: {
    name: 'LeftWeaponSpeedMult',
    type: 'Mult',
    effect: '',
    formId: '0x0000062B',
  },
  133: {
    name: 'DragonSouls',
    type: 'Stat',
    effect: 'Number of dragon souls available.',
    formId: '0x0000062C',
  },
  134: {
    name: 'CombatHealthRegenMult',
    type: 'Mult',
    effect:
      'How much faster you heal in combat. (Default is 0, but set to 0.7 = 70% of the normal heal rate by the player ability PCHealRateCombat)',
    formId: '0x0000062D',
  },
  135: {
    name: 'OneHandedPowerMod',
    type: 'Mod',
    effect: 'Does not raise skill level but approximates its effects.',
    formId: '0x0000062E',
  },
  136: {
    name: 'TwoHandedPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x0000062F',
  },
  137: {
    name: 'MarksmanPowerMod',
    type: 'Mod',
    effect:
      'Affects all types of weapons and unarmed damage. The Unofficial Skyrim Patch, version 1.2, fixes this bug.',
    formId: '0x00000630',
  },
  138: {
    name: 'BlockPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000631',
  },
  139: {
    name: 'SmithingPowerMod',
    type: 'Mod',
    effect: 'Determines stat-improvement when improving weapons, and armor.',
    formId: '0x00000632',
  },
  140: {
    name: 'HeavyArmorPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000633',
  },
  141: {
    name: 'LightArmorPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000634',
  },
  142: {
    name: 'PickPocketPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000635',
  },
  143: {
    name: 'LockpickingPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000636',
  },
  144: {
    name: 'SneakPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000637',
  },
  145: {
    name: 'AlchemyPowerMod',
    type: 'Mod',
    effect: 'Determines strength of player-made potions, and poisons.',
    formId: '0x00000638',
  },
  146: {
    name: 'SpeechcraftPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x00000639',
  },
  147: {
    name: 'AlterationPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x0000063A',
  },
  148: {
    name: 'ConjurationPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x0000063B',
  },
  149: {
    name: 'DestructionPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x0000063C',
  },
  150: {
    name: 'IllusionPowerMod',
    type: 'Mod',
    effect: '',
    formId: '0x0000063D',
  },
  151: {
    name: 'RestorationPowerMod',
    type: 'Mod',
    effect:
      'Increases other Fortify Skill enchantments. The Unofficial Skyrim Patch, version 1.3.0, fixes this bug.',
    formId: '0x0000063E',
  },
  152: {
    name: 'EnchantingPowerMod',
    type: 'Mod',
    effect: 'Determines Power of player-made enchanted items.',
    formId: '0x0000063F',
  },
  153: {
    name: 'DragonRend',
    type: 'Toggle',
    effect: '',
    formId: '0x00000640',
  },
  154: {
    name: 'AttackDamageMult',
    type: 'Mult',
    effect:
      'Multiplier coefficient for all physical damage from weapons, fists, and bashing (1 = default, 2 = double damage, etc.). Affects weapon damage display in inventory screen.',
    formId: '0x00000641',
  },
  155: {
    name: 'HealRateMult/CombatHealthRegenMultMod',
    type: 'Mult',
    effect: 'Health regen rate multiplier. Is affected by Regenerate Health (Default 100)',
    formId: '0x00000642',
  },
  156: {
    name: 'MagickaRateMult/CombatHealthRegenMultPowerMod',
    type: 'Mult',
    effect: 'Magicka regen rate multiplier. Is affected by Regenerate Magicka (Default 100)',
    formId: '0x00000643',
  },
  157: {
    name: 'StaminaRateMult',
    type: 'Mult',
    effect: 'Stamina regen rate multiplier. Is affected by Regenerate Stamina (Default 100)',
    formId: '0x00000644',
  },
  158: {
    name: 'WerewolfPerks',
    type: 'Obsolete',
    effect: '',
    formId: '0x00000645',
  },
  159: {
    name: 'VampirePerks',
    type: 'Obsolete',
    effect: '',
    formId: '0x0000646',
  },
  160: {
    name: 'GrabActorOffset',
    type: 'Obsolete',
    effect:
      'The distance in front of the caster where the target of Vampiric Grip is held. By default 0, but is set differently by Vampire Lord form.',
    formId: '0x00000647',
  },
  161: {
    name: 'Grabbed',
    type: 'Status',
    effect:
      'Does not seem to have any effect, may be used to determine which actor has been grabbed by Vampiric Grip.',
    formId: '0x00000648',
  },
  162: {
    name: 'DEPRECATED05',
    type: 'Obsolete',
    effect: '',
    formId: '0x00000649',
  },
  163: {
    name: 'ReflectDamage',
    type: 'Stat',
    effect:
      'Chance to reflect all incoming melee damage back to the attacker. Does not reduce the damage you take. (%)',
    formId: '0x0000064A',
  },
};
