import React, { useState } from 'react'
import { Typography, Tooltip, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { FullscreenRounded, FullscreenExitRounded } from '@material-ui/icons'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { Icon } from '../../components/Icon'
import * as screenfull from 'screenfull'
import OutOfBand from './OutOfBand'
import styles from '../../styling'

const mapState = (state: ApplicationState) => ({
  page: state.navigation.page,
  user: state.auth.user,
  interfaces: state.jump.interfaces,
})

const mapDispatch = (dispatch: any) => ({
  setPage: dispatch.navigation.setPage,
})

type Props = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

const Component: React.FC<Props> = ({ user, interfaces, page, setPage }) => {
  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const fullscreenEnabled = screenfull.isEnabled
  const css = useStyles()

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
    if (screenfull.isEnabled) screenfull.toggle()
  }

  return (
    <div className={css.header}>
      <Typography>remote.it</Typography>
      <div className={css.oob}>
        <OutOfBand active={interfaces.length > 1} />
      </div>
      {fullscreenEnabled && (
        <Tooltip title={fullscreen ? 'Exit full screen' : 'Full screen'}>
          <IconButton onClick={toggleFullscreen}>
            <Icon name={fullscreen ? 'compress' : 'expand'} size="md" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Settings">
        <IconButton onClick={() => setPage('settings')}>
          <Icon name="cog" color={page === 'settings' ? 'primary' : undefined} size="md" />
        </IconButton>
      </Tooltip>
    </div>
  )
}

export const Header = connect(
  mapState,
  mapDispatch
)(Component)

const useStyles = makeStyles({
  header: {
    padding: `${styles.spacing.xs}px ${styles.spacing.sm}px`,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    '-webkit-user-select': 'none',
    '-webkit-app-region': 'drag',
    '& img': {
      width: 120,
    },
    '& .MuiTypography-root': {
      position: 'absolute',
      color: styles.colors.primary,
      textAlign: 'center',
      marginTop: 9,
      width: '100%',
    },
  },
  oob: {
    marginTop: 5,
    marginRight: styles.spacing.md,
  },
})
