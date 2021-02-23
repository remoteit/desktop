import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Tooltip, IconButton, CircularProgress } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Confirm } from '../components/Confirm'
import { Icon } from '../components/Icon'
import styles from '../styling'

type Props = {
  device?: IDevice
  service?: IService
}

export const DeleteServiceButton: React.FC<Props> = ({ device, service }) => {
  const css = useStyles()
  const [open, setOpen] = useState<boolean>(false)
  const { devices } = useDispatch<Dispatch>()
  const { deleting, userId } = useSelector((state: ApplicationState) => ({
    userId: state.auth.user?.id,
    deleting: state.ui.setupDeletingService === service?.id,
  }))
  console.log('SERVICE DELTE BUGGON', device?.accountId)
  if (!service || device?.accountId !== userId) return null

  if (deleting) return <CircularProgress className={css.loading} size={styles.fontSizes.md} />

  return (
    <>
      <Tooltip title="Delete this service">
        <span>
          <IconButton disabled={deleting} onClick={() => setOpen(true)}>
            <Icon name="trash-alt" size="md" fixedWidth />
          </IconButton>
        </span>
      </Tooltip>
      <Confirm
        open={open}
        onConfirm={() => {
          if (device) devices.cloudRemoveService({ serviceId: service.id, deviceId: device.id })
          setOpen(false)
        }}
        onDeny={() => setOpen(false)}
        title="Are you sure?"
      >
        Deleting services can't be undone.
      </Confirm>
    </>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
