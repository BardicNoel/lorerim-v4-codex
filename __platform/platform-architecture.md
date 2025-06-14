1. Skyrim extractor
    - First scan, reads headers, creates metadata
    - Aggregates by type
    - Defines platform record format:
      ```typescript
      interface ParsedRecord {
        meta: {
          type: string;   // e.g., 'PERK'
          formId: string; // e.g., '00058F80'
          stackOrder?: number | null; // e.g., 0, 1, 2, (0 being the highest version)
          plugin: string; // e.g., 'Requiem.esp'
        };
        data: Record<string, Buffer[]>; // Subrecord content by subrecord ID
        header: string; // Raw 24-byte record header in base64
      }
      ```

2. Pipeline Parsers
    - Refines data
    - Parses record data
    - Uses extractor's record format as platform standard
    - Processes binary data from record.data buffers 