import { Box } from '@mui/material'
import React from 'react'
import { GridListItem } from '../../components/GridListItem'
import { Icon } from '../../components/Icon'
import { AdminUserAttribute,AdminUserRow } from './adminUserAttributes'

interface Props {
  user: AdminUserRow
  required?: AdminUserAttribute
  attributes: AdminUserAttribute[]
  active?: boolean
  onClick: () => void
}

export const AdminUserListItem: React.FC<Props> = ({
  user,
  required,
  attributes,
  active,
  onClick,
}) => {
  return (
    <GridListItem
      onClick={onClick}
      selected={active}
      disableGutters
      icon={<Icon name={user.admin ? 'shield' : 'user'} size="md" color={user.admin ? 'primary' : undefined} />}
      required={required?.value({ user })}
    >
      {attributes.map(attribute => (
        <Box key={attribute.id} className="attribute">
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
            {attribute.value({ user })}
          </Box>
        </Box>
      ))}
    </GridListItem>
  )
}
