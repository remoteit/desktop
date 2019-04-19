import axios from 'axios'
import debug from 'debug'

const d = debug('r3:release')

/**
 * Return the latest release from Github Release API.
 */
export async function latestRelease(): Promise<Release> {
  d('Getting latest connectd version')

  const url = 'https://api.github.com/repos/remoteit/connectd/releases/latest'
  // TODO: What to do on error?
  try {
    const { data } = await axios.get<RawRelease>(url)

    // d('Latest connectd version info: %O', data)

    const release = {
      version: parsedVersion(data.tag_name),
      downloads: data.assets.map(asset => ({
        url: asset.browser_download_url,
        name: asset.name,
      })),
    }

    // d('Parsed release info: %O', release)

    return release
  } catch (error) {
    error.response && console.log(error.response.data)
    throw error
  }
}

/**
 * Return the latest release on Github.
 */
export async function latestVersion() {
  const { version } = await latestRelease()
  return parsedVersion(version)
}

function parsedVersion(version: string) {
  return version
    .slice(1) // remove the "v" from the string
    .split('.') // split major, minor, patch
    .splice(0, 2) // get major, minor
    .join('.') // make into a string
}

interface Release {
  version: string
  downloads: Download[]
}

interface Download {
  name: string
  url: string
}

interface RawRelease {
  url: string
  assets_url: string
  upload_url: string
  html_url: string
  id: number
  node_id: string
  tag_name: string
  target_commitish: string
  name: string
  draft: boolean
  author: RawReleaseAuthor
  prerelease: boolean
  created_at: string
  published_at: string
  assets: RawReleaseAsset[]
}

interface RawReleaseAsset {
  url: string
  id: number
  node_id: string
  name: string
  label: string | null
  uploader: any[]
  content_type: string
  state: string
  size: number
  download_count: number
  created_at: string
  updated_at: string
  browser_download_url: string
}

interface RawReleaseAuthor {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
}
