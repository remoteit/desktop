import { createSelector } from 'reselect'
import { getAnnouncements, optionalParam } from './state'
import { isBannerType } from '../helpers/noticeHelper'

// Banners are presented as a persistent bar at the top of the app rather than as cards, so they
// are excluded from the announcements list, the unread badge and the full-screen presentation.
const isBanner = (announcement: IAnnouncement) => isBannerType(announcement.type)

export const selectAnnouncements = createSelector([getAnnouncements, optionalParam], (announcements, unread?: boolean) =>
  announcements.filter(a => !isBanner(a) && (!unread || !a.read))
)

export const selectBannerAnnouncements = createSelector([getAnnouncements], announcements =>
  announcements.filter(isBanner)
)

export const selectLatestAnnouncement = createSelector([getAnnouncements], announcements =>
  getLatestAnnouncement(announcements.filter(a => !isBanner(a)))
)

export const FULL_SCREEN_LAUNCH = new Date('2026-07-20T00:00:00-07:00').getTime()

export const selectLatestUnreadAnnouncement = createSelector([getAnnouncements], announcements =>
  getLatestAnnouncement(
    announcements.filter(
      announcement =>
        !isBanner(announcement) && !announcement.read && (announcement.modified?.getTime() || 0) >= FULL_SCREEN_LAUNCH
    )
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
