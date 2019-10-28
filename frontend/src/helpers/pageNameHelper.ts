import { LAST_PATH } from './regEx'

const pageNameMap: { [path: string]: string } = {
  '/connections': 'Connections',
  '/devices': 'Remote List',
  '/setup': 'Local Setup',
  '/network': 'Network',
  '/settings': 'Settings',
}

export const pageName = (path: string) => {
  const name: string | undefined = pageNameMap[path]
  if (name) return name
  const match = path.match(LAST_PATH)
  if (match) return match[0]
}
