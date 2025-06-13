# Plugin Worker Processing Sequence

```mermaid
sequenceDiagram
    participant Main as Main Thread
    participant Worker as Plugin Worker
    participant GRUP as GRUP Handler
    participant Buffer as Buffer Parser
    participant Record as Record Utils

    Main->>Worker: processPlugin(plugin)
    Worker->>Worker: readFile(plugin.fullPath)
    Worker->>Worker: initialize manifest

    loop For each record in buffer
        Worker->>Record: getRecordTypeAt(buffer, offset)
        Record-->>Worker: recordType

        alt if recordType === 'GRUP'
            Worker->>GRUP: processGRUP(buffer, offset, pluginName)
            GRUP->>Record: parseGRUPHeader
            Record-->>GRUP: header
            
            alt if header.groupType === 0
                GRUP->>GRUP: processTopLevelGRUP
                loop For each record in GRUP
                    GRUP->>Buffer: parseRecordHeader
                    Buffer-->>GRUP: recordHeader
                    GRUP->>Buffer: parseSubrecords
                    Buffer-->>GRUP: subrecords
                    GRUP->>Worker: return ParsedRecord[]
                end
            else
                GRUP->>GRUP: processNestedGRUP
                loop For each record in GRUP
                    alt if record is GRUP
                        GRUP->>GRUP: processGRUP (recursive)
                    else if record type is processed
                        GRUP->>Buffer: parseRecordHeader
                        Buffer-->>GRUP: recordHeader
                        GRUP->>Buffer: parseSubrecords
                        Buffer-->>GRUP: subrecords
                        GRUP->>Worker: return ParsedRecord[]
                    end
                end
            end
            
            Worker->>Worker: update manifest (GRUP count)
            Worker->>Worker: update manifest (record types)

        else if recordType === 'TES4'
            Worker->>Buffer: parseRecordHeader
            Buffer-->>Worker: header
            Worker->>Worker: update manifest (TES4 count)

        else
            Worker->>Buffer: parseRecordHeader
            Buffer-->>Worker: header
            Worker->>Worker: update manifest (NORMAL count)
            Worker->>Worker: update manifest (record types)
        end

        Worker->>Worker: calculate next offset
    end

    Worker->>Worker: print manifest summary
    Worker->>Main: postMessage({type: 'done', plugin, manifest})
```

## Key Points

1. **Initial Setup**
   - Main thread sends plugin to worker
   - Worker reads file and initializes manifest

2. **Record Processing Loop**
   - Each record type has its own path
   - GRUPs are handled recursively
   - Manifest is updated for each record

3. **GRUP Processing**
   - Top-Level GRUPs (type 0) are handled differently
   - Nested GRUPs require type checking
   - Records are filtered by type

4. **Manifest Updates**
   - Record counts (TES4, GRUP, NORMAL)
   - Group type counts
   - Record type counts

5. **Completion**
   - Summary is printed
   - Results are sent back to main thread 