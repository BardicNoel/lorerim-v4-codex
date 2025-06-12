export interface RecordMeta<T> {
  plugin: string;
  loadOrder: number;
  recordType: string;
  formId: string;
  fullFormId: string;
  uniqueId: string;
  winning: boolean;
  rawOffset: number;
  parsed: T;
} 