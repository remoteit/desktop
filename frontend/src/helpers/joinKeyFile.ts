// The file a machine reads with REMOTEIT_JOIN_KEY_FILE: the key alone, on one line (the daemon trims the line end),
// named `<prefix>-<the key's name>.txt`.
export function downloadJoinKey(prefix: string, name: string, key: string) {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'key'
  const element = document.createElement('a')
  element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(key + '\n')
  element.setAttribute('download', `${prefix}-${slug}.txt`)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}
