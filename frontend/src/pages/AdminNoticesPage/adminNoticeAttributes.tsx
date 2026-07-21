import React from 'react'
import { Box, Chip, Tooltip } from '@mui/material'
import { Attribute } from '../../components/Attributes'
import { Icon } from '../../components/Icon'
import { isBannerType } from '../../helpers/noticeHelper'

export type AdminNoticeAttributeOptions = {
  notice?: IAdminNotice
}

export class AdminNoticeAttribute extends Attribute<AdminNoticeAttributeOptions> {
  type: Attribute['type'] = 'MASTER'
}

export type NoticeStatus = 'Live' | 'Scheduled' | 'Expired' | 'Disabled'

// Mirrors the server's Notice.visible() filter so admins can see at a glance whether a notice is
// actually reaching users right now, rather than just whether it is enabled.
export const noticeStatus = (notice: IAdminNotice): NoticeStatus => {
  const now = new Date()
  if (!notice.enabled) return 'Disabled'
  if (notice.from && notice.from > now) return 'Scheduled'
  if (notice.until && notice.until <= now) return 'Expired'
  return 'Live'
}

// Surface what is reaching users right now. The API returns `modified DESC`, which answers "what
// did I edit recently?" but scatters live notices through the list — so group by status here and
// keep most-recently-edited first within each group.
const STATUS_ORDER: Record<NoticeStatus, number> = { Live: 0, Scheduled: 1, Disabled: 2, Expired: 3 }

export const sortNotices = (notices: IAdminNotice[]): IAdminNotice[] =>
  [...notices].sort((a, b) => {
    const byStatus = STATUS_ORDER[noticeStatus(a)] - STATUS_ORDER[noticeStatus(b)]
    if (byStatus) return byStatus
    return (b.modified?.getTime() || 0) - (a.modified?.getTime() || 0)
  })

// One icon per notice type so the list is scannable at a glance. Names are all already in use
// elsewhere in the app — an unknown name renders as a blank glyph rather than failing loudly.
const NOTICE_ICONS: Record<INoticeType, string> = {
  GENERIC: 'circle-info', // "Notice"
  SYSTEM: 'wave-pulse', // "System Update" — maintenance and service health
  SECURITY: 'shield', // "Security Notice"
  RELEASE: 'sparkles', // "Release Note" — something new
  COMMUNICATION: 'comments', // "Announcement"
  BANNER: 'bullhorn', // persistent top bar
  BANNER_WARN: 'triangle-exclamation', // persistent top bar, warning
  BANNER_DANGER: 'octagon-xmark', // persistent top bar, error
}

export const noticeIcon = (type?: INoticeType) => (type && NOTICE_ICONS[type]) || NOTICE_ICONS.GENERIC

const dateLabel = (date?: Date) => (date ? date.toLocaleString() : '—')

const plainText = (html?: string) => html?.replace(/<[^>]*>/g, '').trim()

export const adminNoticeAttributes: AdminNoticeAttribute[] = [
  new AdminNoticeAttribute({
    id: 'title',
    label: 'Title',
    defaultWidth: 220,
    required: true,
    // The master column has no ellipsis clamp of its own (unlike `.attribute` columns), so a long
    // title would wrap and make the row taller than the rest.
    value: ({ notice }: AdminNoticeAttributeOptions) => (
      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notice?.title || '—'}</Box>
    ),
  }),
  new AdminNoticeAttribute({
    id: 'body',
    label: 'Body',
    defaultWidth: 240,
    // Body is HTML — strip tags so the cell shows readable text rather than markup.
    value: ({ notice }: AdminNoticeAttributeOptions) => plainText(notice?.body) || '—',
  }),
  new AdminNoticeAttribute({
    id: 'status',
    label: 'Status',
    defaultWidth: 110,
    value: ({ notice }: AdminNoticeAttributeOptions) => {
      if (!notice) return null
      const status = noticeStatus(notice)
      return status === 'Live' ? (
        <Chip label="Live" size="small" color="primary" />
      ) : (
        <Chip label={status} size="small" variant="outlined" />
      )
    },
  }),
  new AdminNoticeAttribute({
    id: 'type',
    label: 'Type',
    defaultWidth: 130,
    value: ({ notice }: AdminNoticeAttributeOptions) => notice?.type || '—',
  }),
  new AdminNoticeAttribute({
    id: 'stage',
    label: 'Stage',
    defaultWidth: 100,
    value: ({ notice }: AdminNoticeAttributeOptions) => notice?.stage || 'all',
  }),
  new AdminNoticeAttribute({
    id: 'from',
    label: 'From',
    defaultWidth: 170,
    value: ({ notice }: AdminNoticeAttributeOptions) => dateLabel(notice?.from),
  }),
  new AdminNoticeAttribute({
    id: 'until',
    label: 'Until',
    defaultWidth: 170,
    value: ({ notice }: AdminNoticeAttributeOptions) => {
      if (!notice) return '—'
      // A banner with no end date can only be taken down by hand — call it out.
      if (isBannerType(notice.type) && !notice.until)
        return (
          <Tooltip title="Banners cannot be dismissed — set an end date">
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Icon name="exclamation-triangle" size="sm" color="warning" />
              none
            </Box>
          </Tooltip>
        )
      return dateLabel(notice.until)
    },
  }),
]
