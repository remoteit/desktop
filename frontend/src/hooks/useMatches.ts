import { useLocation } from 'react-router-dom'

export type MatchesProps = {
  to?: string
  match?: string | string[]
  exactMatch?: boolean
}

export function useMatches({ to, match, exactMatch }: MatchesProps): boolean {
  const location = useLocation()

  if (!match) match = to
  if (typeof match === 'string') match = [match]
  const matches = match?.find(s => (exactMatch ? location.pathname === s : location.pathname.includes(s)))

  return !!matches
}
