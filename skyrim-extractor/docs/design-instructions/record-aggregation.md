# Record Aggregation and Stack Order Resolution

## Overview

This document outlines the design of a high-performance system for aggregating parsed record metadata from Skyrim plugin binaries. The goal is to track all records and their stack order (override order) based on plugin load order. This stage assumes that record scanning, plugin indexing, and ESL normalization have already been completed.

## Goals

- Track all records and their stack order based on plugin load order
- Ensure thread safety during concurrent aggregation
- Optimize for memory efficiency and speed

## Aggregation Process

### 1. **Initialization**

- Receive a sorted list of plugins in load order
- Each plugin is associated with a list of pre-parsed `RecordMeta` entries

### 2. **Record Stack Tracking**

- Maintain a thread-safe map: `Map<FormID, ParsedRecord[]>`
- Each FormID maps to an array of records in stack order
- The first occurrence of a FormID gets stackOrder 0, subsequent overrides get 1, 2, etc.

### 3. **Aggregation Algorithm**

- Iterate over plugin records in load order
- For each record:
  ```ts
  if (!recordMap.has(record.formID)) {
    // First occurrence of this FormID
    record.meta.stackOrder = 0;
    recordMap.set(record.formID, [record]);
  } else {
    // Subsequent override
    const stack = recordMap.get(record.formID)!;
    record.meta.stackOrder = stack.length;
    stack.push(record);
  }
  allRecords.push(record);
  ```

### 4. **Thread Safety**

- Aggregation occurs in the main thread to avoid locking
- Worker threads scan plugin files and emit `ParsedRecord` objects
- Main thread acts as the single aggregator, ensuring atomic access to the record stacks

## Extensibility

- Track additional metadata about overrides (e.g., which plugin provides each override)
- Aggregate by record type for filtered views
- Support querying records by stack order

## Summary

This aggregation strategy ensures that we maintain a complete history of all records and their override order, using a stack-based approach where each FormID's records are tracked in order of appearance. The stack order (0 being the first occurrence) provides a clear indication of the override sequence.
