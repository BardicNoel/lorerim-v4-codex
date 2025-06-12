# Skyrim Plugin Binary Reading Primer

## TES4 Header Parsing (Functional Approach)

The TES4 header is the first record in every Skyrim ESP/ESM file. It contains metadata about the plugin, such as version, author, description, and master files. Our loader uses a functional programming approach to parse this header:

- **Pure Functions**: All parsing logic is implemented as pure functions, with no mutation or side effects.
- **fp-ts Combinators**: We use `fp-ts`'s `Either` and `TaskEither` to handle errors and asynchronous effects in a composable way.
- **Subrecord Extraction**: The subrecords within the TES4 header are parsed recursively using a pure function that accumulates results in an immutable object.

### Example: TES4 Header Parsing

```ts
/**
 * Reads the TES4 header from a Skyrim ESP/ESM file.
 * Extracts version, author, description, and master files from subrecords.
 * @param filePath Path to the plugin file
 * @returns TaskEither<Error, TES4Header>
 */
export const readTES4Header = (filePath: string): TE.TaskEither<Error, TES4Header> =>
  pipe(
    TE.tryCatch(
      () => fs.readFile(filePath),
      (err) => new Error(`Failed to read file: ${filePath}`)
    ),
    TE.chain(buffer => {
      // ...
      const parseSubrecords = (buf: Buffer, offset: number, acc: any): any => {
        if (offset >= buf.length) return acc;
        const subE = readSubrecord(buf, offset);
        if (E.isLeft(subE)) return acc;
        const { subrecord, newOffset } = subE.right;
        let nextAcc = { ...acc };
        switch (subrecord.type) {
          case 'HEDR':
            nextAcc.version = subrecord.data.readFloatLE(0);
            break;
          case 'CNAM':
            nextAcc.author = readString(subrecord.data, 0, subrecord.size);
            break;
          case 'SNAM':
            nextAcc.description = readString(subrecord.data, 0, subrecord.size);
            break;
          case 'MAST':
            nextAcc.masterFiles = [...(nextAcc.masterFiles || []), readString(subrecord.data, 0, subrecord.size)];
            break;
        }
        return parseSubrecords(buf, newOffset, nextAcc);
      };
      // ...
    })
  );
```

### Benefits
- **Immutability**: No mutable state is used; all accumulations are done by returning new objects.
- **Composability**: Error handling and async effects are composed using `fp-ts`.
- **Testability**: Pure functions are easy to test in isolation.

See the implementation in `src/binary-reader.ts` for details.

