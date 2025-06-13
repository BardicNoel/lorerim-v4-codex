export interface ParsedRecord {
  meta: {
    type: string;   // e.g., 'PERK'
    formId: string; // e.g., '00058F80'
    plugin: string; // e.g., 'Requiem.esp'
  };
  data: Record<string, Buffer[]>; // Subrecord content by subrecord ID
  header: string; // Raw 20-byte record header in base64
} 