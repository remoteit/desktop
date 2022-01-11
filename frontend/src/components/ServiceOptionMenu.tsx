import React from 'react'
import { PROTOCOL } from '../shared/constants'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Divider, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { DeleteServiceMenuItem } from '../buttons/DeleteServiceMenuItem'
import { CopyMenuItem } from './CopyMenuItem'
import { Icon } from './Icon'

type Props = { device?: IDevice; service?: IService; target?: ITarget }

export const ServiceOptionMenu: React.FC<Props> = ({ device, service, target }) => {
  const { userId } = useSelector((state: ApplicationState) => ({
    userId: state.auth.user?.id,
  }))
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  if (!device || (userId !== device.accountId && !device.permissions.includes('MANAGE'))) return null

  return (
    <div>
      <IconButton onClick={handleClick}>
        <Icon name="ellipsis-v" size="md" fixedWidth />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        getContentAnchorEl={null}
        disableScrollLock
        autoFocus={false}
        elevation={2}
      >
        <div>
          <CopyMenuItem icon="share-alt" title="Copy connection link" value={`${PROTOCOL}connect/${service?.id}`} />
        </div>
        <Divider />
        <DeleteServiceMenuItem device={device} service={service} target={target} />
      </Menu>
    </div>
  )
}
