import { createSelector } from 'reselect'
import { getAnnouncements, optionalParam } from './state'

export const selectAnnouncements = createSelector(
  [getAnnouncements, optionalParam],
  (announcements, unread?: boolean) => announcements.filter(a => !unread || !a.read)
)
