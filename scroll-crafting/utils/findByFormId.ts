/**
 * Finds a record in a record set by its formId.
 * Searches through the meta.globalFormId field of each record.
 * 
 * @param records - Array of records to search through
 * @param formId - The formId to search for
 * @returns The matching record or null if not found
 */
export function findByFormId<T extends { meta?: { globalFormId?: string } }>(
  records: T[],
  formId: string
): T | null {
  if (!records || records.length === 0) {
    return null;
  }

  const normalizedFormId = formId.toLowerCase();
  
  return records.find(record => 
    record.meta?.globalFormId?.toLowerCase() === normalizedFormId
  ) || null;
} 