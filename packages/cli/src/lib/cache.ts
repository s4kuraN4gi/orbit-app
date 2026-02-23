import { readFile, writeFile, mkdir, readdir, unlink, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { ScanResult } from './detector.js';
import type { ContextIR } from './context-ir.js';

const CACHE_DIR = join(homedir(), '.orbit', 'cache');
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CacheEntry {
  scan: ScanResult;
  ir: ContextIR;
  timestamp: number;
}

function cacheKey(projectDir: string): string {
  return createHash('sha256').update(projectDir).digest('hex').slice(0, 16);
}

function cachePath(projectDir: string): string {
  return join(CACHE_DIR, `${cacheKey(projectDir)}.json`);
}

export class ScanCache {
  async get(projectDir: string): Promise<CacheEntry | null> {
    try {
      const raw = await readFile(cachePath(projectDir), 'utf-8');
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.timestamp > TTL_MS) {
        return null;
      }
      return entry;
    } catch {
      return null;
    }
  }

  async set(projectDir: string, scan: ScanResult, ir: ContextIR): Promise<void> {
    try {
      await mkdir(CACHE_DIR, { recursive: true });
      const entry: CacheEntry = { scan, ir, timestamp: Date.now() };
      await writeFile(cachePath(projectDir), JSON.stringify(entry), 'utf-8');
    } catch {
      // Cache write failure is non-fatal
    }
  }

  async invalidate(projectDir: string): Promise<void> {
    try {
      await unlink(cachePath(projectDir));
    } catch {
      // File may not exist
    }
  }

  async prune(): Promise<void> {
    try {
      const files = await readdir(CACHE_DIR);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const path = join(CACHE_DIR, file);
        try {
          const info = await stat(path);
          if (Date.now() - info.mtimeMs > TTL_MS) {
            await unlink(path);
          }
        } catch {
          // Skip files that can't be stat'd
        }
      }
    } catch {
      // Cache dir may not exist
    }
  }
}
