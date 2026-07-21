import React from 'react'
import { useSelector } from 'react-redux'
import { Box, Button } from '@mui/material'
import { State } from '../store'
import { selectBannerAnnouncements } from '../selectors/announcements'
import { Notice } from './Notice'

export const AnnouncementBanner: React.FC = () => {
  const banners = useSelector((state: State) => selectBannerAnnouncements(state))

  // Re-check `until` on every render rather than in the memoized selector. The server already
  // filters expired notices, but `announcements` is persisted, so an offline or failed fetch
  // would otherwise leave an expired banner pinned with no way to dismiss it.
  const now = new Date()
  const active = banners.filter(banner => !banner.until || banner.until > now)

  if (!active.length) return null

  return (
    <Box sx={{ width: '100%' }}>
      {active.map(banner => (
        <Notice
          key={banner.id}
          severity="warning"
          fullWidth
          solid
          button={
            banner.link ? (
              <Button color="inherit" href={banner.link} size="small" target="_blank">
                Learn more
              </Button>
            ) : undefined
          }
        >
          {banner.preview ? (
            <span dangerouslySetInnerHTML={{ __html: banner.preview }} />
          ) : (
            <strong>{banner.title}</strong>
          )}
        </Notice>
      ))}
    </Box>
  )
}
