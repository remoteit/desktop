import React from 'react'
import { State } from '../store'
import { Redirect } from 'react-router-dom'
import { Dispatch } from '../store'
import { Typography, List, Box } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { selectPermissions, selectOrganization, selectOrganizationReseller } from '../selectors/organizations'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { CustomerList } from '../components/CustomerList'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Notice } from '../components/Notice'

export const ResellerPage: React.FC = () => {
  const organization = useSelector(selectOrganization)
  const permissions = useSelector(selectPermissions)
  const reseller = useSelector(selectOrganizationReseller)
  const canManage = permissions?.includes('MANAGE')

  if (!permissions?.includes('ADMIN'))
    return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container
      bodyProps={{ inset: false, verticalOverflow: true, horizontalOverflow: true }}
      integrated
      header={
        <Typography variant="h1">
          <Title>Customers</Title>
          {organization?.id && (
            <IconButton title="Add customer" icon="user-plus" to="/organization/customer/add" size="md" />
          )}
        </Typography>
      }
    >
      {!canManage && (
        <Notice severity="warning" gutterTop>
          You do not have permission to manage customers.
        </Notice>
      )}
      <Box position="relative" overflow="scroll">
        <CustomerList customers={reseller?.customers || []} disabled={!canManage} />
      </Box>
    </Container>
  )
}
