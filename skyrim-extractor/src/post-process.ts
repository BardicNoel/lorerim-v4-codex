import { ParsedRecord } from "@lorerim/platform-types";

// Helper function to group records by a key
function groupBy<T>(
  array: T[],
  keySelector: (item: T) => string
): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keySelector(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

const resolveConflicts = (
  parsedRecords: Record<string, ParsedRecord[]>
): Record<string, ParsedRecord[]> => {
  // Create a single copy of the input dictionary
  const result = Object.fromEntries(
    Object.entries(parsedRecords).map(([type, records]) => [
      type,
      records.map((record) => ({
        ...record,
        meta: { ...record.meta },
      })),
    ])
  );

  // For each record type, look for duplicate formIds, mark the one with the lowest stackOrder as the winner
  for (const recordType in result) {
    const records = result[recordType];
    // group by formId
    const formIdGroups = groupBy(
      records,
      (record: ParsedRecord) => record.meta.formId
    );

    // for each formId group, mark the one with the lowest stackOrder as the winner
    for (const formId in formIdGroups) {
      const groupRecords = formIdGroups[formId];
      // Sort by stackOrder (highest is the winner)
      groupRecords.sort((a: ParsedRecord, b: ParsedRecord) => {
        const aOrder = a.meta.stackOrder ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.meta.stackOrder ?? Number.MAX_SAFE_INTEGER;
        return bOrder - aOrder;
      });

      // GroupRecords is in a stack order, the one at the top is last overwrite and winner
      // However, the one at the winner declares the globalFormId that should be used for reference everywhere
      const globalFormId = groupRecords[groupRecords.length - 1].meta.formId;
      groupRecords[0].meta.isWinner = true;
      groupRecords[0].meta.globalFormId = globalFormId;
      for (let i = 1; i < groupRecords.length; i++) {
        groupRecords[i].meta.isWinner = false;
        groupRecords[i].meta.globalFormId = globalFormId;
      }
    }
  }

  return result;
};

export { resolveConflicts as flagWinners };
