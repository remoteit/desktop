import React from 'react'
import { Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { SignInForm } from '../../components/SignInForm'
import { IP_PRIVATE } from '../../shared/constants'
import { isElectron } from '../../services/Browser'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import { Link } from '../../components/Link'
import { spacing } from '../../styling'

export function SignInPage() {
  const css = useStyles()
  const { hostname, protocol } = window.location
  const allowSwitch = !isElectron() && hostname !== 'localhost' && hostname !== IP_PRIVATE
  const secure: boolean = protocol.includes('https')
  const switchUrl = secure ? `http://${hostname}:29999` : `https://${hostname}:29998`

  return (
    <Body className={css.body} center>
      <SignInForm />
      {allowSwitch && (
        <div className={css.link}>
          {secure ? (
            <div className={css.secure}>
              <Icon name="lock" type="solid" size="xs" inlineLeft /> Secure Session
            </div>
          ) : (
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
  body: { '& > div': { maxWidth: 440 } },
  logo: {
    marginTop: -spacing.xl,
    marginBottom: spacing.lg,
  },
  secure: { color: palette.success.main },
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
