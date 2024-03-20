import React from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { useParams, Redirect, Link } from 'react-router-dom'
import { Typography, Button } from '@mui/material'
import { LicensingSetting } from '../components/LicensingSetting'
import { selectCustomer } from '../selectors/organizations'
import { DeleteButton } from '../buttons/DeleteButton'
import { FormDisplay } from '../components/FormDisplay'
import { Container } from '../components/Container'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'

export const CustomerPage: React.FC = () => {
  const { userID = '' } = useParams<{ userID: string }>()
  const customer = useSelector((state: State) => selectCustomer(state, undefined, userID))
  const license = customer?.license
  const limits = customer?.limits

  if (!customer) return <Redirect to={{ pathname: '/organization/customer', state: { isRedirect: true } }} />

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1" marginTop={1} gutterBottom>
          <Title>
            <Avatar email={customer?.email} marginRight={16} />
            {customer?.email}
          </Title>
          <DeleteButton onDelete={() => {}} />
          {/* @TODO replace with RemoveCustomer */}
        </Typography>
      }
    >
      <Typography variant="subtitle1" marginRight={3}>
        <Title>License</Title>
        <Button to={`/organization/customer/${userID}/plans`} size="small" variant="contained" component={Link}>
          Update Plan
        </Button>
      </Typography>
      <LicensingSetting licenses={license ? [{ ...license, limits }] : []} />
      <FormDisplay
        icon={<Avatar email={customer?.reseller} size={28} />}
        label="Sales Rep"
        displayValue={customer?.reseller}
        displayOnly
      />
    </Container>
  )
}
