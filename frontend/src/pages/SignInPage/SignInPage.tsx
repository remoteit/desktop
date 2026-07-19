import React from 'react'
import browser from '../../services/browser'
import { IP_PRIVATE } from '@common/constants'
import { Box, Typography } from '@mui/material'
import { SignInApp } from '../../components/SignInApp'
import { Panel } from '../../components/Panel'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import { Link } from '../../components/Link'
import { spacing } from '../../styling'

type Props = {
  layout: ILayout
}

export function SignInPage({ layout }: Props) {
  const short = browser.isAndroid || browser.isAndroidBrowser
  const { hostname, protocol } = window.location
  const allowSwitch =
    !browser.isElectron && !browser.isMobile && hostname !== 'localhost' && hostname !== IP_PRIVATE && hostname
  const secure: boolean = protocol.includes('https')
  const switchUrl = secure ? `http://${hostname}:29999` : `https://${hostname}:29998`

  return (
    <Panel layout={layout} header={false}>
      <Body
        sx={{ paddingTop: short ? '20px' : 0, paddingBottom: short ? '50vh' : 0, '& > div': { maxWidth: 440 } }}
        center={!short}
      >
        <SignInApp />
        {allowSwitch && !secure && (
          <Box
            sx={{
              marginTop: `${spacing.xl}px`,
              margin: `${spacing.xs}px auto`,
              textAlign: 'center',
              lineHeight: '1em',
              '& > a': { color: 'success.main' },
            }}
          >
            <Typography variant="body2" align="center">
              On an insecure network?
              <Link href={switchUrl}>
                <Icon name="lock" type="solid" size="xs" inlineLeft inline />
                Use secure session
              </Link>
            </Typography>
            <Typography variant="caption">
              You will be prompted by your browser with a security message regarding the remoteitpi.local certificate.
              This is normal for local connections.
              <br /> Your data is still encrypted.
              <Link href="https://link.remote.it/documentation-desktop/https-connections">Learn more</Link>
            </Typography>
          </Box>
        )}
      </Body>
    </Panel>
  )
}
