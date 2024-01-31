import React, { useEffect, useContext } from 'react'
import { makeStyles } from '@mui/styles'
import { DeviceContext } from '../../services/Context'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { useParams, useHistory } from 'react-router-dom'
import { Typography, IconButton, Tooltip, CircularProgress } from '@mui/material'
import { spacing, fontSizes } from '../../styling'
import { selectOrganization } from '../../selectors/organizations'
import { ContactSelector } from '../../components/ContactSelector'
import { SharingForm } from '../../components/SharingForm'
import { getAccess } from '../../helpers/userHelper'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { Avatar } from '../../components/Avatar'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'

export const SharePage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { device, service } = useContext(DeviceContext)
  const { userID = '' } = useParams<{ userID?: string }>()
  const { contacts, guests, deleting, users } = useSelector((state: State) => {
    return {
      device,
      contacts: state.contacts.all,
      guests: device ? device.access : (selectOrganization(state).guests as IUserRef[]),
      deleting: state.shares.deleting,
      users: state.shares.currentDevice?.users || [],
    }
  })
  const history = useHistory()
  const css = useStyles()
  const guest = guests.find(g => g.id === userID)
  const email = guest?.email || ''

  useEffect(() => {
    ;(async () => {
      if (!service || !device) return
      if (!guest && userID) await dispatch.organization.fetch()
      await dispatch.shares.fetch({ email, serviceId: service.id, device })
      await dispatch.contacts.fetch()
    })()

    // set defaults
    if (device?.loaded) {
      const access = getAccess(device, email)
      console.log('ACCESS', access)
      dispatch.shares.setSelectedServices(access.services.map(s => s.id))
      dispatch.shares.setScript(access.scripting)
    }
  }, [device?.loaded])

  const handleUnshare = async () => {
    if (device) await dispatch.shares.delete({ deviceId: device.id, email })
    history.goBack()
  }

  const handleChange = (emails: string[]) => {
    dispatch.shares.selectContacts(emails)
  }

  return (
    <Container
      header={
        email ? (
          <Typography variant="h1" gutterBottom>
            <Title>
              <Avatar email={email} inline />
              {email}
            </Title>
            {deleting ? (
              <CircularProgress className={css.loading} size={fontSizes.md} />
            ) : (
              <Tooltip title={`Remove ${email}`}>
                <IconButton onClick={handleUnshare} disabled={deleting} size="large">
                  <Icon name="trash" size="md" fixedWidth />
                </IconButton>
              </Tooltip>
            )}
          </Typography>
        ) : !guest && userID ? (
          <Typography variant="h1" gutterBottom>
            <Icon name="spinner-third" type="solid" size="lg" color="gray" spin inlineLeft /> Loading...
          </Typography>
        ) : (
          device && (
            <Gutters>
              <ContactSelector contacts={contacts} selected={users} onSelect={handleChange} />
            </Gutters>
          )
        )
      }
    >
      {device && <SharingForm device={device} user={guest} />}
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  loading: { color: palette.danger.main, margin: spacing.sm },
}))
