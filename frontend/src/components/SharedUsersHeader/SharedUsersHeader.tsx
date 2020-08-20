import React from 'react'
import { Typography } from '@material-ui/core'
import { Breadcrumbs } from '../Breadcrumbs'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { useLocation, useHistory } from 'react-router-dom'
import { AddUserButton } from '../../buttons/AddUserButton'

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
          <AddUserButton onAddUserClick={onClick}/>
        </div>
      </Typography>
      </>
    </div>
  )
    
}

export default SharedUsersHeader
