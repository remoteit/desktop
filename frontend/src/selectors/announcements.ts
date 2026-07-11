import { createSelector } from 'reselect'
import { getAnnouncements, optionalParam } from './state'

export const selectAnnouncements = createSelector(
  [getAnnouncements, optionalParam],
  (announcements, unread?: boolean) => announcements.filter(a => !unread || !a.read)
)

export const selectLatestAnnouncement = createSelector([getAnnouncements], announcements => getLatestAnnouncement(announcements))

export const selectLatestUnreadAnnouncement = createSelector(
  [getAnnouncements, state => state.announcements.presentedThrough],
  (announcements, presentedThrough) =>
    getLatestAnnouncement(
      announcements.filter(announcement => {
        const modified = announcement.modified?.getTime() || 0
        return !announcement.read && (presentedThrough === undefined || modified > presentedThrough)
      })
    )
)

function getLatestAnnouncement(announcements: IAnnouncement[]) {
  return announcements.reduce<IAnnouncement | undefined>((latest, announcement) => {
    if (!latest) return announcement

    const latestModified = latest.modified?.getTime() || 0
    const announcementModified = announcement.modified?.getTime() || 0

    return announcementModified > latestModified ? announcement : latest
  }, undefined)
}
