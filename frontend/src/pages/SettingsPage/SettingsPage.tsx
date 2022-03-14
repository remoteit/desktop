import React, { useEffect } from 'react'
import { makeStyles, List, Typography, Tooltip, ButtonBase, Divider } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { ListItemLocation } from '../../components/ListItemLocation'
import { DeviceSetupItem } from '../../components/DeviceSetupItem'
import { windowOpen } from '../../services/Browser'
import { ListItemLink } from '../../components/ListItemLink'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { spacing } from '../../styling'
import { TestUI } from '../../components/TestUI'
import { Title } from '../../components/Title'
import { Logo } from '../../components/Logo'
import analyticsHelper from '../../helpers/analyticsHelper'

export const SettingsPage: React.FC = () => {
  const css = useStyles()
  const { preferences, feature } = useSelector((state: ApplicationState) => ({
    preferences: state.backend.preferences,
    feature: state.ui.feature,
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
                <ButtonBase onClick={() => windowOpen('https://remote.it')}>
                  <Logo className={css.logo} width={110} />
                </ButtonBase>
              </Tooltip>
            </Title>
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
        {feature.tagging && <ListItemLocation title="Tags" pathname="/settings/tags" icon="tag" dense />}
        <ListItemLocation title="Organization" pathname="/settings/organization" icon="industry-alt" exactMatch dense />
        <TestUI>
          <ListItemLocation title="Reports" pathname="/settings/reports" icon="chart-line" dense />
          <ListItemLocation title="Test Settings" pathname="/settings/test" icon="vial" dense />
        </TestUI>
      </List>
      <Divider variant="inset" />
      <List>
        <ListItemLink title="Scripting" href="https://app.remote.it/#scripting" icon="scroll" dense />
        <ListItemLink title="Registrations" href="https://app.remote.it/#registrations" icon="upload" dense />
        <ListItemLink title="Products" href="https://app.remote.it/#products" icon="server" dense />
      </List>
    </Container>
  )
}

const useStyles = makeStyles({
  logo: { marginBottom: spacing.xs },
})
