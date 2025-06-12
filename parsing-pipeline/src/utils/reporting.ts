export interface Report {
    timestamp: string;
    processor: string;
    inputFile: string;
    outputFile: string;
    recordCount: number;
    duration: number;
    errors?: string[];
}

export function generateReport(report: Report): string {
    const lines = [
        `=== ${report.processor} Report ===`,
        `Timestamp: ${report.timestamp}`,
        `Input: ${report.inputFile}`,
        `Output: ${report.outputFile}`,
        `Records Processed: ${report.recordCount}`,
        `Duration: ${report.duration}ms`
    ];

    if (report.errors && report.errors.length > 0) {
        lines.push('\nErrors:');
        report.errors.forEach(error => lines.push(`- ${error}`));
    }

    return lines.join('\n');
} 