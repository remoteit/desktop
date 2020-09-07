import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Tooltip, IconButton, CircularProgress } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import analyticsHelper from '../../helpers/analyticsHelper'
import styles from '../../styling'

type Props = {
  targetDevice?: ITargetDevice
}

export const UnregisterDeviceButton: React.FC<Props> = ({ targetDevice }) => {
  const css = useStyles()
  const { ui } = useDispatch<Dispatch>()
  const { setupBusy, setupDeletingDevice } = useSelector((state: ApplicationState) => ({
    setupBusy: state.ui.setupBusy,
    setupDeletingDevice: state.ui.setupDeletingDevice,
  }))
  const confirmMessage = 'Are you sure?\nYou are about to permanently remove this device and all of its services.'

  if (!targetDevice) return null

  const onDelete = () => {
    analyticsHelper.track('deviceRemoved', { ...targetDevice, id: targetDevice.uid })
    ui.set({ setupDeletingDevice: true, setupBusy: true })
    emit('device', 'DELETE')
  }

  return setupDeletingDevice ? (
    <CircularProgress className={css.loading} size={styles.fontSizes.md} />
  ) : (
    <Tooltip title="Unregister Device">
      <IconButton onClick={() => window.confirm(confirmMessage) && onDelete()} disabled={setupBusy}>
        <Icon name="trash-alt" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
