import React from 'react'
import { Typography, IconButton } from '@material-ui/core'
import { Breadcrumbs } from '../Breadcrumbs'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { useLocation, useHistory } from 'react-router-dom'

export const SharedUsersHeader = () => {

  const location = useLocation()
  const history = useHistory()

  const onClick = () => history.push(`${location.pathname}/share`)

  return (
    <div>
      <>
      <Breadcrumbs />
      <Typography variant="h1">
        <Icon name="user-friends" size="lg" />
        <Title>Shared users</Title>
        <div>
          <IconButton onClick={onClick}>
            <Icon name="user-plus" size="md" type="light" />
          </IconButton>
        </div>
      </Typography>
      </>
    </div>
  )
    
}

export default SharedUsersHeader
