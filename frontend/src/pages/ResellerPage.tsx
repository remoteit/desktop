import React from 'react'
import { Redirect } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, Divider, Box } from '@mui/material'
import { selectPermissions, selectOrganization, selectOrganizationReseller } from '../selectors/organizations'
import { CustomerList } from '../components/CustomerList'
import { ResellerLogo } from '../components/ResellerLogo'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

export const ResellerPage: React.FC = () => {
  const organization = useSelector(selectOrganization)
  const permissions = useSelector(selectPermissions)
  const reseller = useSelector(selectOrganizationReseller)
  const canManage = permissions?.includes('MANAGE')

  if (!permissions?.includes('ADMIN') || !reseller)
    return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container
      bodyProps={{ inset: false, verticalOverflow: true, horizontalOverflow: true }}
      integrated
      header={
        <>
          <Typography variant="h1">
            <Title>Customers</Title>
            {organization?.id && (
              <IconButton
                title="Add customer"
                icon="user-plus"
                to="/organization/customer/add"
                size="md"
                type="solid"
              />
            )}
          </Typography>
          <ResellerLogo marginLeft={5} reseller={reseller} size="small" />
          {!canManage && (
            <Notice severity="warning" gutterTop>
              You do not have permission to manage customers.
            </Notice>
          )}
        </>
      }
    >
      <Box position="relative" overflow="scroll">
        <CustomerList customers={reseller?.customers || []} disabled={!canManage} />
      </Box>
    </Container>
  )
}
