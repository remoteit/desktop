import { Box } from '@mui/material'
import React from 'react'
import { GridListItem } from '../../components/GridListItem'
import { Icon } from '../../components/Icon'
import { AdminAdminAttribute, AdminAdminRow } from './adminAdminAttributes'

interface Props {
  admin: AdminAdminRow
  required?: AdminAdminAttribute
  attributes: AdminAdminAttribute[]
  active?: boolean
  onClick: () => void
}

export const AdminAdminListItem: React.FC<Props> = ({ admin, required, attributes, active, onClick }) => {
  return (
    <GridListItem
      onClick={onClick}
      selected={active}
      disableGutters
      icon={<Icon name="shield" size="md" color="primary" />}
      required={required?.value({ admin })}
    >
      {attributes.map(attribute => (
        <Box key={attribute.id} className="attribute">
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
            {attribute.value({ admin })}
          </Box>
        </Box>
      ))}
    </GridListItem>
  )
}
