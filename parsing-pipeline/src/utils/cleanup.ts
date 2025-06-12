import * as fs from 'fs';
import * as path from 'path';

export interface CleanupOptions {
    directory: string;
    pattern: string;
    maxAge?: number; // in milliseconds
}

export function cleanupFiles(options: CleanupOptions): void {
    const { directory, pattern, maxAge } = options;
    
    if (!fs.existsSync(directory)) {
        return;
    }

    const files = fs.readdirSync(directory);
    const now = Date.now();

    files.forEach(file => {
        if (file.match(pattern)) {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);

            if (maxAge && (now - stats.mtimeMs) > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old file: ${file}`);
            }
        }
    });
} 