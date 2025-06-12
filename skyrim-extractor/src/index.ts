import path from 'path';
import { promises as fs } from 'fs';
import * as E from 'fp-ts/lib/Either.js';
import { resolvePluginsFromModlist, loadEnabledPlugins } from './modlist.js';
import { readTES4Header, readRecords, summarizeFile } from './binary-reader.js';
import { parseRecord, hasHandler, RecordData } from './plugin/record-handlers/index.js';
import { RecordMeta } from './plugin/record-meta.js';

class ExtractorError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'ExtractorError';
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result: { modlistDir?: string; verbose?: boolean } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--modlist' && args[i + 1]) {
      result.modlistDir = args[i + 1];
      i++;
    } else if (args[i] === '--verbose') {
      result.verbose = true;
    }
  }
  return result;
}

async function validateDirectory(dirPath: string): Promise<void> {
  try {
    console.log('Checking if directory exists:', dirPath);
    const stats = await fs.stat(dirPath);
    console.log('Directory stats:', {
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      size: stats.size,
      mode: stats.mode
    });
    
    if (!stats.isDirectory()) {
      throw new ExtractorError(
        `Path is not a directory: ${dirPath}`,
        'INVALID_PATH_TYPE',
        { path: dirPath, type: stats.isFile() ? 'file' : 'unknown' }
      );
    }
  } catch (err) {
    if (err instanceof ExtractorError) {
      throw err;
    }
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ExtractorError(
        `Directory not found: ${dirPath}`,
        'DIRECTORY_NOT_FOUND',
        { path: dirPath }
      );
    }
    throw new ExtractorError(
      `Error accessing directory: ${dirPath}`,
      'DIRECTORY_ACCESS_ERROR',
      { path: dirPath, error: err }
    );
  }
}

async function validateModlistFile(modlistPath: string): Promise<void> {
  try {
    console.log('Validating modlist file:', modlistPath);
    const stats = await fs.stat(modlistPath);
    if (!stats.isFile()) {
      throw new ExtractorError(
        `Modlist path is not a file: ${modlistPath}`,
        'INVALID_MODLIST_TYPE',
        { path: modlistPath, type: stats.isDirectory() ? 'directory' : 'unknown' }
      );
    }
    
    const content = await fs.readFile(modlistPath, 'utf-8');
    if (!content.trim()) {
      throw new ExtractorError(
        'Modlist file is empty',
        'EMPTY_MODLIST',
        { path: modlistPath }
      );
    }
    
    const hasEnabledMods = content.split(/\r?\n/).some(line => line.trim().startsWith('+'));
    if (!hasEnabledMods) {
      throw new ExtractorError(
        'No enabled mods found in modlist',
        'NO_ENABLED_MODS',
        { path: modlistPath, content }
      );
    }
  } catch (err) {
    if (err instanceof ExtractorError) {
      throw err;
    }
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ExtractorError(
        `Modlist file not found: ${modlistPath}`,
        'MODLIST_NOT_FOUND',
        { path: modlistPath }
      );
    }
    throw new ExtractorError(
      `Error reading modlist file: ${modlistPath}`,
      'MODLIST_READ_ERROR',
      { path: modlistPath, error: err }
    );
  }
}

async function analyzePlugin(pluginPath: string, verbose: boolean = false): Promise<void> {
  try {
    console.log('\nAnalyzing plugin:', pluginPath);
    
    // Get file summary
    const summaryResult = await summarizeFile(pluginPath)();
    if (E.isLeft(summaryResult)) {
      throw new ExtractorError(
        `Failed to analyze plugin: ${summaryResult.left.message}`,
        'PLUGIN_ANALYSIS_ERROR',
        { path: pluginPath }
      );
    }

    const summary = summaryResult.right;
    console.log('\nPlugin Summary:');
    console.log('---------------');
    console.log('Author:', summary.header.author);
    console.log('Description:', summary.header.description);
    console.log('Version:', summary.header.version);
    console.log('Master Files:', summary.header.masterFiles.join(', '));
    console.log('\nRecord Statistics:');
    console.log('Total Records:', summary.totalRecords);
    console.log('Total Subrecords:', summary.totalSubrecords);
    console.log('File Size:', (summary.fileSize / 1024).toFixed(2), 'KB');
    console.log('\nRecord Types:');
    Object.entries(summary.recordCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .forEach(([type, count]) => {
        console.log(`${type}: ${count}`);
      });

    // Read and parse records
    const recordsResult = await readRecords(pluginPath)();
    if (E.isLeft(recordsResult)) {
      throw new ExtractorError(
        `Failed to read records: ${recordsResult.left.message}`,
        'RECORD_READ_ERROR',
        { path: pluginPath }
      );
    }

    const records = recordsResult.right;
    const parsedRecords: RecordMeta<RecordData>[] = [];
    let skippedRecords = 0;

    for (const record of records) {
      if (hasHandler(record.type)) {
        try {
          const meta: Omit<RecordMeta<RecordData>, 'parsed'> = {
            plugin: path.basename(pluginPath),
            loadOrder: summary.header.loadOrder,
            recordType: record.type,
            formId: record.formId.toString(16).padStart(8, '0'),
            fullFormId: record.formId.toString(16).padStart(8, '0'),
            uniqueId: `${path.basename(pluginPath)}|${record.formId.toString(16).padStart(8, '0')}`,
            winning: true, // TODO: Implement winning record logic
            rawOffset: record.offset
          };

          const parsed = parseRecord(record.type, record.data, meta);
          parsedRecords.push(parsed);

          if (verbose) {
            console.log(`\nParsed ${record.type} record:`);
            console.log('FormID:', parsed.formId);
            console.log('Editor ID:', (parsed.parsed as any).EDID);
          }
        } catch (err) {
          console.warn(`Failed to parse ${record.type} record at offset ${record.offset}:`, err);
          skippedRecords++;
        }
      } else {
        skippedRecords++;
      }
    }

    console.log('\nParsing Results:');
    console.log('----------------');
    console.log('Total Records:', records.length);
    console.log('Parsed Records:', parsedRecords.length);
    console.log('Skipped Records:', skippedRecords);

    // TODO: Write parsed records to output
    // For now, just log a sample if verbose
    if (verbose && parsedRecords.length > 0) {
      console.log('\nSample Parsed Record:');
      console.log(JSON.stringify(parsedRecords[0], null, 2));
    }

  } catch (err) {
    if (err instanceof ExtractorError) {
      throw err;
    }
    throw new ExtractorError(
      `Error analyzing plugin: ${pluginPath}`,
      'PLUGIN_ANALYSIS_ERROR',
      { path: pluginPath, error: err }
    );
  }
}

async function main() {
  try {
    const args = parseArgs();
    if (!args.modlistDir) {
      throw new ExtractorError(
        'Missing required --modlist argument',
        'MISSING_ARGUMENT',
        { usage: 'npm start -- --modlist <path-to-modlist-directory> [--verbose]' }
      );
    }

    console.log('Input modlist directory:', args.modlistDir);
    const modlistDir = path.resolve(args.modlistDir);
    console.log('Resolved modlist directory:', modlistDir);
    
    await validateDirectory(modlistDir);
    const modlistPath = path.join(modlistDir, 'modlist.txt');
    const pluginsTxtPath = path.join(modlistDir, 'plugins.txt');
    await validateModlistFile(modlistPath);
    // Optionally validate plugins.txt existence
    try {
      await fs.stat(pluginsTxtPath);
    } catch (err) {
      throw new ExtractorError(
        `plugins.txt not found: ${pluginsTxtPath}`,
        'PLUGINS_TXT_NOT_FOUND',
        { path: pluginsTxtPath }
      );
    }

    // Get enabled plugins from plugins.txt
    const enabledPluginsResult = await loadEnabledPlugins(pluginsTxtPath)();
    if (E.isLeft(enabledPluginsResult)) {
      throw new ExtractorError(
        `Failed to load enabled plugins: ${enabledPluginsResult.left.message}`,
        'PLUGINS_TXT_PARSE_ERROR',
        { pluginsTxtPath }
      );
    }
    const pluginNames = enabledPluginsResult.right;
    if (pluginNames.length === 0) {
      throw new ExtractorError(
        'No enabled plugins found in plugins.txt',
        'NO_ENABLED_PLUGINS',
        { pluginsTxtPath }
      );
    }
    console.log('Enabled plugins (in load order):', pluginNames);

    // Resolve plugin file paths using modlist
    const pluginsResult = await resolvePluginsFromModlist(modlistPath, pluginNames)();
    if (E.isLeft(pluginsResult)) {
      throw new ExtractorError(
        `Failed to resolve plugins: ${pluginsResult.left.message}`,
        'PLUGIN_RESOLUTION_ERROR',
        { modlistPath, pluginNames }
      );
    }
    const plugins = pluginsResult.right;
    console.log('Resolved plugins:', plugins);

    // Analyze each plugin in load order
    for (const plugin of plugins) {
      await analyzePlugin(plugin.fullPath, args.verbose);
    }
  } catch (err) {
    if (err instanceof ExtractorError) {
      console.error(`\nError (${err.code}): ${err.message}`);
      if (err.details) {
        console.error('Details:', JSON.stringify(err.details, null, 2));
      }
    } else {
      console.error('Unexpected error:', err);
    }
    process.exit(1);
  }
}

main(); 