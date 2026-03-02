import { useHistory, useLocation, matchPath, generatePath } from 'react-router-dom'
import { REGEX_FIRST_PATH } from '../constants'
import ROUTE_PARENTS from '../routers/routeParents'

/**
 * Given a pathname, returns the semantic parent route.
 * Uses the static ROUTE_PARENTS map to look up the declared parent,
 * substituting URL params from the current path into the parent pattern.
 * Falls back to the section root (first path segment) for unmatched routes.
 */
export function getParentRoute(pathname: string): string {
  for (const [pattern, parentPattern] of ROUTE_PARENTS) {
    const match = matchPath(pathname, { path: pattern, exact: true })
    if (match) {
      return generatePath(parentPattern, match.params)
    }
  }
  // Fallback: section root
  return pathname.match(REGEX_FIRST_PATH)?.[0] || '/'
}

/**
 * Hook that returns a goUp() function for hierarchical UP navigation.
 *
 * @param panels - Number of visible panels (1, 2, or 3).
 *   Single panel (1): navigates to the semantic parent via ROUTE_PARENTS map.
 *   Multi panel (2+): navigates to the section root (e.g. /devices, /scripts).
 */
export default function useNavigationUp(panels: number = 1) {
  const history = useHistory()
  const location = useLocation()

  return () => {
    const parentPath = panels === 1
      ? getParentRoute(location.pathname)
      : location.pathname.match(REGEX_FIRST_PATH)?.[0] || '/'
    history.push(parentPath)
  }
}
