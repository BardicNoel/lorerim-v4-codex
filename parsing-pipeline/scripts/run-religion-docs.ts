import { loadPipelineConfig } from '../src/utils/yaml-loader';
import { runPipeline } from '../src/utils/pipeline-runner';
import * as path from 'path';

async function main() {
  const pipelineConfigPath = path.resolve(
    __dirname,
    '..',
    '..',
    'pipeline-projects',
    'religion',
    'religion-docs.yaml'
  );

  console.log('[RELIGION-DOCS] Starting religion documentation generation...');
  console.log(`[RELIGION-DOCS] Using pipeline config: ${pipelineConfigPath}`);

  try {
    // Load the pipeline configuration
    const pipelineConfig = loadPipelineConfig(pipelineConfigPath);

    // Run the pipeline
    await runPipeline(pipelineConfig);

    console.log('[RELIGION-DOCS] Religion documentation generation completed successfully!');
  } catch (error) {
    console.error('[RELIGION-DOCS] Error generating religion documentation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as runReligionDocs };
