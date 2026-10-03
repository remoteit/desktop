// A port list as typed — "137, 139 445" — or undefined when any part is not a port.
export function parsePorts(text: string): number[] | undefined {
  const parts = text.split(/[\s,]+/).filter(Boolean)
  const ports = parts.map(Number)
  if (ports.some(port => !Number.isInteger(port) || port < 1 || port > 65535)) return undefined
  return [...new Set(ports)].sort((a, b) => a - b)
}
