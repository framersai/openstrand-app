/**
 * GitHub Service
 *
 * Client-side service for GitHub integration including:
 * - OAuth authentication
 * - Repository operations
 * - Pull request creation for codex contributions
 * - Template fetching from framersai/codex
 *
 * @module services/github
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const GITHUB_API_BASE = 'https://api.github.com';
const CODEX_REPO = 'framersai/codex';
const CODEX_OWNER = 'framersai';
const CODEX_REPO_NAME = 'codex';
const TEMPLATES_PATH = 'templates';
const STRANDS_PATH = 'strands';

// ============================================================================
// TYPES
// ============================================================================

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  default_branch: string;
  fork: boolean;
  parent?: {
    full_name: string;
    default_branch: string;
  };
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
  };
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  content?: string;
  download_url?: string;
}

export interface GitHubPullRequest {
  number: number;
  html_url: string;
  title: string;
  state: 'open' | 'closed' | 'merged';
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
}

export interface CreatePROptions {
  title: string;
  body: string;
  head: string;
  base: string;
}

export interface CreateFileOptions {
  path: string;
  message: string;
  content: string;
  branch?: string;
  sha?: string; // Required for updates
}

export interface StrandTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  metadata: {
    title: string;
    tags: string[];
    strandType: string;
    difficulty?: string;
  };
}

// ============================================================================
// GITHUB SERVICE CLASS
// ============================================================================

export class GitHubService {
  private token: string | null = null;
  private user: GitHubUser | null = null;

  /**
   * Set the GitHub access token
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Clear the GitHub access token
   */
  clearToken() {
    this.token = null;
    this.user = null;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Get authenticated user
   */
  async getUser(): Promise<GitHubUser> {
    if (this.user) return this.user;

    const response = await this.request<GitHubUser>('/user');
    this.user = response;
    return response;
  }

  /**
   * Get repository info
   */
  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    return this.request<GitHubRepo>(`/repos/${owner}/${repo}`);
  }

  /**
   * Get user's fork of a repository (or create one)
   */
  async getOrCreateFork(
    owner: string,
    repo: string
  ): Promise<GitHubRepo> {
    const user = await this.getUser();

    // Check if fork exists
    try {
      const fork = await this.getRepo(user.login, repo);
      if (fork.fork && fork.parent?.full_name === `${owner}/${repo}`) {
        return fork;
      }
    } catch (error) {
      // Fork doesn't exist, create it
    }

    // Create fork
    const response = await this.request<GitHubRepo>(
      `/repos/${owner}/${repo}/forks`,
      {
        method: 'POST',
      }
    );

    // Wait for fork to be ready
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return response;
  }

  /**
   * Get branches for a repository
   */
  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    return this.request<GitHubBranch[]>(`/repos/${owner}/${repo}/branches`);
  }

  /**
   * Get or create a branch
   */
  async getOrCreateBranch(
    owner: string,
    repo: string,
    branchName: string,
    baseBranch: string = 'main'
  ): Promise<GitHubBranch> {
    // Check if branch exists
    try {
      const branch = await this.request<GitHubBranch>(
        `/repos/${owner}/${repo}/branches/${branchName}`
      );
      return branch;
    } catch (error) {
      // Branch doesn't exist, create it
    }

    // Get base branch SHA
    const baseBranchData = await this.request<GitHubBranch>(
      `/repos/${owner}/${repo}/branches/${baseBranch}`
    );

    // Create new branch
    await this.request(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseBranchData.commit.sha,
      }),
    });

    return {
      name: branchName,
      commit: { sha: baseBranchData.commit.sha },
    };
  }

  /**
   * Get file contents
   */
  async getFile(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubFile> {
    const params = ref ? `?ref=${ref}` : '';
    return this.request<GitHubFile>(
      `/repos/${owner}/${repo}/contents/${path}${params}`
    );
  }

  /**
   * Get directory contents
   */
  async getDirectory(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubFile[]> {
    const params = ref ? `?ref=${ref}` : '';
    return this.request<GitHubFile[]>(
      `/repos/${owner}/${repo}/contents/${path}${params}`
    );
  }

  /**
   * Create or update a file
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    options: CreateFileOptions
  ): Promise<{ commit: { sha: string }; content: GitHubFile }> {
    // Check if file exists to get SHA
    let sha: string | undefined = options.sha;
    if (!sha) {
      try {
        const existingFile = await this.getFile(
          owner,
          repo,
          options.path,
          options.branch
        );
        sha = existingFile.sha;
      } catch (error) {
        // File doesn't exist, that's fine
      }
    }

    const body: Record<string, unknown> = {
      message: options.message,
      content: btoa(unescape(encodeURIComponent(options.content))), // Base64 encode
      branch: options.branch,
    };

    if (sha) {
      body.sha = sha;
    }

    return this.request(`/repos/${owner}/${repo}/contents/${options.path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    owner: string,
    repo: string,
    options: CreatePROptions
  ): Promise<GitHubPullRequest> {
    return this.request<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Get open pull requests
   */
  async getPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<GitHubPullRequest[]> {
    return this.request<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?state=${state}`
    );
  }

  // ==========================================================================
  // CODEX SPECIFIC METHODS
  // ==========================================================================

  /**
   * Get templates from codex repository
   */
  async getCodexTemplates(): Promise<StrandTemplate[]> {
    try {
      const files = await this.getDirectory(
        CODEX_OWNER,
        CODEX_REPO_NAME,
        TEMPLATES_PATH
      );

      const templates: StrandTemplate[] = [];

      for (const file of files) {
        if (file.type === 'file' && file.name.endsWith('.md')) {
          try {
            const content = await this.getFileContent(
              CODEX_OWNER,
              CODEX_REPO_NAME,
              file.path
            );

            const template = this.parseTemplate(file.name, content);
            if (template) {
              templates.push(template);
            }
          } catch (error) {
            console.error(`Failed to parse template ${file.name}:`, error);
          }
        }
      }

      return templates;
    } catch (error) {
      console.error('Failed to fetch codex templates:', error);
      return [];
    }
  }

  /**
   * Get file content as string
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string
  ): Promise<string> {
    const file = await this.getFile(owner, repo, path);
    if (file.content) {
      return decodeURIComponent(escape(atob(file.content)));
    }
    if (file.download_url) {
      const response = await fetch(file.download_url);
      return response.text();
    }
    throw new Error('Unable to get file content');
  }

  /**
   * Publish strand to codex via PR
   */
  async publishToCodex(options: {
    title: string;
    slug: string;
    content: string;
    metadata: Record<string, unknown>;
    commitMessage: string;
  }): Promise<{ prUrl: string; prNumber: number }> {
    const user = await this.getUser();

    // 1. Get or create fork
    const fork = await this.getOrCreateFork(CODEX_OWNER, CODEX_REPO_NAME);

    // 2. Create branch
    const branchName = `strand/${options.slug}-${Date.now()}`;
    await this.getOrCreateBranch(
      user.login,
      CODEX_REPO_NAME,
      branchName,
      fork.default_branch
    );

    // 3. Build file content with frontmatter
    const fileContent = this.buildMarkdownWithFrontmatter(
      options.content,
      options.metadata
    );

    // 4. Create file in branch
    const filePath = `${STRANDS_PATH}/${options.slug}.md`;
    await this.createOrUpdateFile(user.login, CODEX_REPO_NAME, {
      path: filePath,
      message: options.commitMessage,
      content: fileContent,
      branch: branchName,
    });

    // 5. Create PR
    const pr = await this.createPullRequest(CODEX_OWNER, CODEX_REPO_NAME, {
      title: options.commitMessage,
      body: `## New Strand: ${options.title}

### Description
${options.metadata.summary || 'No description provided.'}

### Tags
${(options.metadata.tags as string[] || []).map((t) => `\`${t}\``).join(', ') || 'None'}

---
*This PR was created via OpenStrand Editor.*`,
      head: `${user.login}:${branchName}`,
      base: fork.default_branch,
    });

    return {
      prUrl: pr.html_url,
      prNumber: pr.number,
    };
  }

  /**
   * Get codex PR link for editing
   */
  getCodexPRLink(prNumber: number): string {
    return `https://github.com/${CODEX_REPO}/pull/${prNumber}`;
  }

  /**
   * Get codex file link
   */
  getCodexFileLink(slug: string, branch: string = 'main'): string {
    return `https://github.com/${CODEX_REPO}/blob/${branch}/${STRANDS_PATH}/${slug}.md`;
  }

  /**
   * Get codex edit link (opens GitHub editor)
   */
  getCodexEditLink(slug: string, branch: string = 'main'): string {
    return `https://github.com/${CODEX_REPO}/edit/${branch}/${STRANDS_PATH}/${slug}.md`;
  }

  /**
   * Get link to create new file in codex
   */
  getCodexNewFileLink(): string {
    return `https://github.com/${CODEX_REPO}/new/main/${STRANDS_PATH}`;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Parse template from markdown content
   */
  private parseTemplate(filename: string, content: string): StrandTemplate | null {
    const { frontmatter, body } = this.parseFrontmatter(content);

    if (!frontmatter.title) {
      return null;
    }

    return {
      id: filename.replace('.md', ''),
      name: frontmatter.title as string,
      description: (frontmatter.description as string) || '',
      category: (frontmatter.category as string) || 'general',
      content: body,
      metadata: {
        title: frontmatter.title as string,
        tags: (frontmatter.tags as string[]) || [],
        strandType: (frontmatter.strandType as string) || 'document',
        difficulty: frontmatter.difficulty as string,
      },
    };
  }

  /**
   * Parse YAML frontmatter from markdown
   */
  parseFrontmatter(content: string): {
    frontmatter: Record<string, unknown>;
    body: string;
  } {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!match) {
      return { frontmatter: {}, body: content };
    }

    const [, frontmatterStr, body] = match;
    const frontmatter: Record<string, unknown> = {};

    // Simple YAML parsing (for production, use a proper YAML library)
    frontmatterStr.split('\n').forEach((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value: unknown = line.substring(colonIndex + 1).trim();

        // Handle arrays
        if (value === '') {
          // Multi-line value, skip for now
          return;
        }
        if ((value as string).startsWith('[') && (value as string).endsWith(']')) {
          value = (value as string)
            .slice(1, -1)
            .split(',')
            .map((v) => v.trim().replace(/['"]/g, ''));
        }
        // Handle booleans
        else if (value === 'true') value = true;
        else if (value === 'false') value = false;
        // Handle numbers
        else if (!isNaN(Number(value))) value = Number(value);
        // Remove quotes
        else if (typeof value === 'string') {
          value = value.replace(/^['"]|['"]$/g, '');
        }

        frontmatter[key] = value;
      }
    });

    return { frontmatter, body: body.trim() };
  }

  /**
   * Build markdown with YAML frontmatter
   */
  buildMarkdownWithFrontmatter(
    content: string,
    metadata: Record<string, unknown>
  ): string {
    const frontmatterLines: string[] = ['---'];

    for (const [key, value] of Object.entries(metadata)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        frontmatterLines.push(`${key}: [${value.map((v) => `"${v}"`).join(', ')}]`);
      } else if (typeof value === 'string') {
        frontmatterLines.push(`${key}: "${value}"`);
      } else {
        frontmatterLines.push(`${key}: ${value}`);
      }
    }

    frontmatterLines.push('---');
    frontmatterLines.push('');
    frontmatterLines.push(content);

    return frontmatterLines.join('\n');
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `GitHub API error: ${response.status}`
      );
    }

    return response.json();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const githubService = new GitHubService();
export default githubService;

