import brand from '@common/brand/config'

const DEFAULT_GITHUB_OWNER = 'remoteit'
const DEFAULT_GITHUB_REPO = 'desktop'

export interface GitHubRepo {
  owner: string
  repo: string
}

// Same pattern as scripts/release-repo.js, which resolves the repository for CI.
export function releaseRepo(): GitHubRepo {
  const repositoryUrl = brand?.package?.repository?.url || ''
  const match = repositoryUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i)

  return {
    owner: match?.[1] || DEFAULT_GITHUB_OWNER,
    repo: match?.[2] || DEFAULT_GITHUB_REPO,
  }
}

export function releasePageUrl(version: string) {
  const { owner, repo } = releaseRepo()
  return `https://github.com/${owner}/${repo}/releases/tag/v${version}`
}
