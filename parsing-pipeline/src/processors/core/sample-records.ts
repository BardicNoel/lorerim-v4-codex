import { JsonArray, SampleRecordsConfig, ProcessingResult } from '../../types/pipeline';

// Fisher-Yates shuffle algorithm for random sampling
function shuffleArray<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array];

  // Use seed for reproducible randomness if provided
  let random: () => number;
  if (seed !== undefined) {
    // Simple seeded random number generator
    let state = seed;
    random = () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  } else {
    random = Math.random;
  }

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function createSampleRecordsProcessor(config: SampleRecordsConfig) {
  const { sampleSize, method = 'random', seed } = config;

  let stats: ProcessingResult = {
    inputRecords: 0,
    outputRecords: 0,
    sampleSize: sampleSize,
    method: method === 'random' ? 1 : method === 'first' ? 2 : 3,
  };

  return {
    async transform(data: JsonArray): Promise<JsonArray> {
      stats.inputRecords = data.length;

      if (data.length <= sampleSize) {
        // If we have fewer records than requested, return all records
        stats.outputRecords = data.length;
        return data;
      }

      let sampledData: JsonArray;

      switch (method) {
        case 'first':
          sampledData = data.slice(0, sampleSize);
          break;
        case 'last':
          sampledData = data.slice(-sampleSize);
          break;
        case 'random':
        default:
          // Shuffle and take first sampleSize records
          const shuffled = shuffleArray(data, seed);
          sampledData = shuffled.slice(0, sampleSize);
          break;
      }

      stats.outputRecords = sampledData.length;
      return sampledData;
    },

    getStats(): ProcessingResult {
      return { ...stats };
    },
  };
}
