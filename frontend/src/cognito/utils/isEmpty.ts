export default function isEmpty(obj?: { [key: string]: any }): boolean {
  if (!obj) return true

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) return false
  }

  return true
}
