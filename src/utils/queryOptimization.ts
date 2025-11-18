export const QUERY_OPTIMIZATION_SETTINGS = {
  // Use batch processing for large operations
  BATCH_SIZE: 1000,
  
  // Connection pool settings
  POOL_SIZE: 10,
  
  // Index hints for common queries
  INDEXES: {
    USER_LIST: { userId: 1, addedAt: -1 },
    USER_CONTENT: { userId: 1, contentId: 1 },
    CONTENT_LOOKUP: { id: 1 },
  },
};

export async function batchProcess<T, R>(
  items: T[],
  processFn: (batch: T[]) => Promise<R[]>,
  batchSize: number = QUERY_OPTIMIZATION_SETTINGS.BATCH_SIZE
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processFn(batch);
    results.push(...batchResults);
  }

  return results;
}
