import React, { useState } from 'react'
import { APP_MAX_WIDTH } from '../constants'
import { Tooltip, IconButton, Box, Stack, useMediaQuery } from '@mui/material'
import { TargetPlatform } from './TargetPlatform'
import { Icon } from './Icon'
import screenfull from 'screenfull'
import browser from '../services/browser'
import { useChatDocked, useChatWidth } from '../hooks/useChatEnabled'

type Props = { device?: IDevice; children: React.ReactNode }

export const RemoteHeader: React.FC<Props> = ({ device, children }) => {
  /* APP_MAX_WIDTH is how wide the APP's content should ever get. The docked chat is a
     column beside that content rather than part of it, so the frame grows by exactly
     what the chat takes — otherwise opening the chat quietly spends the app's own width
     on it. Expanded doesn't count: it overlays the content instead of sitting beside it.
     The media query uses the same figure, or the framed look would start before the
     frame could actually reach its width. (Web only — Electron always fills its window.) */
  const chatWidth = useChatWidth()
  const appMaxWidth = APP_MAX_WIDTH + (useChatDocked() ? chatWidth : 0)
  /* The QUERY is the constant, not the widened cap: it only asks "is the window wider
     than the app wants to be", which the chat does not change. Interpolating the live
     cap rebuilt the MediaQueryList on every frame of a chat drag — a fresh matchMedia
     and re-subscribe per frame — for an answer that flips at one threshold. */
  const maxWidth = !browser.isElectron && useMediaQuery(`(min-width:${APP_MAX_WIDTH}px)`)
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
          marginTop: maxWidth || showFrame ? 3 / 2 : 0,
          height: `calc(100% - ${showFrame ? spacing(6) : maxWidth ? spacing(3) : '0px'})`,
          width: `calc(100% - ${showFrame ? spacing(6) : '0px'})`,
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
