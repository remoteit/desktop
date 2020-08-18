import React from 'react'
import { Typography, Tooltip, IconButton } from '@material-ui/core'
import { Breadcrumbs } from '../Breadcrumbs'
import { Icon } from '../Icon'
import { Title } from '../Title'
type Props = {
    onClick?: ()=> void
  }
export const SharedUsersHeader:  React.FC<Props> = ({ onClick }) => {

  return (
    <div>
      <>
      <Breadcrumbs />
      <Typography variant="h1">
        <Icon name="user-friends" size="lg" />
        <Title>Shared users</Title>
        <Tooltip title="Add User">
          <div>
          <IconButton onClick={onClick}>
            <Icon name="user-plus" size="md" type="light" />
          </IconButton>
          </div>
        </Tooltip>
      </Typography>
      </>
    </div>
  )
    
}

export default SharedUsersHeader
