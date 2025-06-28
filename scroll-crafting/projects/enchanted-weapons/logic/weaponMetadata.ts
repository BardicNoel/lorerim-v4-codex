import { WeapRecord } from "../../../types/weapSchema.js";
import { KywdRecord } from "../../../types/kywdSchema.js";
import {
  resolveWeaponKeywords,
  isVendorItem,
  getWeaponMaterial,
} from "../../../utils/weaponKeywordResolver.js";

/**
 * Resolves weapon keywords and metadata
 */
export function resolveWeaponKeywordsAndMetadata(
  weapon: WeapRecord,
  keywordRecords: KywdRecord[]
): {
  keywords: string[];
  material: string | null;
  isVendorItem: boolean;
} {
  const keywords =
    weapon.data.KWDA && weapon.data.KWDA.length > 0
      ? resolveWeaponKeywords(weapon.data.KWDA, keywordRecords)
      : [];

  const material = getWeaponMaterial(keywords);
  const isVendorItemFlag = isVendorItem(keywords);

  return {
    keywords,
    material,
    isVendorItem: isVendorItemFlag,
  };
}
