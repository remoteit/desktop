import { Box } from '@mui/material'
import React from 'react'
import { GridListItem } from '../../components/GridListItem'
import { Icon } from '../../components/Icon'
import { AdminDevice } from '../../models/adminDevices'
import { AdminDeviceAttribute } from './adminDeviceAttributes'

interface Props {
  device: AdminDevice
  required?: AdminDeviceAttribute
  attributes: AdminDeviceAttribute[]
  active?: boolean
  onClick: () => void
}

export const AdminDeviceListItem: React.FC<Props> = ({ device, required, attributes, active, onClick }) => {
  const online = device.state === 'active'

  return (
    <GridListItem
      onClick={onClick}
      selected={active}
      disableGutters
      icon={<Icon name="router" size="md" color={online ? 'primary' : 'grayDark'} />}
      required={required?.value({ device })}
    >
      {attributes.map(attribute => (
        <Box key={attribute.id} className="attribute">
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
            {attribute.value({ device })}
          </Box>
        </Box>
      ))}
    </GridListItem>
  )
}
