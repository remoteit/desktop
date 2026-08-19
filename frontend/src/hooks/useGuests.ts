import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { selectOrganization } from '../selectors/organizations'

// Lazily loads the active org's guests (they are not part of the normal
// organization.fetch query) and returns them along with the loaded flag. Safe
// to call from any page that needs guest data — the fetch only fires once per
// account.
export function useGuests(): { guests: IGuest[]; guestsLoaded: boolean } {
  const dispatch = useDispatch<Dispatch>()
  const { guests, guestsLoaded } = useSelector(selectOrganization)

  useEffect(() => {
    if (!guestsLoaded) dispatch.organization.fetchGuests()
  }, [guests])

  return { guests, guestsLoaded }
}
