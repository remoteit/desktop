import React, { createContext, useContext } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { SEEN_CHOICES, SeenChoice } from '../../services/fleetVersionsModel'
import { SeenToggle } from './SeenToggle'

/* The Upgrades page's Online · 7 days · 30 days · All: which offline devices its bars, legends and managed counts
   include, by how long ago they were last seen. 30 days by default (the Fleet tab's default is Online). In the URL as
   ?seen=online|7|30|all, the default left out, and carried from the channels to a run and back. Offered only where
   graphql counts the offline by age (DaemonRolloutCounts' offline bands); without them every count is as before. */
export const UPGRADES_SEEN_DEFAULT: SeenChoice = '30'

export const readUpgradesSeen = (search: string): SeenChoice => {
  const seen = new URLSearchParams(search).get('seen')
  return SEEN_CHOICES.find(choice => choice.key === seen)?.key ?? UPGRADES_SEEN_DEFAULT
}

// A path on the Upgrades page with the choice the URL holds now.
export const keepSeen = (path: string, search: string) => {
  const seen = new URLSearchParams(search).get('seen')
  return seen ? `${path}?seen=${encodeURIComponent(seen)}` : path
}

// What the counts are read with: All outside the page, so a bar shown anywhere else counts every device, as before.
export const UpgradesSeenContext = createContext<SeenChoice>('all')
export const useUpgradesSeen = () => useContext(UpgradesSeenContext)

// The choice, where the counts it applies to carry the offline bands.
export const UpgradesSeenToggle: React.FC<{ bands: boolean }> = ({ bands }) => {
  const history = useHistory()
  const location = useLocation()
  if (!bands) return null
  const choose = (seen: SeenChoice) => {
    const params = new URLSearchParams(location.search)
    if (seen === UPGRADES_SEEN_DEFAULT) params.delete('seen')
    else params.set('seen', seen)
    const search = params.toString()
    history.replace(`${location.pathname}${search ? `?${search}` : ''}`)
  }
  return <SeenToggle value={readUpgradesSeen(location.search)} days onChange={choose} />
}
