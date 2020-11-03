import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Tooltip, IconButton, CircularProgress } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Confirm } from '../../components/Confirm'
import { Icon } from '../../components/Icon'
import styles from '../../styling'

type Props = {
  device?: IDevice
}

export const DeleteButton: React.FC<Props> = ({ device }) => {
  const [open, setOpen] = useState<boolean>(false)
  const { devices } = useDispatch<Dispatch>()
  const { destroying } = useSelector((state: ApplicationState) => state.devices)
  const css = useStyles()
  let warning =
    "Deleting devices can't be undone so may require you to physically access the device if you wish to recover it."

  let disabled: boolean = false
  let tooltip: string = 'Delete this device'

  if (!device) return null

  if (device.state === 'active') {
    disabled = true
    tooltip = 'Device must be offline'
  }

  if (device.shared) {
    disabled = false
    tooltip = 'Leave Device'
    warning = 'This device will have to be re-shared to you if you wish to access it again.'
  }

  if (destroying) return <CircularProgress className={css.loading} size={styles.fontSizes.md} />

  return (
    <>
      <Tooltip title={tooltip}>
        <span>
          <IconButton disabled={disabled} onClick={() => setOpen(true)}>
            <Icon name="trash-alt" size="md" fixedWidth />
          </IconButton>
        </span>
      </Tooltip>
      <Confirm
        open={open}
        onConfirm={() => devices.destroy(device)}
        onDeny={() => setOpen(false)}
        title="Are you sure?"
      >
        {warning}
      </Confirm>
    </>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
