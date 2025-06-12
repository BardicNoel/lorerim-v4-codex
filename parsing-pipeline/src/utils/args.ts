export interface PipelineArgs {
    inputFile: string;
    outputFile?: string;
    overwrite: boolean;
    removeNulls: boolean;
    sampleSize?: number;
    criteria?: string;
    recordType?: string;
    profile?: string;
}

export interface RequiredArgs {
    minArgs: number;
    maxArgs?: number;
    usage: string;
    script: 'select-winners' | 'random-sampler' | 'trim' | 'cleanup';
}

/**
 * Standardized argument parser for pipeline scripts
 * @param args Command line arguments
 * @param requiredArgs Configuration for required arguments
 * @returns Parsed arguments and remaining positional arguments
 */
export function parseArgs(args: string[], requiredArgs: RequiredArgs): { pipelineArgs: PipelineArgs; positionalArgs: string[] } {
    // Extract flags
    const overwrite = args.includes('--overwrite');
    const removeNulls = args.includes('--remove-nulls');
    
    // Extract named arguments
    const namedArgs = args.reduce((acc: { [key: string]: string }, arg: string, i: number) => {
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const value = args[i + 1];
            if (value && !value.startsWith('--')) {
                acc[key] = value;
            }
        }
        return acc;
    }, {});

    // Extract common arguments
    const inputFile = namedArgs.input;
    const outputFile = namedArgs.output;

    // Extract script-specific arguments
    let sampleSize: number | undefined;
    let criteria: string | undefined;
    let recordType: string | undefined;
    let profile: string | undefined;

    switch (requiredArgs.script) {
        case 'select-winners':
            criteria = namedArgs.criteria;
            break;
        case 'random-sampler':
            if (namedArgs.sampleSize) {
                sampleSize = parseInt(namedArgs.sampleSize);
                if (isNaN(sampleSize)) {
                    console.error('Sample size must be a number');
                    process.exit(1);
                }
            }
            break;
        case 'trim':
            recordType = namedArgs.type;
            profile = namedArgs.profile;
            break;
        case 'cleanup':
            // No additional arguments needed
            break;
    }

    // Validate required arguments
    if (!inputFile) {
        console.error('Missing required argument: --input');
        console.error(`Usage: ${requiredArgs.usage}`);
        process.exit(1);
    }

    if (!outputFile && requiredArgs.script !== 'cleanup') {
        console.error('Missing required argument: --output');
        console.error(`Usage: ${requiredArgs.usage}`);
        process.exit(1);
    }

    // Get remaining positional arguments (excluding named args and their values)
    const positionalArgs = args.filter((arg, i) => {
        if (arg.startsWith('--')) {
            const nextArg = args[i + 1];
            return !nextArg || nextArg.startsWith('--');
        }
        return !args[i - 1]?.startsWith('--');
    });

    return {
        pipelineArgs: {
            inputFile,
            outputFile,
            overwrite,
            removeNulls,
            sampleSize,
            criteria,
            recordType,
            profile
        },
        positionalArgs
    };
}

/**
 * Example usage for each script:
 * 
 * Select Winners:
 * ```typescript
 * const { pipelineArgs } = parseArgs(process.argv.slice(2), {
 *     minArgs: 0,
 *     maxArgs: 0,
 *     usage: 'npm run select-winners -- --input <inputFile> --output <outputFile> [--criteria <criteria>] [--overwrite]',
 *     script: 'select-winners'
 * });
 * ```
 * 
 * Random Sampler:
 * ```typescript
 * const { pipelineArgs } = parseArgs(process.argv.slice(2), {
 *     minArgs: 0,
 *     maxArgs: 0,
 *     usage: 'npm run random-sampler -- --input <inputFile> --output <outputFile> --sample-size <size> [--overwrite]',
 *     script: 'random-sampler'
 * });
 * ```
 * 
 * Trim:
 * ```typescript
 * const { pipelineArgs } = parseArgs(process.argv.slice(2), {
 *     minArgs: 0,
 *     maxArgs: 0,
 *     usage: 'npm run trim -- --input <inputFile> --type <recordType> --profile <profile> --output <outputFile> [--overwrite] [--remove-nulls]',
 *     script: 'trim'
 * });
 * ```
 * 
 * Cleanup:
 * ```typescript
 * const { pipelineArgs } = parseArgs(process.argv.slice(2), {
 *     minArgs: 0,
 *     maxArgs: 0,
 *     usage: 'npm run cleanup -- --input <inputFile> [--output <outputFile>] [--overwrite]',
 *     script: 'cleanup'
 * });
 * ```
 */ 