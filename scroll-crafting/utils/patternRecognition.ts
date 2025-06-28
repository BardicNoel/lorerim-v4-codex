/**
 * Reusable pattern recognition utilities for identifying patterns in data
 * This can be used across different projects for pattern detection and analysis
 */

export interface PatternGroup<T> {
  patternKey: string;
  items: T[];
  count: number;
}

export interface StatRange {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
}

/**
 * Groups items by a pattern key and returns pattern groups
 * This is a reusable utility for grouping similar items
 */
export function groupByPattern<T>(
  items: T[],
  getPatternKey: (item: T) => string
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const patternKey = getPatternKey(item);

    if (!groups.has(patternKey)) {
      groups.set(patternKey, []);
    }

    groups.get(patternKey)!.push(item);
  }

  return groups;
}

/**
 * Converts a pattern map to an array of pattern groups
 * This is a reusable utility for pattern analysis
 */
export function mapToPatternGroups<T>(
  patternMap: Map<string, T[]>
): PatternGroup<T>[] {
  return Array.from(patternMap.entries()).map(([patternKey, items]) => ({
    patternKey,
    items,
    count: items.length,
  }));
}

/**
 * Calculates statistical ranges for a set of numbers
 * This is a reusable utility for statistical calculations
 */
export function calculateStatRanges(numbers: number[]): StatRange {
  if (numbers.length === 0) {
    return { min: 0, max: 0, mean: 0, stdDev: 0 };
  }

  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const variance =
    numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) /
    numbers.length;
  const stdDev = Math.sqrt(variance);

  return { min, max, mean, stdDev };
}

/**
 * Finds the best match for a string in a list of known values
 * This is a reusable utility for fuzzy matching
 */
export function findBestMatch(
  input: string,
  knownValues: string[]
): string | null {
  const normalizedInput = input.toLowerCase().trim();

  // Exact match
  const exactMatch = knownValues.find(
    (value) => value.toLowerCase() === normalizedInput
  );
  if (exactMatch) return exactMatch;

  // Contains match
  const containsMatch = knownValues.find(
    (value) =>
      normalizedInput.includes(value.toLowerCase()) ||
      value.toLowerCase().includes(normalizedInput)
  );
  if (containsMatch) return containsMatch;

  return null;
}

/**
 * Identifies outliers in a dataset using statistical analysis
 * This is a reusable utility for outlier detection
 */
export function findOutliers<T>(
  items: T[],
  getValue: (item: T) => number,
  threshold: number = 2
): T[] {
  if (items.length < 3) return []; // Need at least 3 items for statistical analysis

  const values = items.map(getValue);
  const stats = calculateStatRanges(values);

  return items.filter((item) => {
    const value = getValue(item);
    return Math.abs(value - stats.mean) > threshold * stats.stdDev;
  });
}

/**
 * Parses text using regex patterns and extracts components
 * This is a reusable utility for text parsing
 */
export function parseTextPattern(
  text: string,
  pattern: RegExp,
  componentNames: string[]
): Record<string, string> | null {
  const match = text.match(pattern);

  if (!match) return null;

  const result: Record<string, string> = {};

  // Skip the first element (full match) and map to component names
  for (let i = 1; i < match.length && i - 1 < componentNames.length; i++) {
    result[componentNames[i - 1]] = match[i]?.trim() || "";
  }

  return result;
}

/**
 * Creates a pattern key from multiple components
 * This is a reusable utility for creating unique pattern identifiers
 */
export function createPatternKey(components: (string | undefined)[]): string {
  return components.map((component) => component || "unknown").join(":");
}

/**
 * Sorts pattern groups by count (most common first)
 * This is a reusable utility for pattern analysis
 */
export function sortPatternGroupsByCount<T>(
  groups: PatternGroup<T>[]
): PatternGroup<T>[] {
  return groups.sort((a, b) => b.count - a.count);
}

/**
 * Filters pattern groups by minimum count
 * This is a reusable utility for pattern filtering
 */
export function filterPatternGroupsByMinCount<T>(
  groups: PatternGroup<T>[],
  minCount: number
): PatternGroup<T>[] {
  return groups.filter((group) => group.count >= minCount);
}
