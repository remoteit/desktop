import React, { useState } from 'react'
import { APP_MAX_WIDTH } from '../constants'
import { Tooltip, IconButton, Box, Stack } from '@mui/material'
import { TargetPlatform } from './TargetPlatform'
import { Icon } from './Icon'
import screenfull from 'screenfull'
import browser from '../services/browser'
import { spacing as scale } from '../styling'
import { useChatDocked, useChatWidth } from '../hooks/useChatEnabled'
import { useViewportWidth } from '../hooks/useViewportWidth'

type Props = { device?: IDevice; children: React.ReactNode }

/* The grey surround the app floats on once it stops growing: the same gap on every side,
   and — doubled — the width the window must have SPARE before a frame is worth drawing.
   One value for both, so the look and the moment it appears cannot disagree. */
const FRAME_GUTTER = scale.sm

export const RemoteHeader: React.FC<Props> = ({ device, children }) => {
  /* APP_MAX_WIDTH is how wide the APP's content should ever get. The docked chat is a
     column beside that content rather than part of it, so the frame grows by exactly
     what the chat takes — otherwise opening the chat quietly spends the app's own width
     on it. Expanded doesn't count: it overlays the content instead of sitting beside it.
     (Web only — Electron always fills its window.) */
  const chatWidth = useChatWidth()
  const appMaxWidth = APP_MAX_WIDTH + (useChatDocked() ? chatWidth : 0)
  /* Framed only once the window can hold the capped app AND a gutter either side. The
     test used to be a `min-width: APP_MAX_WIDTH` media query — which is precisely the
     width at which the app still fills the window edge to edge, so the top gap and the
     rounded corners arrived while the sides had nothing to show. A docked chat stretched
     that dead zone by its own width, raising the cap but not the query.

     Compared as numbers rather than through matchMedia BECAUSE the threshold moves with
     the chat: interpolating a live value into a media query rebuilt the MediaQueryList
     on every frame of a drag. useViewportWidth is one shared, frame-coalesced listener,
     so reading the width here costs nothing extra. */
  const viewport = useViewportWidth()
  const maxWidth = !browser.isElectron && viewport >= appMaxWidth + FRAME_GUTTER * 2
  const showFrame = browser.isRemote
  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const fullscreenEnabled = screenfull.isEnabled

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
    if (screenfull.isEnabled) screenfull.toggle()
  }

  return (
    <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'fixed', backgroundColor: 'gray.main' }}>
      {showFrame && (
        <Box
          sx={({ spacing }) => ({
            height: spacing(3),
            paddingTop: 0.75,
            display: 'flex',
            color: 'grayLight.main',
            textAlign: 'center',
            '& button': { position: 'absolute', left: 0, top: 0, color: 'white.main' },
          })}
        >
          {fullscreenEnabled && (
            <Tooltip title={fullscreen ? 'Exit full screen' : 'Full screen'} arrow>
              <IconButton onClick={toggleFullscreen} size="large">
                <Icon name={fullscreen ? 'compress' : 'expand'} size="md" color="gray" />
              </IconButton>
            </Tooltip>
          )}
          <Box sx={({ spacing }) => ({ position: 'absolute', height: 3, right: spacing(2.25), top: spacing(0.75) })}>
            <TargetPlatform id={device?.targetPlatform} size="lg" tooltip />
          </Box>
        </Box>
      )}
      <Stack
        sx={({ spacing }) => ({
          overflow: 'hidden',
          display: 'flex',
          flexFlow: 'column',
          margin: 'auto',
          contain: 'layout',
          marginTop: maxWidth || showFrame ? `${FRAME_GUTTER}px` : 0,
          height: `calc(100% - ${showFrame ? spacing(6) : maxWidth ? `${FRAME_GUTTER * 2}px` : '0px'})`,
          // The sides get the same gutter as the top. Insetting only the top read as a
          // rendering seam above the app rather than as a window floating on the grey.
          width: `calc(100% - ${showFrame ? spacing(6) : maxWidth ? `${FRAME_GUTTER * 2}px` : '0px'})`,
          maxWidth: maxWidth ? appMaxWidth : undefined,
          backgroundColor: 'white.main',
          borderRadius: maxWidth || showFrame ? 5 : undefined,
          boxShadow: maxWidth || showFrame ? 3 : undefined,
        })}
      >
        {children}
      </Stack>
    </Box>
  )
}
