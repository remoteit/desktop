import React, { useEffect } from 'react'
import { emit } from '../../services/Controller'
import { makeStyles, List, Typography, Tooltip, ButtonBase, Divider } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { AccountLinkingSettings } from '../../components/AccountLinkingSettings'
import { ListItemLocation } from '../../components/ListItemLocation'
import { DeviceSetupItem } from '../../components/DeviceSetupItem'
import { getOwnDevices } from '../../models/accounts'
import { isRemoteUI } from '../../helpers/uiHelper'
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
  const { preferences, remoteUI } = useSelector((state: ApplicationState) => ({
    preferences: state.backend.preferences,
    remoteUI: isRemoteUI(state),
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
        </>
      }
    >
      <List>
        <DeviceSetupItem />
      </List>
      <Divider variant="inset" />
      <List>
        <ListItemLocation title="Settings" pathname="/settings/options" icon="sliders-h" dense />
        <ListItemLocation title="Licensing" pathname="/settings/licensing" icon="credit-card-front" dense />
        {remoteUI || <AccountLinkingSettings />}
        <ListItemLocation title="Logs" pathname="/settings/logs" icon="file-alt" dense />
        <TestUI>
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
