import React, { useState } from 'react'
import { useParams, useLocation, useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Typography, Button } from '@mui/material'
import { ContactSelector } from '../components/ContactSelector'
import { selectOrganization } from '../selectors/organizations'
import { selectNetwork } from '../models/networks'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

export const NetworkSharePage = () => {
  const { networkID = '' } = useParams<{ networkID: string }>()
  const { network, contacts } = useSelector((state: ApplicationState) => {
    const organization = selectOrganization(state)
    return {
      network: selectNetwork(state, networkID),
      contacts: state.contacts.all.filter(c => !organization.members.find(s => s.user.id === c.id)) || [],
    }
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [emails, setEmails] = useState<string[]>([])
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()

  const exit = () => history.push(location.pathname.replace('/share', '/users'))
  const add = async () => {
    setLoading(true)
    await dispatch.networks.shareNetwork({ id: network.id, emails })
    exit()
  }

  return (
    <Container
      bodyProps={{ inset: false, gutterTop: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>Share {network.name || 'Network'}</Title>
          </Typography>
          <Gutters top={null}>
            <ContactSelector contacts={contacts} selected={emails} onSelect={setEmails} />
          </Gutters>
        </>
      }
    >
      <Gutters>
        <Notice gutterTop fullWidth>
          Granting connection access to all the services in this network.
        </Notice>
      </Gutters>
      <Gutters top="xl">
        <Button onClick={add} variant="contained" color="primary" disabled={!emails.length || loading}>
          {loading ? 'Sharing...' : 'Share'}
        </Button>
        <Button onClick={exit}>Cancel</Button>
      </Gutters>
    </Container>
  )
}
