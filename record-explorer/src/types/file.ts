import type { Schema } from './schema';

export interface LoadedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  data: any[];
  schema: Schema | null;
  loadedAt: Date;
  error?: string;
}

export interface FileStats {
  totalFiles: number;
  totalRecords: number;
  averageRecordsPerFile: number;
  largestFile: LoadedFile | null;
  smallestFile: LoadedFile | null;
} 