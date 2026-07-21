import React from 'react'
import { Box, Chip, Tooltip } from '@mui/material'
import { Attribute } from '../../components/Attributes'
import { Icon } from '../../components/Icon'

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

const dateLabel = (date?: Date) => (date ? date.toLocaleString() : '—')

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
    id: 'subtitle',
    label: 'Subtitle',
    defaultWidth: 240,
    value: ({ notice }: AdminNoticeAttributeOptions) => notice?.preview || '—',
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
      if (notice.type === 'BANNER' && !notice.until)
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
