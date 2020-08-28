import React from 'react'
import { Typography } from '@material-ui/core'
import { Breadcrumbs } from '../Breadcrumbs'
import { AddUserButton } from '../../buttons/AddUserButton'
import { Icon } from '../Icon'
import { Title } from '../Title'

export const SharedUsersHeader: React.FC<{ device?: IDevice }> = ({ device }) => {
  return (
    <>
      <Breadcrumbs />
      <Typography variant="h1">
        <Icon name="user-friends" size="lg" />
        <Title>Shared users</Title>
        <AddUserButton device={device} />
      </Typography>
    </>
  )
}
