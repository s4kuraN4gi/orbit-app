import { execSync } from 'node:child_process';
import type { IssueProvider, ExternalIssue, IssueProviderOptions } from './types.js';

/** Parse owner/repo from a git remote URL */
function parseGitHubRemote(dir: string): { owner: string; repo: string } | null {
  try {
    const url = execSync('git remote get-url origin', { cwd: dir, encoding: 'utf-8' }).trim();
    // SSH: git@github.com:owner/repo.git
    const sshMatch = url.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
    if (sshMatch) return { owner: sshMatch[1], repo: sshMatch[2] };
    // HTTPS: https://github.com/owner/repo.git
    const httpsMatch = url.match(/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);
    if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2] };
    return null;
  } catch {
    return null;
  }
}

/** Check if `gh` CLI is available */
function hasGhCli(): boolean {
  try {
    execSync('gh --version', { encoding: 'utf-8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/** Fetch issues via `gh` CLI (faster, handles auth) */
function fetchViaGh(dir: string, limit: number): ExternalIssue[] {
  try {
    const json = execSync(
      `gh issue list --state open --limit ${limit} --json number,title,body,labels,url`,
      { cwd: dir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    );
    const issues = JSON.parse(json) as Array<{
      number: number;
      title: string;
      body: string;
      labels: Array<{ name: string }>;
      url: string;
    }>;
    return issues.map(i => ({
      number: i.number,
      title: i.title,
      body: i.body || undefined,
      labels: i.labels.map(l => l.name),
      state: 'open' as const,
      url: i.url,
      provider: 'github',
    }));
  } catch {
    return [];
  }
}

/** Fetch issues via GitHub REST API (no auth, public repos only) */
async function fetchViaApi(owner: string, repo: string, limit: number): Promise<ExternalIssue[]> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=${limit}&sort=updated`;
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return [];
    const data = await res.json() as Array<{
      number: number;
      title: string;
      body: string | null;
      labels: Array<{ name: string }>;
      html_url: string;
      pull_request?: unknown;
    }>;
    // Filter out pull requests (GitHub API returns PRs in /issues)
    return data
      .filter(i => !i.pull_request)
      .map(i => ({
        number: i.number,
        title: i.title,
        body: i.body || undefined,
        labels: i.labels.map(l => l.name),
        state: 'open' as const,
        url: i.html_url,
        provider: 'github',
      }));
  } catch {
    return [];
  }
}

export const GitHubIssueProvider: IssueProvider = {
  name: 'github',

  async detect(dir: string): Promise<boolean> {
    return parseGitHubRemote(dir) !== null;
  },

  async fetchIssues(dir: string, options?: IssueProviderOptions): Promise<ExternalIssue[]> {
    const limit = options?.limit ?? 20;
    const remote = parseGitHubRemote(dir);
    if (!remote) return [];

    // Prefer gh CLI if available (handles private repos)
    if (hasGhCli()) {
      return fetchViaGh(dir, limit);
    }

    // Fallback to REST API (public repos only)
    return fetchViaApi(remote.owner, remote.repo, limit);
  },
};
