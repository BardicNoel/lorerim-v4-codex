import * as fs from 'fs';
import * as path from 'path';

export interface OutputOptions {
    inputPath: string;
    defaultSuffix: string;
    customOutputPath?: string;
    ensureDirectory?: boolean;
    overwrite?: boolean;  // Whether to overwrite existing files
}

export class OutputManager {
    private readonly inputPath: string;
    private readonly defaultSuffix: string;
    private readonly customOutputPath?: string;
    private readonly ensureDirectory: boolean;
    private readonly overwrite: boolean;

    constructor(options: OutputOptions) {
        this.inputPath = options.inputPath;
        this.defaultSuffix = options.defaultSuffix;
        this.customOutputPath = options.customOutputPath;
        this.ensureDirectory = options.ensureDirectory ?? true;
        this.overwrite = options.overwrite ?? false;
    }

    private generateDefaultOutputPath(): string {
        const inputName = path.basename(this.inputPath, '.json');
        const inputDir = path.dirname(this.inputPath);
        return path.join(inputDir, `${inputName}${this.defaultSuffix}`);
    }

    public getOutputPath(): string {
        if (this.customOutputPath) {
            return this.customOutputPath;
        }
        return this.generateDefaultOutputPath();
    }

    public ensureOutputDirectory(): void {
        if (!this.ensureDirectory) return;

        const outputDir = path.dirname(this.getOutputPath());
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    }

    public writeOutput(data: any, pretty: boolean = true): void {
        console.log('\n=== OutputManager.writeOutput ===');
        console.log('Ensuring output directory exists...');
        this.ensureOutputDirectory();
        
        const outputPath = this.getOutputPath();
        console.log('Output path:', outputPath);
        
        try {
            console.log('Converting data to JSON...');
            const content = pretty 
                ? JSON.stringify(data, null, 2)
                : JSON.stringify(data);
            console.log(`JSON string length: ${content.length} characters`);

            console.log('Writing file...');
            fs.writeFileSync(outputPath, content);
            
            // Verify the file was written
            if (fs.existsSync(outputPath)) {
                const stats = fs.statSync(outputPath);
                console.log(`File written successfully. Size: ${stats.size} bytes`);
            } else {
                throw new Error('File was not created after writeFileSync');
            }
        } catch (error) {
            console.error('Error writing file:', error instanceof Error ? error.message : String(error));
            if (error instanceof Error && error.stack) {
                console.error('Stack trace:', error.stack);
            }
            throw error;
        }
    }

    public validateOutputPath(): boolean {
        console.log('\n=== OutputManager.validateOutputPath ===');
        const outputPath = this.getOutputPath();
        console.log('Output path:', outputPath);
        
        // Check if file already exists
        if (fs.existsSync(outputPath)) {
            if (!this.overwrite) {
                console.error(`Error: Output file already exists at ${outputPath}`);
                return false;
            }
            console.log(`Warning: Overwriting existing file at ${outputPath}`);
        }

        // Check if directory is writable
        const outputDir = path.dirname(outputPath);
        console.log('Output directory:', outputDir);
        try {
            console.log('Checking directory permissions...');
            fs.accessSync(outputDir, fs.constants.W_OK);
            console.log('Directory is writable');
        } catch (error) {
            console.error(`Error: Cannot write to directory ${outputDir}`);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            return false;
        }

        return true;
    }
} 