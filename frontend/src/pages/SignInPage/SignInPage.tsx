import React from 'react'
import browser from '../../services/Browser'
import { IP_PRIVATE } from '@common/constants'
import { useMediaQuery, Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { SignInApp } from '../../components/SignInApp'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import { Link } from '../../components/Link'
import { spacing } from '../../styling'

const TALL_QUERY = '(min-height:700px)'

export function SignInPage() {
  const tall = useMediaQuery(TALL_QUERY)
  const css = useStyles({ tall })
  const { hostname, protocol } = window.location
  const allowSwitch =
    !browser.isElectron && !browser.isMobile && hostname !== 'localhost' && hostname !== IP_PRIVATE && hostname
  const secure: boolean = protocol.includes('https')
  const switchUrl = secure ? `http://${hostname}:29999` : `https://${hostname}:29998`

  return (
    <Body className={css.body} center={tall}>
      <SignInApp />
      {allowSwitch && (
        <div className={css.link}>
          {!secure && (
            <div className={css.insecure}>
              <Typography variant="body2" align="center" gutterBottom>
                On an insecure network?{' '}
                <Link href={switchUrl}>
                  <Icon name="lock" type="solid" size="xs" inlineLeft inline />
                  Use secure session
                </Link>
              </Typography>
              <Typography variant="caption">
                You will be prompted by your browser with a security message regarding the remoteitpi.local certificate.
                <br />
                This is normal for local connections. Your data is still encrypted.
                <Link href="https://link.remote.it/documentation-desktop/https-connections">Learn more</Link>
              </Typography>
            </div>
          )}
        </div>
      )}
    </Body>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  body: {
    paddingTop: spacing.xl,
    paddingBottom: 300,
    '& > div': { maxWidth: 440 },
    [`@media ${TALL_QUERY}`]: { paddingBottom: 0, paddingTop: 0 },
  },
  insecure: {
    margin: `${spacing.xs}px auto`,
    textAlign: 'center',
    lineHeight: '1em',
    '& > a': { color: palette.success.main },
  },
  link: {
    marginTop: spacing.xl,
    fontWeight: 400,
  },
}))
