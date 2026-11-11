import {
  DEVICE_CONTAINER_IMAGE,
  DEVICE_CONTAINER_JOIN_KEY_FILE,
  DEVICE_CONTAINER_STATE,
  JOIN_KEY_FILE_ENV,
} from '../constants'

// What the downloaded files are named for: a product's join key, and a device's.
export const PRODUCT_JOIN_KEY_FILE = 'remoteit-join-key'
export const DEVICE_JOIN_KEY_FILE = 'remoteit-device-join-key'

// The file a machine reads with REMOTEIT_JOIN_KEY_FILE, as it is downloaded: `<prefix>-<the key's name>.txt`.
export function joinKeyFileName(prefix: string, name: string): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'key'
  return `${prefix}-${slug}.txt`
}

// The key alone, on one line (the daemon trims the line end).
export function downloadJoinKey(prefix: string, name: string, key: string) {
  const element = document.createElement('a')
  element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(key + '\n')
  element.setAttribute('download', joinKeyFileName(prefix, name))
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

export type JoinKeyKind = 'device' | 'product'

/* The container that runs with a downloaded join key (device-package docs/container-image.md), the key read from its
   file — never on the command line, where it would land in the shell's history and the container's inspect output.
   - A device join key brings its one device back at every start, its identity in memory: no volume.
   - A product join key registers a new device, which then keeps its own key in a volume, one per device; an ephemeral
     product's device is new at every start, so it has none (R3_ALLOW_NO_VOLUME). */
export function joinKeyContainerCommand(kind: JoinKeyKind, file: string, ephemeral = false): string {
  const lines = ['docker run -d --name remoteit --restart unless-stopped --network host']
  if (kind === 'product')
    lines.push(ephemeral ? '-e R3_ALLOW_NO_VOLUME=1' : `-v remoteit-device:${DEVICE_CONTAINER_STATE}`)
  lines.push(`-e ${JOIN_KEY_FILE_ENV}=${DEVICE_CONTAINER_JOIN_KEY_FILE}`)
  lines.push(`-v "$PWD/${file}:${DEVICE_CONTAINER_JOIN_KEY_FILE}:ro"`)
  lines.push(DEVICE_CONTAINER_IMAGE)
  return lines.join(' \\\n  ')
}
