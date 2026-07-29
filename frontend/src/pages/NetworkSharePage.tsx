import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useLocation, useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { Typography, Button } from '@mui/material'
import { ContactSelector } from '../components/ContactSelector'
import { selectOrganization } from '../selectors/organizations'
import { selectNetwork } from '../models/networks'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

export const NetworkSharePage = () => {
  const { t } = useTranslation()
  const { networkID = '' } = useParams<{ networkID: string }>()
  const { network, contacts } = useSelector((state: State) => {
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
            <Title>
              {t('networkSharePage.shareTitle', {
                name: network.name || t('networkSharePage.network', 'Network'),
                defaultValue: 'Share {{name}}',
              })}
            </Title>
          </Typography>
          <Gutters top={null}>
            <ContactSelector contacts={contacts} selected={emails} onSelect={setEmails} />
          </Gutters>
        </>
      }
    >
      <Gutters>
        <Notice gutterTop fullWidth>
          {t('networkSharePage.grantingAccess', 'Granting connection access to all the services in this network.')}
        </Notice>
      </Gutters>
      <Gutters top="xl">
        <Button onClick={add} variant="contained" color="primary" disabled={!emails.length || loading}>
          {loading ? t('networkSharePage.sharingEllipsis', 'Sharing...') : t('networkSharePage.share', 'Share')}
        </Button>
        <Button onClick={exit}>{t('common.cancel', 'Cancel')}</Button>
      </Gutters>
    </Container>
  )
}
