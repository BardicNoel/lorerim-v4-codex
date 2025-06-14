# COBJ Record Structure (UESP)

*Source: [UESP - COBJ](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/COBJ)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | editorID | zstring | Max 0x200 bytes, including null terminator. |
| - |  | COCT | object count | uint32 | Number of input objects (types of ingredients) required. |
| * |  | CNTO | inputObject | struct[8] |  |
| item | formID | The form ID of the ingredient required to craft this item. |  |  |  |
| quantity | uint32 | How many of this ingredient is required to craft the item. |  |  |  |
| - |  | COED | unknown | COED |  |
| * |  | CTDA | conditions | CTDA | Additional requirements that must be met before the player can use the recipe.  Most notably, used for forging to specify the Smithing perk that must be unlocked to create the item. |
| - |  | CNAM | outputObject | formID | Resulting output object FormID. |
| + |  | BNAM | benchKeyword | formID | [KYWD 0x00088105] CraftingSmithingForge, [KYWD 0x000ADB78] CraftingSmithingArmorTable, [KYWD 0x000A5CCE] CraftingSmelter, [KYWD 0x00088108] CraftingSmithingSharpeningWheel |
| + |  | NAM1 | outputQuantity | uint16 | Quantity of the output object created by the recipe. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

