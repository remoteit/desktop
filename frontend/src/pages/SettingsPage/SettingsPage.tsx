import React, { useEffect } from 'react'
import { makeStyles, List, Typography, Tooltip, ButtonBase } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { selectLicenseIndicator, getRemoteitLicense } from '../../models/licensing'
import { ListItemLocation } from '../../components/ListItemLocation'
import { DeviceSetupItem } from '../../components/DeviceSetupItem'
import { AvatarMenu } from '../../components/AvatarMenu'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { TestUI } from '../../components/TestUI'
import { spacing } from '../../styling'
import { Title } from '../../components/Title'
import { Logo } from '../../components/Logo'
import analyticsHelper from '../../helpers/analyticsHelper'

export const SettingsPage: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const css = useStyles()
  const { billing, preferences, licenseIndicator } = useSelector((state: ApplicationState) => ({
    billing: !!getRemoteitLicense(state)?.plan?.billing,
    licenseIndicator: selectLicenseIndicator(state),
    preferences: state.backend.preferences,
  }))

  useEffect(() => {
    analyticsHelper.page('SettingsPage')
  }, [])

  if (!preferences) return null

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>
              <Tooltip title="Visit remote.it on the web">
                <ButtonBase onClick={() => window.open('https://remote.it')}>
                  <Logo className={css.logo} width={110} />
                </ButtonBase>
              </Tooltip>
            </Title>
            {singlePanel && <AvatarMenu />}
            <OutOfBand inline />
          </Typography>
          <List disablePadding>
            <DeviceSetupItem />
          </List>
        </>
      }
    >
      <List>
        <ListItemLocation
          title="Settings"
          pathname="/settings/options"
          icon="sliders-h"
          match={['/settings', '/settings/options']}
          exactMatch
          dense
        />
        <ListItemLocation title="Logs" pathname="/settings/logs" icon="file-alt" dense />
        <ListItemLocation title="Notifications" pathname="/settings/notifications" icon="bell" dense />
        <ListItemLocation title="Organization" pathname="/settings/organization" icon="industry-alt" exactMatch dense />
        <ListItemLocation
          title="Licensing"
          pathname="/settings/licensing"
          icon="id-badge"
          badge={licenseIndicator}
          dense
        />
        <ListItemLocation title="Subscriptions" pathname="/settings/plans" icon="shopping-cart" dense />
        {billing && <ListItemLocation title="Billing" pathname="/settings/billing" icon="credit-card-front" dense />}
        <TestUI>
          <ListItemLocation title="Tags" pathname="/settings/tags" icon="tag" dense />
          <ListItemLocation title="Reports" pathname="/settings/reports" icon="chart-line" dense />
          <ListItemLocation title="Test Settings" pathname="/settings/test" icon="vial" dense />
        </TestUI>
      </List>
    </Container>
  )
}

const useStyles = makeStyles({
  logo: { marginBottom: spacing.xs },
})
