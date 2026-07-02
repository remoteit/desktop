import { createSelector } from 'reselect'
import { State } from '../store'
import { selectOrganization } from './organizations'
import { isUserAccount } from './accounts'

const getContacts = (state: State) => state.contacts.all

// Email suggestions for the share / transfer dropdowns.
// Sourced from the ACTIVE org's members + guests (scoped via selectOrganization),
// plus the signed-in user's personal contacts only when viewing their own account.
export const selectContacts = createSelector(
  [selectOrganization, isUserAccount, getContacts],
  (organization, ownAccount, contacts): IUserRef[] => {
    const orgRefs: IUserRef[] = [
      ...organization.members.map(m => m.user),
      ...organization.guests.map(g => ({ id: g.id, email: g.email })),
    ]
    const combined = ownAccount ? [...orgRefs, ...contacts] : orgRefs
    const seen = new Set<string>()
    return combined
      .filter(c => {
        const key = c.email?.trim().toLowerCase()
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => a.email.localeCompare(b.email, undefined, { sensitivity: 'base' }))
  }
)
