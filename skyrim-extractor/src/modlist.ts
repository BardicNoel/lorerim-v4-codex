import { promises as fs } from 'fs';
import type { Stats } from 'node:fs';
import * as path from 'path';
import { pipe, flow } from 'fp-ts/lib/function.js';
import * as E from 'fp-ts/lib/Either.js';
import * as A from 'fp-ts/lib/Array.js';
import * as O from 'fp-ts/lib/Option.js';
import * as TE from 'fp-ts/lib/TaskEither.js';

export interface ModlistEntry {
  filename: string;
  loadOrder: number;
  fullPath: string;
  modFolder: string;
}

// Types for our domain
interface ModlistContent {
  path: string;
  content: string;
}

interface EnabledMod {
  name: string;
  folder: string;
}

interface PluginSearch {
  filename: string;
  loadOrder: number;
}

// Pure functions for parsing
const parseModlistLines = (content: string): string[] =>
  content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('+'))
    .map(line => line.slice(1));

const validateModlistContent = (content: string): E.Either<Error, string> =>
  content.trim() === ''
    ? E.left(new Error('Modlist file is empty'))
    : E.right(content);

const validateEnabledMods = (mods: string[]): E.Either<Error, string[]> =>
  mods.length === 0
    ? E.left(new Error('No enabled mods found in modlist'))
    : E.right(mods);

// File system operations wrapped in TaskEither
const readFile = (filePath: string): TE.TaskEither<Error, string> =>
  TE.tryCatch(
    () => fs.readFile(filePath, 'utf-8'),
    (err: unknown) => new Error(`Failed to read file: ${filePath}`)
  );

const statFile = (filePath: string): TE.TaskEither<Error, Stats> =>
  TE.tryCatch(
    () => fs.stat(filePath),
    (err: unknown) => new Error(`Failed to stat file: ${filePath}`)
  );

const readDir = (dirPath: string): TE.TaskEither<Error, string[]> =>
  TE.tryCatch(
    () => fs.readdir(dirPath),
    (err: unknown) => new Error(`Failed to read directory: ${dirPath}`)
  );

// Business logic functions
const findPluginInMod = (
  root: string,
  modName: string,
  pluginName: string
): TE.TaskEither<Error, O.Option<ModlistEntry>> =>
  pipe(
    TE.Do,
    TE.bind('modPath', () => TE.right(path.join(root, modName))),
    TE.bind('stats', ({ modPath }: { modPath: string }) => statFile(modPath)),
    TE.chain(({ modPath, stats }) =>
      !stats.isDirectory()
        ? TE.right(O.none)
        : pipe(
            readDir(modPath),
            TE.map(files =>
              O.fromNullable(
                files.find(file => file.toLowerCase() === pluginName.toLowerCase())
              )
            ),
            TE.map(O.map(file => ({
              filename: pluginName,
              loadOrder: 0, // Will be set by caller
              fullPath: path.join(modPath, file),
              modFolder: modName
            })))
          )
    )
  );

/**
 * Parse MO2-style modlist.txt, returning an ordered array of enabled mod folder names.
 */
export const loadEnabledMods = (modlistPath: string): TE.TaskEither<Error, string[]> =>
  pipe(
    TE.Do,
    TE.bind('stats', () => 
      pipe(
        statFile(modlistPath),
        TE.mapLeft(err => new Error(`Failed to read file: ${modlistPath}`))
      )
    ),
    TE.chain(({ stats }) =>
      !stats.isFile()
        ? TE.left(new Error(`Path is not a file: ${modlistPath}`))
        : TE.right(stats)
    ),
    TE.chain(() => 
      pipe(
        readFile(modlistPath),
        TE.mapLeft(err => new Error(`Failed to read file: ${modlistPath}`))
      )
    ),
    TE.chain(content => TE.fromEither(validateModlistContent(content))),
    TE.map(parseModlistLines),
    TE.chain(mods => TE.fromEither(validateEnabledMods(mods)))
  );

/**
 * For each plugin, search enabled mod folders in order and return the first match found.
 * Returns Left if any plugin is not found in any enabled mod folder.
 */
export const resolvePluginsFromModlist = (
  modlistPath: string,
  pluginNames: string[]
): TE.TaskEither<Error, ModlistEntry[]> =>
  pipe(
    TE.Do,
    TE.bind('root', () => TE.right(path.dirname(modlistPath))),
    TE.bind('enabledMods', () => loadEnabledMods(modlistPath)),
    TE.chain(({ root, enabledMods }) =>
      pipe(
        pluginNames,
        A.mapWithIndex((loadOrder, filename) => ({ filename, loadOrder })),
        A.map(plugin =>
          pipe(
            enabledMods.map(name => ({ name, folder: name })),
            A.reduce<EnabledMod, TE.TaskEither<Error, O.Option<ModlistEntry>>>(
              TE.right(O.none),
              (acc, mod) =>
                pipe(
                  acc,
                  TE.chain(found =>
                    O.isSome(found)
                      ? TE.right(found)
                      : findPluginInMod(root, mod.name, plugin.filename)
                  )
                )
            ),
            TE.map(O.map(entry => ({ ...entry, loadOrder: plugin.loadOrder })))
          )
        ),
        A.sequence(TE.ApplicativePar),
        TE.chain(results =>
          pipe(
            results,
            A.map(O.toNullable),
            A.filter((entry): entry is ModlistEntry => entry !== null),
            entries =>
              entries.length === pluginNames.length
                ? TE.right(entries)
                : TE.left(
                    new Error(
                      `Some plugins not found: ${pluginNames
                        .filter(
                          name =>
                            !entries.some(entry => entry.filename === name)
                        )
                        .join(', ')}`
                    )
                  )
          )
        )
      )
    )
  );

/**
 * Parse MO2-style plugins.txt, returning an ordered array of enabled plugin filenames.
 */
export const loadEnabledPlugins = (pluginsTxtPath: string): TE.TaskEither<Error, string[]> =>
  pipe(
    readFile(pluginsTxtPath),
    TE.map(content =>
      content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.startsWith('*'))
        .map(line => line.slice(1))
        .filter(line => !!line)
    )
  ); 