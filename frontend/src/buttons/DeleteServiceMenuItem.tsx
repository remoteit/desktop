import React, { useState } from 'react'
import { MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { Confirm } from '../components/Confirm'
import { Icon } from '../components/Icon'

type Props = {
  device?: IDevice
  service?: IService
  target?: ITarget
}

export const DeleteServiceMenuItem: React.FC<Props> = ({ device, service, target }) => {
  const [open, setOpen] = useState<boolean>(false)
  const { devices, backend } = useDispatch<Dispatch>()
  const { deleting, setupBusy } = useSelector((state: ApplicationState) => ({
    setupBusy: state.ui.setupBusy,
    deleting:
      (service && state.ui.setupDeletingService === service.id) || (target && state.ui.setupServiceBusy === target.uid),
  }))

  let disabled = deleting || setupBusy

  if (!service) return null
  if (!device?.permissions.includes('MANAGE')) disabled = true

  let title = 'Delete this service'
  let message = "Deleting services can't be undone."

  if (target) {
    title = 'Unregister Service'
    message =
      "Deleting services can't be undone. If this service is providing you remote access, you may have to physically connect to the device to recover it."
  }

  return (
    <>
      <MenuItem dense disableGutters onClick={() => setOpen(true)} disabled={disabled}>
        <ListItemIcon>
          <Icon
            size="md"
            name={deleting ? 'spinner-third' : 'trash'}
            color={deleting ? 'danger' : undefined}
            spin={deleting}
          />
        </ListItemIcon>
        <ListItemText primary={title} />
      </MenuItem>
      <Confirm
        open={open}
        onConfirm={() => {
          if (target) backend.removeTargetService(target)
          else if (device && service) devices.cloudRemoveService({ serviceId: service.id, deviceId: device.id })
          setOpen(false)
        }}
        onDeny={() => setOpen(false)}
        title="Are you sure?"
      >
        {message}
      </Confirm>
    </>
  )
}
