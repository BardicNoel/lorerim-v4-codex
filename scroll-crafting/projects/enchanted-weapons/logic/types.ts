export interface EnchantedWeaponEffect {
  formId: string;
  name: string;
  description: string;
  magnitude: number;
  duration: number;
  area: number;
  school: string;
}

export interface EnchantedWeaponEnchantment {
  name: string;
  cost: number;
  costMethod: "manual" | "auto";
  chargeAmount: number;
  effects: EnchantedWeaponEffect[];
}

export interface EnchantedWeapon {
  name: string;
  weaponType: string;
  baseDamage: number;
  weight: number;
  value: number;
  enchantment: EnchantedWeaponEnchantment;
  globalFormId: string;
  plugin: string;
  keywords: string[];
  material: string | null;
  isVendorItem: boolean;
  description: string | null;
  cannotDisenchant: boolean;
}

export interface WeaponCategory {
  categoryName: string;
  weapons: EnchantedWeapon[];
}

export interface BoundMysticWeapon {
  name: string;
  weaponType: string;
  baseDamage: number;
  isBound: boolean; // true for Bound, false for Mystic
  globalFormId: string;
  plugin: string;
  keywords: string[];
  material: string | null;
  description: string | null;
}

export interface WandStaffWeapon {
  name: string;
  weaponType: string;
  baseDamage: number;
  weight: number;
  value: number;
  enchantment: EnchantedWeaponEnchantment;
  globalFormId: string;
  plugin: string;
  keywords: string[];
  material: string | null;
  isVendorItem: boolean;
  description: string | null;
}
