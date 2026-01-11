import { exportAllSamples } from './exportSamples';
import { buildGemmaDataset, buildLabeledDataset } from './datasetBuilder';
import { join } from 'path';

const OUTPUT_DIR = join(process.cwd(), 'outputs', 'training');

export async function prepareTrainingData(): Promise<void> {
  console.log('Exporting samples...');
  await exportAllSamples(OUTPUT_DIR);

  console.log('Building Gemma dataset...');
  const count = await buildGemmaDataset(join(OUTPUT_DIR, 'gemma-dataset.json'));
  console.log(`Built dataset with ${count} examples`);

  console.log('Building labeled datasets...');
  await buildLabeledDataset(OUTPUT_DIR);

  console.log('Training data preparation complete');
}

if (require.main === module) {
  prepareTrainingData().catch(console.error);
}
