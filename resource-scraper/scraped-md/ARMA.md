# ARMA Record Structure (UESP)

*Source: [UESP - ARMA](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/ARMA)*

| C | Version | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | editorId | zstring | Editor id |
| + | pre 1.6.91 | BODT | Body Template | BODT | 12-byte struct Body Template. Appears to be mutually exclusive with BOD2. |
| + | 1.6.91 | BOD2 | Body Template | BOD2 | 8-byte struct Body Template. Appears to be mutually exclusive with BODT. |
| + |  | RNAM | "primary" race | formid | RACE note: there is no preference given for races listed but must have at least this 1. |
| + |  | DNAM | unknown | struct | 12 bytes
uint8 - Male Priority
uint8 - Female Priority
uint32 - Unknown
uint8 - Detection Sound Value
uint8 - Unknown
float - Weapon Adjust |
| + |  | MOD2 | model | zstring | Models\ relative .nif |
| - |  | MO2T | model data | struct[] | (MODT) varying count of repeated 12 byte struct |
| * |  | MO2S | alternate texture sets | struct | uint32 number of alternate textures.
Followed by sets of:
uint32 - string name length
string - Alt texture name
formid - Alt texture formID (TXST)
uint32 - model index |
| - |  | MOD3 | model | zstring | Models\ relative .nif |
| - |  | MO3T | model data | struct[] | (MODT) varying count of repeated 12 byte struct |
| * |  | MO3S | alternate texture sets | struct | Same as MO2S |
| - |  | MOD4 | model | zstring | Models\ relative .nif |
| - |  | MO4T | model data | struct[] | (MODT) varying count of repeated 12 byte struct |
| * |  | MO4S | alternate texture sets | struct | Same as MO2S |
| - |  | MOD5 | model | zstring | Models\ relative .nif |
| - |  | MO5T | model data | struct[] | (MODT) varying count of repeated 12 byte struct |
| * |  | MO5S | alternate texture sets | struct | Same as MO2S |
| - |  | NAM0 | base male texture | formid | (TXST) formid - male |
| - |  | NAM1 | base female texture | formid | (TXST) formid - female |
| - |  | NAM2 | base male 1st texture | formid | (TXST) formid - male 1st person |
| - |  | NAM3 | base female 1st texture | formid | (TXST) formid - female 1st person |
| * |  | MODL | included race | formid | (RACE) formid - repeated for each race this is applicable to. |
| - |  | SNDD | footstep sound | formid | (FSTS) formid - mostly creatures |
| - |  | ONAM | Art Object | formid | (ARTO) formid - mostly creatures |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

