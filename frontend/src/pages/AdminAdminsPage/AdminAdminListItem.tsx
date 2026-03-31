import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
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
  const css = useStyles()

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
          <div className={css.truncate}>{attribute.value({ admin })}</div>
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
