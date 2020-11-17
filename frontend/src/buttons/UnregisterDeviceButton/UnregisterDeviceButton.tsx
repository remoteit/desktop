import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Tooltip, IconButton, CircularProgress } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Confirm } from '../../components/Confirm'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import analyticsHelper from '../../helpers/analyticsHelper'
import styles from '../../styling'

type Props = {
  device?: IDevice
}

export const UnregisterDeviceButton: React.FC<Props> = ({ device }) => {
  const css = useStyles()
  const [open, setOpen] = useState<boolean>(false)
  const { ui } = useDispatch<Dispatch>()
  const { setupBusy, setupDeletingDevice } = useSelector((state: ApplicationState) => ({
    setupBusy: state.ui.setupBusy,
    setupDeletingDevice: state.ui.setupDeletingDevice,
  }))

  if (!device) return null

  return setupDeletingDevice ? (
    <CircularProgress className={css.loading} size={styles.fontSizes.md} />
  ) : (
    <>
      <Tooltip title="Unregister Device">
        <IconButton onClick={() => setOpen(true)} disabled={setupBusy}>
          <Icon name="trash-alt" size="md" fixedWidth />
        </IconButton>
      </Tooltip>
      <Confirm
        open={open}
        onConfirm={() => {
          analyticsHelper.track('deviceRemoved', device)
          ui.set({ setupDeletingDevice: true, setupBusy: true })
          emit('device', 'DELETE')
        }}
        onDeny={() => setOpen(false)}
        title="Are you sure?"
      >
        You are about to permanently remove this device and all of its services.
      </Confirm>
    </>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
