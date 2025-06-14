# Record Aggregation and Winning Override Resolution

## Overview

This document outlines the design of a high-performance system for aggregating parsed record metadata from Skyrim plugin binaries. The goal is to identify the winning override for each FormID based on plugin load order. This stage assumes that record scanning, plugin indexing, and ESL normalization have already been completed.

## Goals

- Resolve winning records based on plugin load order
- Ensure thread safety during concurrent aggregation
- Optimize for memory efficiency and speed

## Aggregation Process

### 1. **Initialization**

- Receive a sorted list of plugins in reverse load order (i.e., last loaded first)
- Each plugin is associated with a list of pre-parsed `RecordMeta` entries

### 2. **Winning Records Set**

- Maintain a thread-safe map: `Map<FormID, RecordMeta>`
- Represents the set of winning overrides for each unique FormID

### 3. **Aggregation Algorithm**

- Iterate over plugin records in reverse load order
- For each `RecordMeta`:
  ```ts
  if (!winnerSet.has(record.formID)) {
    record.isWinner = true;
    winnerSet.set(record.formID, record);
    outputList.push(record);
  }
  // else: record is an override but not the winner, discard or ignore
  ```

### 4. **Thread Safety**

- Aggregation occurs in the main thread to avoid locking
- Worker threads scan plugin files and emit `RecordMeta` objects
- Main thread acts as the single aggregator, ensuring atomic access to the `winnerSet`


## Extensibility

- Add support for tracking second-place overrides for diagnostics
- Aggregate by record type if needed for filtered views

## Summary

This aggregation strategy ensures that the final set of winning overrides is accurate and efficiently determined, using a reverse-ordered aggregation process and a centralized winner set maintained in the main thread.

