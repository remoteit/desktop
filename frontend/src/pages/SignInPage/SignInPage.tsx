import React from 'react'
import browser from '../../services/Browser'
import { IP_PRIVATE } from '@common/constants'
import { Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
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
  const css = useStyles({ short })
  const { hostname, protocol } = window.location
  const allowSwitch =
    !browser.isElectron && !browser.isMobile && hostname !== 'localhost' && hostname !== IP_PRIVATE && hostname
  const secure: boolean = protocol.includes('https')
  const switchUrl = secure ? `http://${hostname}:29999` : `https://${hostname}:29998`

  return (
    <Panel layout={layout} header={false}>
      <Body className={css.body} center={!short}>
        <SignInApp />
        {allowSwitch && !secure && (
          <div className={css.insecure}>
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
          </div>
        )}
      </Body>
    </Panel>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  body: ({ short }: { short: boolean }) => ({
    paddingTop: short ? 20 : 0,
    paddingBottom: short ? '50vh' : 0,
    '& > div': { maxWidth: 440 },
  }),
  insecure: {
    marginTop: spacing.xl,
    margin: `${spacing.xs}px auto`,
    textAlign: 'center',
    lineHeight: '1em',
    '& > a': { color: palette.success.main },
  },
}))
