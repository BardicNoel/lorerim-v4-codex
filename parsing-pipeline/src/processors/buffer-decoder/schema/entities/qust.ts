import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';
import { flagParserGenerator } from '../generics';
import { CTDA_ARRAY_SCHEMA, CTDA_RELATED_SCHEMAS } from '../ctda/ctdaSchema';
import iconv from 'iconv-lite';

// QUST DNAM flags (first byte)
const QUST_DNAM_FLAGS_1 = {
  0x01: 'StartGameEnabled',
  0x02: 'Unused',
  0x04: 'WildernessEncounter',
  0x08: 'AllowRepeatedStages',
  0x10: 'UsedButNotShownInCK',
};

// QUST DNAM flags (second byte)
const QUST_DNAM_FLAGS_2 = {
  0x01: 'RunOnce',
  0x02: 'ExcludeFromDialogueExport',
  0x04: 'WarnOnAliasFillFailure',
  0x08: 'Unused',
  0x10: 'UsedButNotShownInCK',
};

// QUST Quest Type enum
const QUST_TYPE = {
  0: 'None',
  1: 'MainQuest',
  2: 'MagesGuild',
  3: 'ThievesGuild',
  4: 'DarkBrotherhood',
  5: 'CompanionQuests',
  6: 'Miscellaneous',
  7: 'DaedricQuests',
  8: 'SideQuests',
  9: 'CivilWar',
  10: 'DLC01_Vampire',
  11: 'DLC02_Dragonborn',
};

// QUST Stage Flags
const QUST_STAGE_FLAGS = {
  0x02: 'StartUpStage',
  0x04: 'ShutDownStage',
  0x08: 'KeepInstanceDataFromHereOn',
};

// QUST Log Entry Flags
const QUST_LOG_ENTRY_FLAGS = {
  0x01: 'CompleteQuest',
  0x02: 'FailQuest',
};

// QUST Objective Flags
const QUST_OBJECTIVE_FLAGS = {
  0x01: 'ORedWithPrevious',
};

// QUST Target Flags
const QUST_TARGET_FLAGS = {
  0x01: 'IgnoreLocks',
};

// QUST Alias Flags
const QUST_ALIAS_FLAGS = {
  0x00000001: 'ReservesLocationReference',
  0x00000002: 'Optional',
  0x00000004: 'QuestObject',
  0x00000008: 'AllowReuseInQuest',
  0x00000010: 'AllowDead',
  0x00000020: 'InLoadedArea',
  0x00000040: 'Essential',
  0x00000080: 'AllowDisabled',
  0x00000100: 'StoresText',
  0x00000200: 'AllowReserved',
  0x00000400: 'Protected',
  0x00000800: 'NoFillType',
  0x00001000: 'AllowDestroyed',
  0x00002000: 'Closest',
  0x00004000: 'UsesStoredText',
  0x00008000: 'InitiallyDisabled',
  0x00010000: 'AllowCleared',
  0x00020000: 'ClearsNameWhenRemoved',
};

export const questSchema: RecordSpecificSchemas = createSchema('QUST', {
  // Script Info
  VMAD: {
    type: 'unknown',
    parser: (args: any) => {
      const buffer = args.buffer || args[0];
      const offset = args.offset || 0;

      if (!buffer || buffer.length < 6) {
        console.log(`[DEBUG] VMAD Parser: buffer too small (${buffer?.length} bytes)`);
        return { scripts: [] };
      }

      const version = buffer.readUInt16LE(offset);
      const objectFormat = buffer.readUInt16LE(offset + 2);
      const scriptCount = buffer.readUInt16LE(offset + 4);
      let currentOffset = offset + 6;

      const result: any = {
        version,
        objectFormat,
        scriptCount,
        scripts: [],
      };

      for (let i = 0; i < scriptCount; i++) {
        // Read scriptName (wstring: uint16 length, then Windows-1252 string)
        if (currentOffset + 2 > buffer.length) break;
        const scriptNameLen = buffer.readUInt16LE(currentOffset);
        currentOffset += 2;
        if (currentOffset + scriptNameLen > buffer.length) break;
        const scriptNameBuffer = buffer.slice(currentOffset, currentOffset + scriptNameLen);
        const scriptName = iconv.decode(scriptNameBuffer, 'win1252');
        const scriptNameHex = buffer.toString('hex', currentOffset, currentOffset + scriptNameLen);
        console.log(
          `[DEBUG] VMAD Parser: script ${i} name (len=${scriptNameLen}) at offset ${currentOffset}: "${scriptName}" [hex: ${scriptNameHex}]`
        );
        currentOffset += scriptNameLen;
        // Read status (uint8, only if version >= 4)
        let scriptStatus = 0;
        if (version >= 4) {
          if (currentOffset + 1 > buffer.length) break;
          scriptStatus = buffer.readUInt8(currentOffset);
          currentOffset += 1;
        }
        // Read propertyCount (uint16)
        if (currentOffset + 2 > buffer.length) break;
        const propertyCount = buffer.readUInt16LE(currentOffset);
        currentOffset += 2;
        console.log(
          `[DEBUG] VMAD Parser: script ${i} propertyCount = ${propertyCount} at offset ${currentOffset}`
        );
        const script: any = { scriptName, scriptStatus, propertyCount, properties: [] };
        for (let j = 0; j < propertyCount; j++) {
          const propStartOffset = currentOffset;
          // Read propertyName (wstring)
          if (currentOffset + 2 > buffer.length) break;
          const propertyNameLen = buffer.readUInt16LE(currentOffset);
          currentOffset += 2;
          if (currentOffset + propertyNameLen > buffer.length) break;
          const propertyNameBuffer = buffer.slice(currentOffset, currentOffset + propertyNameLen);
          const propertyName = iconv.decode(propertyNameBuffer, 'win1252');
          const propertyNameHex = buffer.toString(
            'hex',
            currentOffset,
            currentOffset + propertyNameLen
          );
          currentOffset += propertyNameLen;
          // Read propertyType (uint8)
          if (currentOffset + 1 > buffer.length) break;
          const propertyType = buffer.readUInt8(currentOffset);
          currentOffset += 1;
          // Read propertyStatus (uint8, only if version >= 4)
          let propertyStatus = 1;
          if (version >= 4) {
            if (currentOffset + 1 > buffer.length) break;
            propertyStatus = buffer.readUInt8(currentOffset);
            currentOffset += 1;
          }
          // Parse propertyValue based on type
          let propertyValue: any = null;
          const valueStartOffset = currentOffset;
          switch (propertyType) {
            case 1: // object
              if (objectFormat === 1) {
                if (currentOffset + 8 > buffer.length) break;
                const formId = buffer.readUInt32LE(currentOffset);
                const alias = buffer.readUInt16LE(currentOffset + 4);
                propertyValue = { formId, alias };
                currentOffset += 8;
              } else if (objectFormat === 2) {
                if (currentOffset + 8 > buffer.length) break;
                const alias = buffer.readUInt16LE(currentOffset + 2);
                const formId = buffer.readUInt32LE(currentOffset + 4);
                propertyValue = { formId, alias };
                currentOffset += 8;
              }
              break;
            case 2: // wstring
              if (currentOffset + 2 > buffer.length) break;
              const strLen = buffer.readUInt16LE(currentOffset);
              currentOffset += 2;
              if (currentOffset + strLen > buffer.length) break;
              const strBuffer = buffer.slice(currentOffset, currentOffset + strLen);
              propertyValue = iconv.decode(strBuffer, 'win1252');
              currentOffset += strLen;
              break;
            case 3: // int
              if (currentOffset + 4 > buffer.length) break;
              propertyValue = buffer.readInt32LE(currentOffset);
              currentOffset += 4;
              break;
            case 4: // float
              if (currentOffset + 4 > buffer.length) break;
              propertyValue = buffer.readFloatLE(currentOffset);
              currentOffset += 4;
              break;
            case 5: // bool (int8)
              if (currentOffset + 1 > buffer.length) break;
              propertyValue = buffer.readUInt8(currentOffset) !== 0;
              currentOffset += 1;
              break;
            case 11: // array of objects
              if (currentOffset + 4 > buffer.length) break;
              const objArrLen = buffer.readUInt32LE(currentOffset);
              currentOffset += 4;
              propertyValue = [];
              for (let k = 0; k < objArrLen; k++) {
                if (objectFormat === 1) {
                  if (currentOffset + 8 > buffer.length) break;
                  const formId = buffer.readUInt32LE(currentOffset);
                  const alias = buffer.readUInt16LE(currentOffset + 4);
                  propertyValue.push({ formId, alias });
                  currentOffset += 8;
                } else if (objectFormat === 2) {
                  if (currentOffset + 8 > buffer.length) break;
                  const alias = buffer.readUInt16LE(currentOffset + 2);
                  const formId = buffer.readUInt32LE(currentOffset + 4);
                  propertyValue.push({ formId, alias });
                  currentOffset += 8;
                }
              }
              break;
            case 12: // array of wstrings
              if (currentOffset + 4 > buffer.length) break;
              const strArrLen = buffer.readUInt32LE(currentOffset);
              currentOffset += 4;
              propertyValue = [];
              for (let k = 0; k < strArrLen; k++) {
                if (currentOffset + 2 > buffer.length) break;
                const arrStrLen = buffer.readUInt16LE(currentOffset);
                currentOffset += 2;
                if (currentOffset + arrStrLen > buffer.length) break;
                const arrStrBuffer = buffer.slice(currentOffset, currentOffset + arrStrLen);
                propertyValue.push(iconv.decode(arrStrBuffer, 'win1252'));
                currentOffset += arrStrLen;
              }
              break;
            case 13: // array of ints
              if (currentOffset + 4 > buffer.length) break;
              const intArrLen = buffer.readUInt32LE(currentOffset);
              currentOffset += 4;
              propertyValue = [];
              for (let k = 0; k < intArrLen; k++) {
                if (currentOffset + 4 > buffer.length) break;
                propertyValue.push(buffer.readInt32LE(currentOffset));
                currentOffset += 4;
              }
              break;
            case 14: // array of floats
              if (currentOffset + 4 > buffer.length) break;
              const floatArrLen = buffer.readUInt32LE(currentOffset);
              currentOffset += 4;
              propertyValue = [];
              for (let k = 0; k < floatArrLen; k++) {
                if (currentOffset + 4 > buffer.length) break;
                propertyValue.push(buffer.readFloatLE(currentOffset));
                currentOffset += 4;
              }
              break;
            case 15: // array of bools
              if (currentOffset + 4 > buffer.length) break;
              const boolArrLen = buffer.readUInt32LE(currentOffset);
              currentOffset += 4;
              propertyValue = [];
              for (let k = 0; k < boolArrLen; k++) {
                if (currentOffset + 1 > buffer.length) break;
                propertyValue.push(buffer.readUInt8(currentOffset) !== 0);
                currentOffset += 1;
              }
              break;
            default:
              propertyValue = { unknownType: propertyType };
              break;
          }
          script.properties.push({ propertyName, propertyType, propertyStatus, propertyValue });
        }
        result.scripts.push(script);
      }
      return result;
    },
  },
  // Quest Data
  DNAM: {
    type: 'struct',
    fields: [
      {
        name: 'flags1',
        type: 'uint8',
        parser: flagParserGenerator(QUST_DNAM_FLAGS_1),
      },
      {
        name: 'flags2',
        type: 'uint8',
        parser: flagParserGenerator(QUST_DNAM_FLAGS_2),
      },
      { name: 'priority', type: 'uint8' },
      { name: 'unknown1', type: 'uint8' },
      { name: 'unknown2', type: 'int32' },
      {
        name: 'questType',
        type: 'uint32',
        parser: (value: number) =>
          QUST_TYPE[value as keyof typeof QUST_TYPE] || `Unknown(${value})`,
      },
    ],
  },
  // Event
  ENAM: {
    type: 'string',
    encoding: 'utf8',
  },
  // Text Display Globals
  QTGL: {
    type: 'formid',
  },
  // Object Window Filter
  FLTR: {
    type: 'string',
    encoding: 'utf8',
  },
  // Quest Dialogue Conditions - using shared CTDA schema
  CTDA: CTDA_ARRAY_SCHEMA,
  // Related CTDA fields
  CITC: CTDA_RELATED_SCHEMAS.CITC,
  CIS1: CTDA_RELATED_SCHEMAS.CIS1,
  CIS2: CTDA_RELATED_SCHEMAS.CIS2,
  // Marker (delineates between quest dialogue and quest event conditions)
  NEXT: {
    type: 'unknown', // Always zero bytes in length
  },
  // Next Alias ID
  ANAM: {
    type: 'int32',
  },
  // Quest Stage Index
  INDX: {
    type: 'struct',
    fields: [
      { name: 'index', type: 'uint16' },
      {
        name: 'flags',
        type: 'uint8',
        parser: flagParserGenerator(QUST_STAGE_FLAGS),
      },
      { name: 'unknown', type: 'uint8' },
    ],
  },
  // Quest Log Entry Flags
  QSDT: {
    type: 'uint8',
    parser: flagParserGenerator(QUST_LOG_ENTRY_FLAGS),
  },
  // Journal Entry
  CNAM: {
    type: 'string',
    encoding: 'utf8',
  },
  // Next Quest
  NAM0: {
    type: 'formid',
  },
  // Old Script
  SCHR: {
    type: 'unknown', // Old scripting field
  },
  // Objective Index
  QOBJ: {
    type: 'uint16',
  },
  // Objective Flags
  FNAM: {
    type: 'int32',
    parser: flagParserGenerator(QUST_OBJECTIVE_FLAGS),
  },
  // Node Name
  NNAM: {
    type: 'string',
    encoding: 'utf8',
  },
  // Quest Target
  QSTA: {
    type: 'struct',
    fields: [
      { name: 'targetAlias', type: 'int32' },
      {
        name: 'flags',
        type: 'int32',
        parser: flagParserGenerator(QUST_TARGET_FLAGS),
      },
    ],
  },
  // Alias ID (Reference)
  ALST: {
    type: 'uint32',
  },
  // Alias ID (Location)
  ALLS: {
    type: 'uint32',
  },
  // Forced Into Alias
  ALFI: {
    type: 'uint32',
  },
  // Alias Created Object
  ALCO: {
    type: 'formid',
  },
  // Create At
  ALCA: {
    type: 'uint32',
  },
  // Create Level
  ALCL: {
    type: 'uint32',
    parser: (value: number) => {
      const levels = { 0: 'Easy', 1: 'Medium', 2: 'Hard', 3: 'VeryHard', 4: 'None' };
      return levels[value as keyof typeof levels] || `Unknown(${value})`;
    },
  },
  // External Alias Reference
  ALEQ: {
    type: 'formid',
  },
  // External Alias
  ALEA: {
    type: 'uint32',
  },
  // Reference Alias Location
  ALFA: {
    type: 'uint32',
  },
  // Keyword
  KNAM: {
    type: 'formid',
  },
  // Location Alias Reference
  ALRT: {
    type: 'formid',
  },
  // From Event
  ALFE: {
    type: 'string',
    encoding: 'utf8',
  },
  // Event Data
  ALFD: {
    type: 'string',
    encoding: 'utf8',
  },
  // Alias Forced Location
  ALFL: {
    type: 'formid',
  },
  // Alias Forced Reference
  ALFR: {
    type: 'formid',
  },
  // Near Alias
  ALNA: {
    type: 'uint32',
  },
  // Near Type
  ALNT: {
    type: 'uint32',
  },
  // Alias Unique Actor
  ALUA: {
    type: 'formid',
  },
  // KWDA count
  KSIZ: {
    type: 'uint32',
  },
  // Alias Keywords
  KWDA: {
    type: 'array',
    element: { type: 'formid' },
  },
  // CNTO count
  COCT: {
    type: 'uint32',
  },
  // Items (individual CNTO subrecords)
  CNTO: {
    type: 'struct',
    fields: [
      { name: 'itemId', type: 'formid' },
      { name: 'itemCount', type: 'uint32' },
    ],
  },
  // Spectator Override
  SPOR: {
    type: 'formid',
  },
  // Observe Dead Body Override
  OCOR: {
    type: 'formid',
  },
  // Guard Warn Override
  GWOR: {
    type: 'formid',
  },
  // Combat Override
  ECOR: {
    type: 'formid',
  },
  // Display Name
  ALDN: {
    type: 'formid',
  },
  // Alias Spells
  ALSP: {
    type: 'array',
    element: { type: 'formid' },
  },
  // Alias Factions
  ALFC: {
    type: 'array',
    element: { type: 'formid' },
  },
  // Alias Package Data
  ALPC: {
    type: 'array',
    element: { type: 'formid' },
  },
  // Voice Type
  VTCK: {
    type: 'formid',
  },
  // EOF Marker
  ALED: {
    type: 'unknown', // Marks the end of any given alias entry
  },
});
