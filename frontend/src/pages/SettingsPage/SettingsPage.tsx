import React from 'react'
import { SignOutLinkController } from '../../controllers/SignOutLinkController'
import { QuitLinkController } from '../../controllers/QuitLinkController'
import { Link, Button, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { SearchOnlyToggle } from '../../components/SearchOnlyToggle'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'

const mapState = (state: ApplicationState, props: any) => ({
  installing: state.binaries.installing,
  installed: state.binaries.connectdInstalled && state.binaries.muxerInstalled && state.binaries.demuxerInstalled,
  openOnLogin: state.auth.openOnLogin,
})

const mapDispatch = (dispatch: any) => ({
  install: dispatch.binaries.install,
  toggleOpenOnLogin: dispatch.auth.toggleOpenOnLogin,
})

export type SettingsPageProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

export const SettingsPage = connect(
  mapState,
  mapDispatch
)(({ installing, installed, install, openOnLogin, toggleOpenOnLogin }: SettingsPageProps) => {
  return (
    <div>
      <h2>Settings</h2>
      <List>
        <ListItem>
          <ListItemIcon>
            <Icon name="sign-out" />
          </ListItemIcon>
          <ListItemText primary="Sign out" />
          <ListItemSecondaryAction>
            <Icon name="sign-out" />
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      <section>
        <SignOutLinkController />
        <Link href={encodeURI(`mailto:support@remote.it?subject=Desktop Application Feedback`)}>
          <Icon name="envelope" />
          Send feedback
        </Link>
        <QuitLinkController />
      </section>
      <section>
        <label>
          <input type="checkbox" checked={openOnLogin} onChange={toggleOpenOnLogin} />
          Open remote.it Desktop on login
        </label>
        <SearchOnlyToggle />
      </section>
      <section>
        <Button
          disabled={installing}
          onClick={() => install()}
          variant="contained"
          color={installed ? 'default' : 'primary'}
        >
          {installing ? 'Installing...' : <>{installed ? 'Reinstall' : 'Install'} command line tools</>}
        </Button>
        <div>Installing command line tools requires administrator permissions.</div>
      </section>
    </div>
  )
})
