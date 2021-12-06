import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Divider, IconButton, makeStyles, Menu, MenuItem, Typography } from '@material-ui/core'
import { Notice } from '../components/Notice'
import { DeleteButton } from './DeleteButton'
import { Icon } from '../components/Icon'
import { TransferButton } from './TransferButton'
import { colors } from '../styling'
import { useHistory } from 'react-router-dom'

type Props = { device?: IDevice }
const ITEM_HEIGHT = 48

export const OptionDeviceButton: React.FC<Props> = ({ device }) => {
  const { devices } = useDispatch<Dispatch>()
  const { destroying, userId } = useSelector((state: ApplicationState) => ({
    userId: state.auth.user?.id,
    destroying: state.devices.destroying,
  }))
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const history = useHistory()


  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null)
  }

  const onDelete = () => {
    device && devices.destroy(device)
    setAnchorEl(null)
  }

  const onTransfer = () => {
    device && history.push(`/devices/${device.id}/transfer`)
    setAnchorEl(null)
  }
  let disabled: boolean = false
  let icon: string = 'ellipsis-v'
  let tooltip: string = 'Delete this device'
  let warning: string | React.ReactElement = (
    <>
      <Notice severity="danger" gutterBottom fullWidth>
        Deleting devices can't be undone so may require you to physically access the device if you wish to recover it.
      </Notice>
      <Typography variant="body2">
        We recommend uninstalling remote.it before <br />
        deleting devices.
      </Typography>
    </>
  )

  if (!device || device.accountId !== userId) return null

  if (device.state === 'active') {
    disabled = true
    tooltip = 'Device must be offline'
  }

  if (device.shared) {
    disabled = false
    icon = 'sign-out'
    tooltip = 'Leave Device'
    warning = 'This device will have to be re-shared to you if you wish to access it again.'
  }

  return (
    <div>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <Icon name={icon} />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4,
            borderRadius: 3,
          }
        }}
        MenuListProps={{ disablePadding: true }}
      >
        {anchorEl && (
          <>
            <TransferButton
              tooltip={tooltip}
              disabled={disabled}
              label='Transfer Device'
              onTransfer={onTransfer}
            />
            <Divider />
            <DeleteButton
              warning={warning}
              tooltip={tooltip}
              disabled={disabled}
              destroying={destroying}
              onDelete={onDelete}
              color={colors.danger}
              label='Delete'
            />
          </>
        )}

      </Menu>
    </div>
  )
}


const useStyles = makeStyles({
  deleteItem: {
    color: colors.danger,
    margin: 0,
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0
  },
  transferItem: {
    margin: 0,
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0
  },
  menu: {
    paddingTop: 0,
    paddingBottom: 0
  }
})
