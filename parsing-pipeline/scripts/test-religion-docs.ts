import { createReligionDocsGenerator } from '../src/processors/doc-gen/religion-docs';
import * as fs from 'fs';
import * as path from 'path';

async function testReligionDocs() {
  console.log('[TEST] Testing religion documentation generation...');

  try {
    // Load test data
    const testDataPath = path.resolve(
      __dirname,
      '..',
      '..',
      'pipeline-projects',
      'religion',
      'wintersun-qust.json'
    );
    const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

    console.log(`[TEST] Loaded test data with ${testData.length} records`);

    // Create generator
    const generator = createReligionDocsGenerator({
      name: 'Test Religion Docs',
      type: 'doc-gen',
      docType: 'religion-docs',
      configFile: 'religion-docs-config.yaml',
    });

    // Generate documentation
    const result = await generator.generate(testData, {
      configFile: 'religion-docs-config.yaml',
    });

    console.log(`[TEST] Generated documentation with ${result.length} sections`);

    // Get stats
    const stats = generator.getStats();
    console.log('[TEST] Processing statistics:', stats);

    // Write test output
    const outputPath = path.resolve(
      __dirname,
      '..',
      '..',
      'pipeline-projects',
      'religion',
      'test-religion-output.json'
    );
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`[TEST] Wrote test output to: ${outputPath}`);

    console.log('[TEST] Religion documentation generation test completed successfully!');
  } catch (error) {
    console.error('[TEST] Error testing religion documentation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testReligionDocs();
}

export { testReligionDocs };
