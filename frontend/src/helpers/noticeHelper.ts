import { NoticeProps } from '../components/Notice'

// Banner severity is encoded in the notice type rather than a separate column. Keep every
// banner-vs-card test going through `isBannerType` — a missed check silently leaks a banner into
// the announcements list, the unread badge and the full-screen dialog.
export const BANNER_TYPES: INoticeType[] = ['BANNER', 'BANNER_WARN', 'BANNER_DANGER']

export const isBannerType = (type?: INoticeType) => !!type && BANNER_TYPES.includes(type)

export const bannerSeverity = (type?: INoticeType): NoticeProps['severity'] => {
  switch (type) {
    case 'BANNER_DANGER':
      return 'error'
    case 'BANNER_WARN':
      return 'warning'
    default:
      return 'info'
  }
}
