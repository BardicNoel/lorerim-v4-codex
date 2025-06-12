export type FieldPath = string | { [key: string]: FieldPath[] };

export interface TrimProfile {
    remove_fields: FieldPath[];
    removeNulls?: boolean;
} 