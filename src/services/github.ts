import { Octokit } from '@octokit/rest';

export interface CreateIssueParams {
  token: string;
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels?: string[];
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  labels: Array<{ name: string }>;
  user: { login: string } | null;
  assignees: Array<{ login: string }> | null;
  comments: number;
  created_at: string;
  closed_at: string | null;
  closed_by?: { login: string } | null;
}

export async function createIssue(params: CreateIssueParams): Promise<GitHubIssue> {
  const octokit = new Octokit({ auth: params.token });

  const { data } = await octokit.rest.issues.create({
    owner: params.owner,
    repo: params.repo,
    title: params.title,
    body: params.body,
    labels: params.labels?.filter(Boolean),
  });

  return data as GitHubIssue;
}

export async function getIssue(token: string, owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

  return data as GitHubIssue;
}

export async function listIssues(token: string, owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open', perPage = 10): Promise<GitHubIssue[]> {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state,
    per_page: perPage,
    sort: 'created',
    direction: 'desc',
  });

  return data as GitHubIssue[];
}

export async function searchIssues(token: string, owner: string, repo: string, query: string): Promise<GitHubIssue[]> {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.search.issuesAndPullRequests({
    q: `repo:${owner}/${repo} ${query} in:title is:issue`,
    per_page: 10,
    sort: 'created',
    order: 'desc',
  });

  return data.items as GitHubIssue[];
}

export async function verifyToken(token: string, owner: string, repo: string): Promise<boolean> {
  try {
    const octokit = new Octokit({ auth: token });
    await octokit.rest.repos.get({ owner, repo });
    return true;
  } catch {
    return false;
  }
}
