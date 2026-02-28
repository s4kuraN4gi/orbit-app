import type { ExternalIssue } from './types.js';
import { GitHubIssueProvider } from './github.js';

const providers = [GitHubIssueProvider];

export async function fetchExternalIssues(dir: string): Promise<ExternalIssue[]> {
  for (const provider of providers) {
    if (await provider.detect(dir)) {
      return provider.fetchIssues(dir);
    }
  }
  return [];
}

export type { ExternalIssue, IssueProvider } from './types.js';
