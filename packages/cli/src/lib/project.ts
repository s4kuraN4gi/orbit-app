import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { OrbitProjectLink } from '../types.js';
import { ProjectError } from './errors.js';

const LINK_FILE = '.orbit.json';

/**
 * Find .orbit.json by walking up from cwd.
 * Returns the parsed link, or throws ProjectError.
 */
export async function getProjectLink(): Promise<OrbitProjectLink> {
  let dir = process.cwd();
  const root = '/';

  while (true) {
    const filePath = join(dir, LINK_FILE);
    if (existsSync(filePath)) {
      const raw = await readFile(filePath, 'utf-8');
      return JSON.parse(raw) as OrbitProjectLink;
    }
    const parent = join(dir, '..');
    if (parent === dir || dir === root) break;
    dir = parent;
  }

  throw new ProjectError();
}

/**
 * Save .orbit.json in the given directory.
 */
export async function saveProjectLink(dir: string, link: OrbitProjectLink): Promise<string> {
  const filePath = join(dir, LINK_FILE);
  await writeFile(filePath, JSON.stringify(link, null, 2) + '\n');
  return filePath;
}
