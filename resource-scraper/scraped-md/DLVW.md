# DLVW Record Structure (UESP)

*Source: [UESP - DLVW](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/DLVW)*

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | Editor ID | zstring |  |
| + | QNAM | Parent Quest | formid | The QUST to which this Dialogue View belongs. |
| * | BNAM | Branches | formid | Reference to the DLBR (Dialogue Branches) used in this view. A view with branches appears to exclude it having topics. |
| * | TNAM | Topics | formid | References to the DIAL (Dialogue Topics) used in this view. A view with topics appears to exclude it having branches. |
| - | ENAM | Unknown | uint32 | 0 for views with branches; 7 for views with topics. |
| - | DNAM | Show All Text | byte | Indicates whether or not Show All Text is selected in the CK. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

