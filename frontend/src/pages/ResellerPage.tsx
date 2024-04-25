import React from 'react'
import { Dispatch } from '../store'
import { Redirect } from 'react-router-dom'
import { Typography, Box } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { selectPermissions, selectOrganization, selectOrganizationReseller } from '../selectors/organizations'
import { CSVDownloadButton } from '../buttons/CSVDownloadButton'
import { CustomerList } from '../components/CustomerList'
import { ResellerLogo } from '../components/ResellerLogo'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Title } from '../components/Title'

export const ResellerPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const organization = useSelector(selectOrganization)
  const permissions = useSelector(selectPermissions)
  const reseller = useSelector(selectOrganizationReseller)

  if (!reseller) return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container
      bodyProps={{ inset: false, verticalOverflow: true, horizontalOverflow: true }}
      integrated
      header={
        <>
          <Typography variant="h1">
            <Title>Customers</Title>
            <CSVDownloadButton fetchUrl={dispatch.organization.resellerReportUrl} />
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
        </>
      }
    >
      <Box position="relative" overflow="scroll">
        <CustomerList customers={reseller?.customers || []} />
      </Box>
    </Container>
  )
}
