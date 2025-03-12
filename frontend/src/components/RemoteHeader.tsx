import React, { useState } from 'react'
import { APP_MAX_WIDTH } from '../constants'
import { Tooltip, IconButton, Box, Stack, useMediaQuery } from '@mui/material'
import { TargetPlatform } from './TargetPlatform'
import { Icon } from './Icon'
import screenfull from 'screenfull'
import browser from '../services/browser'

type Props = { device?: IDevice; children: React.ReactNode }

export const RemoteHeader: React.FC<Props> = ({ device, children }) => {
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
          maxWidth: maxWidth ? APP_MAX_WIDTH : undefined,
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