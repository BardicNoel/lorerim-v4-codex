import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PipelineConfig, StageConfig, StageType } from '../types/pipeline';

// Cache for loaded YAML files
const fileCache = new Map<string, any>();

/**
 * Reads a file and returns its contents as a string
 */
function readFile(filePath: string): string {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  console.log(`\n[DEBUG] Reading file: ${filePath}`);
  const content = readFileSync(filePath, 'utf8');
  console.log(`[DEBUG] File content length: ${content.length} bytes`);
  return content;
}

/**
 * Loads a YAML file and caches the result
 */
function loadYamlFile(filePath: string, visited: Set<string> = new Set()): any {
  const absolutePath = path.resolve(filePath);
  console.log(`[DEBUG] Loading YAML file: ${absolutePath}`);

  // Check cache first
  if (fileCache.has(absolutePath)) {
    console.log(`[DEBUG] Using cached result for: ${absolutePath}`);
    return fileCache.get(absolutePath);
  }

  // Check for circular includes
  if (visited.has(absolutePath)) {
    throw new Error(`Circular include detected for ${absolutePath}`);
  }
  visited.add(absolutePath);

  const content = readFile(absolutePath);
  const result = yaml.load(content);
  console.log(`[DEBUG] Loaded YAML:`, JSON.stringify(result, null, 2));

  // Cache the result
  fileCache.set(absolutePath, result);
  return result;
}

/**
 * Validates a stage configuration
 */
function validateStage(stage: any): StageConfig {
  if (!stage.type || !stage.name) {
    throw new Error('Stage must have type and name');
  }

  // Validate stage type
  if (
    ![
      'filter-records',
      'remove-fields',
      'keep-fields',
      'sanitize-fields',
      'buffer-decoder',
      'flatten-fields',
      'merge-records',
      'rename-fields',
      'sample-records',
    ].includes(stage.type)
  ) {
    throw new Error(`Invalid stage type: ${stage.type}`);
  }

  // Validate required fields based on type
  switch (stage.type) {
    case 'filter-records':
      if (!stage.criteria) {
        throw new Error('Filter records stage must have criteria');
      }
      break;
    case 'remove-fields':
      if (!stage.fields && !stage.remove_fields) {
        throw new Error('Remove fields stage must have fields or remove_fields');
      }
      break;
    case 'keep-fields':
      if (!stage.fields) {
        throw new Error('Keep fields stage must have fields');
      }
      break;
    case 'sanitize-fields':
      if (!stage.rules) {
        throw new Error('Sanitize fields stage must have rules');
      }
      break;
    case 'buffer-decoder':
      if (!stage.recordType) {
        throw new Error('Buffer decoder stage must have recordType');
      }
      break;
    case 'flatten-fields':
      if (!stage.fields) {
        throw new Error('Flatten fields stage must have fields');
      }
      break;
    case 'merge-records':
      if (!stage.sourceFile) {
        throw new Error('Merge records stage must have sourceFile');
      }
      if (!stage.sourceRecordType) {
        throw new Error('Merge records stage must have sourceRecordType');
      }
      if (!stage.mappings) {
        throw new Error('Merge records stage must have mappings');
      }
      if (!stage.mergeField) {
        throw new Error('Merge records stage must have mergeField');
      }
      if (!stage.mergeStrategy) {
        throw new Error('Merge records stage must have mergeStrategy');
      }
      break;
    case 'rename-fields':
      if (!stage.mappings) {
        throw new Error('Rename fields stage must have mappings');
      }
      break;
    case 'sample-records':
      if (!stage.sampleSize) {
        throw new Error('Sample records stage must have sampleSize');
      }
      if (typeof stage.sampleSize !== 'number' || stage.sampleSize <= 0) {
        throw new Error('Sample records stage sampleSize must be a positive number');
      }
      break;
  }

  return stage as StageConfig;
}

/**
 * Resolves a stage configuration, handling references recursively
 */
function resolveStage(stage: any, basePath: string, visited: Set<string>): StageConfig {
  console.log(`[DEBUG] Resolving stage:`, stage);

  // Handle reference stages
  if (stage.from === 'ref') {
    if (!stage.file || !stage.ref) {
      throw new Error('Reference stage must specify both file and ref');
    }

    // Load the referenced file - paths are relative to parsing-pipeline directory
    const filePath = path.resolve(process.cwd(), stage.file);
    const fileContent = loadYamlFile(filePath, visited);

    // Get the referenced value
    const refValue = fileContent.stages[stage.ref];
    if (!refValue) {
      throw new Error(`Stage not found: ${stage.ref} in ${stage.file}`);
    }

    // Validate and return the referenced stage
    return validateStage(refValue);
  }

  // Local stage, validate and return
  return validateStage(stage);
}

/**
 * Loads a pipeline configuration file with validation
 */
export function loadPipelineConfig(configPath: string): PipelineConfig {
  console.log(`\n[DEBUG] ===== Starting Pipeline Config Load =====`);
  console.log(`[DEBUG] Config path: ${configPath}`);

  // Clear the cache for each new pipeline load
  fileCache.clear();
  console.log(`[DEBUG] Cleared file cache`);

  // Resolve the full path to the config file
  const fullConfigPath = path.resolve(process.cwd(), configPath);
  console.log(`[DEBUG] Full config path: ${fullConfigPath}`);

  // Load the base configuration
  const config = loadYamlFile(fullConfigPath) as PipelineConfig;
  console.log(`[DEBUG] Base config:`, JSON.stringify(config, null, 2));

  // Resolve all stages
  const resolvedStages = config.stages.map((stage) =>
    resolveStage(stage, fullConfigPath, new Set())
  );
  console.log(`[DEBUG] Resolved stages:`, JSON.stringify(resolvedStages, null, 2));

  // Create final config with resolved stages
  const finalConfig = {
    ...config,
    stages: resolvedStages,
  };

  // Validate pipeline configuration
  if (!finalConfig.name || !finalConfig.input || !finalConfig.output || !finalConfig.stages) {
    throw new Error('Invalid pipeline configuration: missing required fields');
  }

  console.log(`[DEBUG] ===== Pipeline Config Load Complete =====\n`);
  return finalConfig;
}
