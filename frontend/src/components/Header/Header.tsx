import React, { useEffect, useState } from 'react'
import { makeStyles, IconButton } from '@material-ui/core'
import { useHistory, useLocation } from 'react-router-dom'
import { ApplicationState } from '../../store'
import { getOwnDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { isElectron } from '../../services/Browser'
import { useSelector } from 'react-redux'
import { Typography } from '@material-ui/core'
import { Icon } from '../Icon'
import styles from '../../styling'

export const Header: React.FC<{ menuOverlaps?: boolean }> = ({ menuOverlaps }) => {
  const [hasFocus, setHasFocus] = useState<boolean>(true)

  const history = useHistory()
  const location = useLocation()
  const color = hasFocus ? 'grayDark' : 'grayLight'

  console.log('HISTORY', history, location)

  const css = useStyles(styles.colors[color], menuOverlaps && isElectron())()
  const { device } = useSelector((state: ApplicationState) => ({
    device: getOwnDevices(state).find(d => d.id === state.backend.device.uid),
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
      <Typography variant="body2">
        <IconButton onClick={() => history.goBack()}>
          <Icon name="chevron-left" size="md" type="regular" color={color} fixedWidth />
        </IconButton>
        <IconButton onClick={() => history.goForward()}>
          <Icon name="chevron-right" size="md" type="regular" color={color} fixedWidth />
        </IconButton>
        {device ? attributeName(device) : 'remote.it'}
      </Typography>
    </div>
  )
}

const useStyles = (color, moveMenu) =>
  makeStyles({
    header: {
      padding: `${styles.spacing.xxs}px ${styles.spacing.md}px`,
      marginTop: moveMenu ? 30 : 0,
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      minHeight: 40,
      position: 'relative',
      width: '100%',
      '-webkit-user-select': 'none',
      '-webkit-app-region': 'drag',
      '& .MuiTypography-root': {
        color,
      },
    },
  })
