# COLL Record Structure (UESP)

*Source: [UESP - COLL](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/COLL)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | DESC | unknown | lstring | Description (presumably for CK) |
| + | BNAM | unique id? | uint32 | Unique id (within COLL), may be used instead of FormID to reference internally |
| + | FNAM | debug color | rgb | Debug Color |
| + | GNAM | flags | uint32 | Flags
0x01 - Trigger Volume
0x02 - Sensor
0x04 - Navmesh Obstacle |
| + | MNAM | name | zstring | Name, always same as EDID |
| + | INTV | interactables count | uint32 | Count of interactions in CNAM (if 0 then no CNAM field) |
| - | CNAM | interactables | formid[] | Collides with..., End-to-end COLL formids, total count INTV.  Presumably these are to indicate if the 2 collide there is something to check/do. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

