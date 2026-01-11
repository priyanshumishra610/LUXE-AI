/**
 * File Writer
 * 
 * Writes generated files to outputs/ directory.
 * Handles directory creation and file writing.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export async function writeFileToOutput(
  relativePath: string,
  content: string
): Promise<void> {
  const outputPath = join(process.cwd(), 'outputs', 'latest', relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, 'utf-8');
}
