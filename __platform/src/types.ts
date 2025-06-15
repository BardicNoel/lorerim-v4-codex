export interface ParsedRecord {
    meta: {
      type: string;   // e.g., 'PERK'
      formId: string; // e.g., '00058F80'
      stackOrder?: number | null; // e.g., 0, 1, 2, (0 being the highest version of this record)
      plugin: string; // e.g., 'Requiem.esp'
    };
    data: {
      [key: string]: Buffer[] ; // Subrecord content by subrecord ID, can be either raw Buffer[] or decoded data
    };
    decodedData?:{
      [key: string]: any; // Decoded data by subrecord ID
    }
    decodedErrors?:{
      [key: string]: any; // Decoded data by subrecord ID
    }
    header: string; // Raw 24-byte record header in base64
} 

