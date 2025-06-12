export type PipelineType = 'select-winners' | 'random-sampler' | 'trim' | 'cleanup';

export interface PipelineStep {
    type: PipelineType;
    description?: string;
    step_index: number;  // Required index for this step
    args?: {
        // Trim step arguments
        record_type?: string;
        profile?: string;
        remove_nulls?: boolean;
        // Random sampler arguments
        sample_size?: number;
        // Select winners arguments
        criteria?: Array<{
            field: string;
            value: string | number | boolean;
        }>;
    };
}

export interface PipelineConfig {
    name: string;
    description?: string;
    input_file: string;
    file_base: string;  // Base name for all output files
    overwrite?: boolean;  // Whether to overwrite existing output files
    steps: PipelineStep[];
}

// Validation function to ensure the configuration is valid
export function validatePipelineStep(step: PipelineStep): boolean {
    if (!step.type || !['select-winners', 'random-sampler', 'trim', 'cleanup'].includes(step.type)) {
        return false;
    }
    if (typeof step.step_index !== 'number' || step.step_index < 1) {
        return false;
    }
    return true;
}

export function validatePipelineConfig(config: PipelineConfig): boolean {
    if (!config.name || !config.input_file || !config.file_base || !Array.isArray(config.steps)) {
        return false;
    }
    // Check for duplicate step indices
    const stepIndices = new Set<number>();
    for (const step of config.steps) {
        if (stepIndices.has(step.step_index)) {
            return false;
        }
        stepIndices.add(step.step_index);
    }
    return config.steps.every(validatePipelineStep);
} 