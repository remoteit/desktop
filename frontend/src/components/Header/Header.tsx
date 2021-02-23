import React, { useEffect, useState } from 'react'
import { makeStyles, IconButton } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { getOwnDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { useSelector } from 'react-redux'
import { Breadcrumbs } from '../Breadcrumbs'
import { isRemoteUI } from '../../helpers/uiHelper'
import { useHistory } from 'react-router-dom'
import { isElectron } from '../../services/Browser'
import { Typography } from '@material-ui/core'
import { Icon } from '../Icon'
import styles from '../../styling'

export const Header: React.FC<{ menuOverlaps?: boolean }> = ({ menuOverlaps }) => {
  const [hasFocus, setHasFocus] = useState<boolean>(true)

  const history = useHistory()

  const css = useStyles(hasFocus, menuOverlaps && isElectron())()
  const { device, remoteUI } = useSelector((state: ApplicationState) => ({
    device: getOwnDevices(state).find(d => d.id === state.backend.device.uid),
    remoteUI: isRemoteUI(state),
  }))

  const focus = () => setHasFocus(true)
  const blur = () => setHasFocus(false)

  useEffect(() => {
    window.addEventListener('focus', focus)
    window.addEventListener('blur', blur)
    return function cleanup() {
      window.removeEventListener('focus', focus)
      window.removeEventListener('blur', blur)
    }
  })

  return (
    <div className={css.header}>
      <Typography variant="body2" color="textSecondary">
        <IconButton onClick={() => history.goBack()}>
          <Icon name="chevron-left" size="md" type="regular" color="grayDark" fixedWidth />
        </IconButton>
        <IconButton onClick={() => history.goForward()}>
          <Icon name="chevron-right" size="md" type="regular" color="grayDark" fixedWidth />
        </IconButton>
        {device ? attributeName(device) : 'remote.it'}
        {remoteUI || <Breadcrumbs />}
      </Typography>
    </div>
  )
}

const useStyles = (hasFocus, moveMenu) =>
  makeStyles({
    header: {
      padding: `${styles.spacing.xs}px ${styles.spacing.md}px`,
      paddingTop: moveMenu ? 30 : styles.spacing.xs,
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      minHeight: 40,
      position: 'relative',
      width: '100%',
      opacity: hasFocus ? 1 : 0.2,
      '-webkit-user-select': 'none',
      '-webkit-app-region': 'drag',
    },
  })
