import { resolve, relative } from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { scanProject } from '../lib/detector.js';
import { analyzeImpact, formatImpactReport } from '../lib/impact-analyzer.js';
import { error } from '../lib/display.js';

export interface ImpactOptions {
  depth?: number;
  format?: 'text' | 'json';
}

export async function impactCommand(filePath: string, options: ImpactOptions = {}): Promise<void> {
  const cwd = process.cwd();

  // Normalise file path: make it relative to project root
  const absPath = resolve(cwd, filePath);
  const relPath = relative(cwd, absPath).replace(/\\/g, '/');

  const spinner = ora('Scanning project for impact analysis...').start();

  try {
    const scan = await scanProject(cwd);
    spinner.stop();

    const totalFiles = scan.codeMetrics.totalFiles;
    const result = analyzeImpact(relPath, scan.importGraph, totalFiles);

    // Check if file was found in the graph
    if (
      result.directDependents.length === 0 &&
      result.directDependencies.length === 0 &&
      result.transitiveDependents.length === 0 &&
      result.targetFile === filePath
    ) {
      console.log('');
      console.log(chalk.yellow(`  File "${relPath}" was not found in the import graph.`));
      console.log(chalk.dim('  Make sure the file exists and is a .ts/.tsx/.js/.jsx source file.'));
      console.log(chalk.dim('  The file must have local imports or be imported by other files to appear.'));
      console.log('');
      return;
    }

    if (options.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatImpactReport(result));
    }
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
