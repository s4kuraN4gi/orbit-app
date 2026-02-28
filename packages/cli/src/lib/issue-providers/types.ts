export interface ExternalIssue {
  number: number;
  title: string;
  body?: string;
  labels: string[];
  state: 'open' | 'closed';
  url: string;
  provider: string;
}

export interface IssueProviderOptions {
  limit?: number;
  state?: 'open' | 'closed' | 'all';
}

export interface IssueProvider {
  name: string;
  detect(dir: string): Promise<boolean>;
  fetchIssues(dir: string, options?: IssueProviderOptions): Promise<ExternalIssue[]>;
}
