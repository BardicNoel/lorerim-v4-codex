import {
  formatFormId,
  ParsedRecord,
  PluginMeta,
  resolveGlobalFromReference,
} from "@lorerim/platform-types";

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

// // For each record type, look for duplicate formIds, mark the one with the lowest stackOrder as the winner
// for (const recordType in newDict) {
//   const records = newDict[recordType];
//   // group by formId
//   const formIdGroups = groupBy(
//     records,
//     (record: ParsedRecord) => record.meta.formId
//   );

//   // for each formId group, mark the one with the lowest stackOrder as the winner
//   for (const formId in formIdGroups) {
//     const groupRecords = formIdGroups[formId];
//     // Sort by stackOrder (highest is the winner)
//     groupRecords.sort((a: ParsedRecord, b: ParsedRecord) => {
//       const aOrder = a.meta.stackOrder ?? Number.MAX_SAFE_INTEGER;
//       const bOrder = b.meta.stackOrder ?? Number.MAX_SAFE_INTEGER;
//       return bOrder - aOrder;
//     });

//     const shouldLog =
//       recordType === "PERK" &&
//       groupRecords.find(
//         (r) => r.meta.plugin.toLowerCase() === "lorerim - weaponmaster.esp"
//       );
//     if (shouldLog) {
//       console.log("PERK GROUP");
//       console.table(
//         groupRecords.map((r) => ({
//           plugin: r.meta.plugin,
//           formId: r.meta.formId,
//           globalFormId: r.meta.globalFormId,
//         }))
//       );
//     }

//     // GroupRecords is in a stack order, the one at the top is last overwrite and winner
//     // However, the one at the winner declares the globalFormId that should be used for reference everywhere

//     const resolvedGlobalFormID =
//       groupRecords[groupRecords.length - 1].meta.globalFormId;

//     groupRecords[0].meta.isWinner = true;
//     groupRecords[0].meta.globalFormId = resolvedGlobalFormID;

//     if (shouldLog) {
//       console.log("Resolved Global FormId", resolvedGlobalFormID);
//     }

//     for (let i = 1; i < groupRecords.length; i++) {
//       groupRecords[i].meta.isWinner = false;
//       groupRecords[i].meta.globalFormId = resolvedGlobalFormID;
//     }
//   }

const resolveConflicts = (
  parsedRecords: Record<string, ParsedRecord[]>,
  pluginRegistry: Record<string, PluginMeta>
): Record<string, ParsedRecord[]> => {
  // Create a single copy of the input dictionary
  const newDict = Object.fromEntries(
    Object.entries(parsedRecords).map(([type, records]) => [
      type,
      records.map((record) => ({
        ...record,
      })),
    ])
  );

  // Grouping by FormID is fundamentally flawed. We need to group by globalFormId
  // GlobalFormIds are defined by where the record is DEFINED and the load order of that
  // once we have globalFormIds, we can group on GLOBALS and set winners

  // Iterate over each record
  for (const recordType in newDict) {
    const records = newDict[recordType];
    console.log(
      "Resolving globalFormIds and winners for",
      recordType,
      `(${records.length}) records`
    );
    const totalRecords = records.length;
    let lastLoggedPercent = -1;
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      // Progress indicator: log every 10% or every 1000 records
      const percent = Math.floor((i / totalRecords) * 100);
      if (
        (percent > lastLoggedPercent && percent % 10 === 0) ||
        i % 1000 === 0
      ) {
        console.log(
          `${recordType} progress: ${percent}% (${i}/${totalRecords})`
        );
        lastLoggedPercent = percent;
      }
      const formIdNumeric = parseInt(record.meta.formId, 16);
      const globalFormId = resolveGlobalFromReference(
        formIdNumeric,
        pluginRegistry[record.meta.plugin],
        pluginRegistry
      );
      if (globalFormId) {
        record.meta.globalFormId = formatFormId(globalFormId);
      }
      // Group by globalFormId
      const globalFormIdGroups = groupBy(
        records,
        (record: ParsedRecord) => record.meta.globalFormId
      );

      for (const globalFormId in globalFormIdGroups) {
        const groupRecords = globalFormIdGroups[globalFormId];
        // Sort by stackOrder (highest is the winner)
        groupRecords.sort((a: ParsedRecord, b: ParsedRecord) => {
          const aOrder = a.meta.stackOrder ?? Number.MAX_SAFE_INTEGER;
          const bOrder = b.meta.stackOrder ?? Number.MAX_SAFE_INTEGER;
          return bOrder - aOrder;
        });

        // Set the isWinner flag to the one with the lowest stackOrder
        groupRecords[0].meta.isWinner = true;
        for (let i = 1; i < groupRecords.length; i++) {
          groupRecords[i].meta.isWinner = false;
        }
      }
    }
  }

  // For each globalFormId group, set the globalFormId to the one with the lowest stackOrder

  return newDict;
};

export { resolveConflicts as flagWinners };
