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
          // Square corners so it reads as a bar rather than a card — the app panel in
          // RemoteHeader is `overflow: hidden` and rounded, so it clips the top corners for us.
          sx={{ borderRadius: 0 }}
          button={
            banner.link ? (
              // The theme's Button default resolves `inherit` to grayDark, which is unreadable on
              // the solid severity background — pin it to the same white the banner text uses.
              <Button href={banner.link} size="small" target="_blank" sx={{ color: 'alwaysWhite.main' }}>
                Learn more
              </Button>
            ) : undefined
          }
        >
          {/*
            Bind the two lines structurally rather than relying on the notice author to hand-write
            `<strong>`/`<em>` inside `preview`. `title` is NOT NULL so a banner always has a
            heading, and both columns are varchar(255) — so this spends none of that budget on
            markup. Notice styles `strong` as the title and `em` as a smaller block subtitle.
          */}
          <strong>{banner.title}</strong>
          {banner.preview && <em dangerouslySetInnerHTML={{ __html: banner.preview }} />}
        </Notice>
      ))}
    </Box>
  )
}
