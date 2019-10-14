import React, { useState } from 'react'
import { Typography, Tooltip, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { Icon } from '../../components/Icon'
import { isElectron } from '../../services/Platform'
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
      <span>
        <OutOfBand active={interfaces.length > 1} />
      </span>
      {!isElectron() && fullscreenEnabled && (
        <Tooltip title={fullscreen ? 'Exit full screen' : 'Full screen'}>
          <IconButton onClick={toggleFullscreen}>
            <Icon name={fullscreen ? 'compress' : 'expand'} size="md" />
          </IconButton>
        </Tooltip>
      )}
    </div>
  )
}

export const Header = connect(
  mapState,
  mapDispatch
)(Component)

const useStyles = makeStyles({
  header: {
    backgroundColor: styles.colors.grayLighter,
    padding: `${styles.spacing.xxs}px ${styles.spacing.sm}px`,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 40,
    '-webkit-user-select': 'none',
    '-webkit-app-region': 'drag',
    '& img': {
      width: 120,
    },
    '& > span': {
      top: 8,
      position: 'absolute',
      right: styles.spacing.sm,
    },
    '& .MuiButtonBase-root': {
      position: 'absolute',
      left: styles.spacing.xs,
    },
    '& .MuiTypography-root': {
      color: styles.colors.grayDarker,
      textAlign: 'center',
      width: '100%',
    },
  },
})
