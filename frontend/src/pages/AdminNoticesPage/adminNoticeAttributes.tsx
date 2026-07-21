import { Attribute } from '../../components/Attributes'

export type AdminNoticeAttributeOptions = {
  notice?: IAdminNotice
}

export class AdminNoticeAttribute extends Attribute<AdminNoticeAttributeOptions> {
  type: Attribute['type'] = 'MASTER'
}

// Mirrors the server's Notice.visible() filter so admins can see at a glance whether a notice is
// actually reaching users right now, rather than just whether it is enabled.
export const noticeStatus = (notice?: IAdminNotice) => {
  if (!notice) return '-'
  const now = new Date()
  if (!notice.enabled) return 'Disabled'
  if (notice.from && notice.from > now) return 'Scheduled'
  if (notice.until && notice.until <= now) return 'Expired'
  return 'Live'
}

export const adminNoticeAttributes: AdminNoticeAttribute[] = [
  new AdminNoticeAttribute({
    id: 'title',
    label: 'Title',
    defaultWidth: 260,
    required: true,
    value: ({ notice }: AdminNoticeAttributeOptions) => notice?.title || '-',
  }),
  new AdminNoticeAttribute({
    id: 'status',
    label: 'Status',
    defaultWidth: 100,
    value: ({ notice }: AdminNoticeAttributeOptions) => noticeStatus(notice),
  }),
  new AdminNoticeAttribute({
    id: 'type',
    label: 'Type',
    defaultWidth: 130,
    value: ({ notice }: AdminNoticeAttributeOptions) => notice?.type || '-',
  }),
  new AdminNoticeAttribute({
    id: 'until',
    label: 'Until',
    defaultWidth: 170,
    value: ({ notice }: AdminNoticeAttributeOptions) =>
      notice?.until ? notice.until.toLocaleString() : notice?.type === 'BANNER' ? 'none — set one' : '—',
  }),
]
