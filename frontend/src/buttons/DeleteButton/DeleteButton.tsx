import React from 'react'
import { IDevice } from 'remote.it'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Tooltip, IconButton, CircularProgress } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../../components/Icon'
import styles from '../../styling'

type Props = {
  device?: IDevice
}

export const DeleteButton: React.FC<Props> = ({ device }) => {
  const { devices } = useDispatch<Dispatch>()
  const { destroying } = useSelector((state: ApplicationState) => state.devices)
  const css = useStyles()
  const warning =
    "Are you sure?\nDeleting devices can't be undone so may require you to physically access the device if you wish to recover it."

  let disabled: boolean = false
  let tooltip: string = 'Delete this device'

  if (!device) return null

  if (device.state === 'active') {
    disabled = true
    tooltip = 'Device must be offline'
  }
  if (device.shared === 'shared-from') {
    disabled = true
    tooltip = 'You must be the device owner'
  }

  const onDelete = () => {
    if (window.confirm(warning)) {
      devices.destroy(device)
    }
  }

  if (disabled) return null

  if (destroying) return <CircularProgress className={css.loading} size={styles.fontSizes.md} />

  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton disabled={disabled} onClick={onDelete}>
          <Icon name="trash-alt" size="md" fixedWidth />
        </IconButton>
      </span>
    </Tooltip>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
