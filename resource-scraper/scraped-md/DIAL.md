# DIAL Record Structure (UESP)

*Source: [UESP - DIAL](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/DIAL)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| - | EDID | EditorId | zstring | Editor ID |
| - | FULL | Player Dialogue | dlstring | Player dialogue. |
| + | PNAM | Priority | float | Priority |
| - | BNAM | Owning Branch | formID | DLBR (Dialogue Branch) formid. |
| + | QNAM | Owning Quest | formID | QUST formid. |
| + | DATA | Unknown | bool | Only seen on CUST and SCEN dialog records.
Custom: Unknown.
Scene: Do All Before Repeating. |
| Dialogue Tab | uint8 | Quest dialogue tab (some discrepancies from internal CK data, probably unused).
0 = Player Dialogue
1 = Favor Dialogue
2 = Scenes
3 = Combat
4 = Favors
5 = Detection
6 = Service
7 = Misc |  |  |
| Subtype ID | uint8 | Subtype ID. Unreliable, and unused if SNAM is present after DATA. |  |  |
| Unused | uint8 | Always 0. |  |  |
| + | SNAM | Subtype | char[4] | Dialogue subtype:



ACAC: ActorCollidewithActor
ACYI: AcceptYield
AGRE: Agree
ALIL: AlertIdle
ALKL: AllyKilled
ALTC: AlertToCombat
ALTN: AlertToNormal
ASKF: AskFavor
ASKG: AskGift
ASNC: AssaultNC
ASSA: Assault
ATCK: Attack
AVTH: AvoidThreat
BAEX: BarterExit
BASH: Bash
BLED: BleedOut
BLOC: Block
BREA: EnterSprintBreath
BRIB: Bribe
COLO: CombatToLost
COTN: CombatToNormal
CUST: Custom
DEOB: DestroyObject
DETH: Death
DFDA: DetectFriendDie
ENBZ: EnterBowZoomBreath



EXBZ: ExitBowZoomBreath
FAVO: Favor
FEXT: ExitFavorState
FIWE: ShootBow
FLAT: Flatter
FLEE: Flee
FMAT: FlyingMountAcceptTarget
FMDR: FlyingMountDestinationReached
FMLX: FlyingMountLand
FMNT: FlyingMountNoTarget
FMRT: FlyingMountRejectTarget
FMXL: FlyingMountCancelLand
FOLL: Follow
FRJT: Reject
FVDL: Custom
GBYE: Goodbye
GIFF: Gift
GRNT: CombatGrunt
GRST: GroupStrategy
HELO: Hello
HIT_: Hit
IDAT: SharedInfo
IDLE: Idle
INTI: Intimidate
JUMP: Jump
KNOO: KnockOverObject



LOIL: LostIdle
LOOB: LockedObject
LOTC: LostToCombat
LOTN: LostToNormal
LWBS: LeaveWaterBreath
MREF: MoralRefusal
MUNC: MurderNC
MURD: Murder
NOTA: NormalToAlert
NOTC: NormalToCombat
NOTI: NoticeCorpse
OBCO: ObserveCombat
OUTB: OutofBreath
PCPS: PlayerCastProjectileSpell
PCSH: PlayerShout
PCSS: PlayerCastSelfSpell
PFGT: ForceGreet
PICC: PickpocketCombat
PICN: PickpocketNC
PICT: PickpocketTopic
PIRN: PlayerinIronSights
POAT: PowerAttack
PURS: PursueIdleTopic
RCEX: RechargeExit
RECH: Recharge
REEX: RepairExit



REFU: Refuse
REPA: Repair
RUMO: Rumors
SCEN: Scene: Dialogue Action
SERU: ServiceRefusal
SHOW: Show
SHRE: ShowRelationships
STEA: Steal
STFN: StealFromNC
STOF: StandonFurniture
SWMW: SwingMeleeWeapon
TAUT: Taunt
TITG: TimeToGo
TRAI: Training
TRAN: TrespassAgainstNC
TRAV: Travel
TRES: Trespass
TREX: TrainingExit
VPEL: VoicePowerEndLong
VPES: VoicePowerEndShort
VPSL: VoicePowerStartLong
VPSS: VoicePowerStartShort
WTCR: WereTransformCrime
YIEL: Yield
ZKEY: ZKeyObject |
| ACAC: ActorCollidewithActor
ACYI: AcceptYield
AGRE: Agree
ALIL: AlertIdle
ALKL: AllyKilled
ALTC: AlertToCombat
ALTN: AlertToNormal
ASKF: AskFavor
ASKG: AskGift
ASNC: AssaultNC
ASSA: Assault
ATCK: Attack
AVTH: AvoidThreat
BAEX: BarterExit
BASH: Bash
BLED: BleedOut
BLOC: Block
BREA: EnterSprintBreath
BRIB: Bribe
COLO: CombatToLost
COTN: CombatToNormal
CUST: Custom
DEOB: DestroyObject
DETH: Death
DFDA: DetectFriendDie
ENBZ: EnterBowZoomBreath | EXBZ: ExitBowZoomBreath
FAVO: Favor
FEXT: ExitFavorState
FIWE: ShootBow
FLAT: Flatter
FLEE: Flee
FMAT: FlyingMountAcceptTarget
FMDR: FlyingMountDestinationReached
FMLX: FlyingMountLand
FMNT: FlyingMountNoTarget
FMRT: FlyingMountRejectTarget
FMXL: FlyingMountCancelLand
FOLL: Follow
FRJT: Reject
FVDL: Custom
GBYE: Goodbye
GIFF: Gift
GRNT: CombatGrunt
GRST: GroupStrategy
HELO: Hello
HIT_: Hit
IDAT: SharedInfo
IDLE: Idle
INTI: Intimidate
JUMP: Jump
KNOO: KnockOverObject | LOIL: LostIdle
LOOB: LockedObject
LOTC: LostToCombat
LOTN: LostToNormal
LWBS: LeaveWaterBreath
MREF: MoralRefusal
MUNC: MurderNC
MURD: Murder
NOTA: NormalToAlert
NOTC: NormalToCombat
NOTI: NoticeCorpse
OBCO: ObserveCombat
OUTB: OutofBreath
PCPS: PlayerCastProjectileSpell
PCSH: PlayerShout
PCSS: PlayerCastSelfSpell
PFGT: ForceGreet
PICC: PickpocketCombat
PICN: PickpocketNC
PICT: PickpocketTopic
PIRN: PlayerinIronSights
POAT: PowerAttack
PURS: PursueIdleTopic
RCEX: RechargeExit
RECH: Recharge
REEX: RepairExit | REFU: Refuse
REPA: Repair
RUMO: Rumors
SCEN: Scene: Dialogue Action
SERU: ServiceRefusal
SHOW: Show
SHRE: ShowRelationships
STEA: Steal
STFN: StealFromNC
STOF: StandonFurniture
SWMW: SwingMeleeWeapon
TAUT: Taunt
TITG: TimeToGo
TRAI: Training
TRAN: TrespassAgainstNC
TRAV: Travel
TRES: Trespass
TREX: TrainingExit
VPEL: VoicePowerEndLong
VPES: VoicePowerEndShort
VPSL: VoicePowerStartLong
VPSS: VoicePowerStartShort
WTCR: WereTransformCrime
YIEL: Yield
ZKEY: ZKeyObject |  |
| + | TIFC | Info Count | uint32 | Count of topic INFO subrecords. This is used to preallocate memory for the topic's info list, but shouldn't be required. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

