/**
 * Reusable classification utilities for determining uniqueness and patterns
 * This can be used across different projects for item classification
 */

export interface ClassificationResult {
  isUnique: boolean;
  uniquenessFactors: string[];
  confidence: number; // 0-1 scale indicating confidence in classification
}

export interface ClassificationRule<T> {
  name: string;
  check: (item: T, allItems: T[]) => boolean;
  weight: number; // How much this rule contributes to uniqueness
}

/**
 * Classifies items based on a set of rules
 * This is a reusable utility for item classification
 */
export function classifyItem<T>(
  item: T,
  allItems: T[],
  rules: ClassificationRule<T>[]
): ClassificationResult {
  const uniquenessFactors: string[] = [];
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const rule of rules) {
    totalWeight += rule.weight;

    if (rule.check(item, allItems)) {
      uniquenessFactors.push(rule.name);
      matchedWeight += rule.weight;
    }
  }

  const confidence = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  const isUnique = uniquenessFactors.length > 0;

  return {
    isUnique,
    uniquenessFactors,
    confidence,
  };
}

/**
 * Separates items into unique and pattern-based categories
 * This is a reusable utility for item separation
 */
export function separateUniqueAndPatternItems<T>(
  items: T[],
  rules: ClassificationRule<T>[]
): {
  uniqueItems: (T & { uniquenessFactors: string[] })[];
  patternItems: T[];
} {
  const uniqueItems: (T & { uniquenessFactors: string[] })[] = [];
  const patternItems: T[] = [];

  for (const item of items) {
    const classification = classifyItem(item, items, rules);

    if (classification.isUnique) {
      uniqueItems.push({
        ...item,
        uniquenessFactors: classification.uniquenessFactors,
      });
    } else {
      patternItems.push(item);
    }
  }

  return { uniqueItems, patternItems };
}

/**
 * Creates a rule for checking if an item has unusual stats
 * This is a reusable utility for statistical outlier detection
 */
export function createStatOutlierRule<T>(
  getValue: (item: T) => number,
  getCategory: (item: T) => string,
  threshold: number = 2
): ClassificationRule<T> {
  return {
    name: "Unusual stats",
    weight: 0.3,
    check: (item: T, allItems: T[]) => {
      const category = getCategory(item);
      const sameCategoryItems = allItems.filter(
        (i) => getCategory(i) === category
      );

      if (sameCategoryItems.length < 3) return false;

      const values = sameCategoryItems.map(getValue);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length;
      const stdDev = Math.sqrt(variance);

      const itemValue = getValue(item);
      return Math.abs(itemValue - mean) > threshold * stdDev;
    },
  };
}

/**
 * Creates a rule for checking if an item has a unique name
 * This is a reusable utility for name uniqueness detection
 */
export function createUniqueNameRule<T>(
  getName: (item: T) => string,
  knownPatterns: RegExp[],
  knownPrefixes: string[] = []
): ClassificationRule<T> {
  return {
    name: "Unique name",
    weight: 0.4,
    check: (item: T) => {
      const name = getName(item);
      const normalizedName = name.toLowerCase();

      // Check if name starts with known prefixes
      const hasKnownPrefix = knownPrefixes.some((prefix) =>
        normalizedName.startsWith(prefix.toLowerCase())
      );

      if (hasKnownPrefix) return false;

      // Check if name matches known patterns
      const matchesKnownPattern = knownPatterns.some((pattern) =>
        pattern.test(name)
      );

      return !matchesKnownPattern;
    },
  };
}

/**
 * Creates a rule for checking if an item has multiple effects
 * This is a reusable utility for effect multiplicity detection
 */
export function createMultipleEffectsRule<T>(
  getEffects: (item: T) => any[]
): ClassificationRule<T> {
  return {
    name: "Multiple effects",
    weight: 0.3,
    check: (item: T) => {
      const effects = getEffects(item);
      return effects.length > 1;
    },
  };
}

/**
 * Creates a rule for checking if an item has a unique property
 * This is a reusable utility for property uniqueness detection
 */
export function createUniquePropertyRule<T>(
  getProperty: (item: T) => string,
  allItems: T[],
  maxOccurrences: number = 3
): ClassificationRule<T> {
  return {
    name: "Unique property",
    weight: 0.2,
    check: (item: T, allItems: T[]) => {
      const property = getProperty(item);
      const occurrenceCount = allItems.filter(
        (i) => getProperty(i) === property
      ).length;
      return occurrenceCount <= maxOccurrences;
    },
  };
}

/**
 * Groups items by their uniqueness factors
 * This is a reusable utility for grouping by characteristics
 */
export function groupItemsByUniquenessFactors<
  T extends { uniquenessFactors: string[] },
>(uniqueItems: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of uniqueItems) {
    for (const factor of item.uniquenessFactors) {
      if (!groups.has(factor)) {
        groups.set(factor, []);
      }
      groups.get(factor)!.push(item);
    }
  }

  return groups;
}

/**
 * Calculates classification statistics
 * This is a reusable utility for classification analysis
 */
export function calculateClassificationStats<T>(
  items: T[],
  rules: ClassificationRule<T>[]
): {
  totalItems: number;
  uniqueItems: number;
  patternItems: number;
  uniquenessRate: number;
  factorDistribution: Map<string, number>;
} {
  const { uniqueItems, patternItems } = separateUniqueAndPatternItems(
    items,
    rules
  );

  const factorDistribution = new Map<string, number>();

  for (const item of uniqueItems) {
    for (const factor of item.uniquenessFactors) {
      factorDistribution.set(factor, (factorDistribution.get(factor) || 0) + 1);
    }
  }

  return {
    totalItems: items.length,
    uniqueItems: uniqueItems.length,
    patternItems: patternItems.length,
    uniquenessRate: items.length > 0 ? uniqueItems.length / items.length : 0,
    factorDistribution,
  };
}
