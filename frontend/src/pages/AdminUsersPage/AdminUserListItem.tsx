import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
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
  const css = useStyles()

  return (
    <GridListItem
      onClick={onClick}
      selected={active}
      disableGutters
      icon={<Icon name="user" size="md" />}
      required={required?.value({ user })}
    >
      {attributes.map(attribute => (
        <Box key={attribute.id} className="attribute">
          <div className={css.truncate}>
            {attribute.value({ user })}
          </div>
        </Box>
      ))}
    </GridListItem>
  )
}

const useStyles = makeStyles(() => ({
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    flex: 1,
  },
}))
