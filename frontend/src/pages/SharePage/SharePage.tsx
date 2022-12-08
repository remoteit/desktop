import React, { useEffect } from 'react'
import { makeStyles } from '@mui/styles'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { useParams, useLocation, useHistory } from 'react-router-dom'
import { Typography, IconButton, Tooltip, CircularProgress } from '@mui/material'
import { spacing, fontSizes } from '../../styling'
import { getOrganization } from '../../models/organization'
import { ContactSelector } from '../../components/ContactSelector'
import { selectDevice } from '../../selectors/devices'
import { SharingForm } from '../../components/SharingForm'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { Avatar } from '../../components/Avatar'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'

type IParams = { userID: string; serviceID: string; deviceID: string }

export const SharePage: React.FC = () => {
  const { userID = '', serviceID = '', deviceID = '' } = useParams<IParams>()
  const { shares, organization } = useDispatch<Dispatch>()
  const { device, contacts, guests, deleting, users } = useSelector((state: ApplicationState) => {
    const device = selectDevice(state, undefined, deviceID)
    return {
      device,
      contacts: state.contacts.all,
      guests: device ? device.access : (getOrganization(state).guests as IUserRef[]),
      deleting: state.shares.deleting,
      users: state.shares.currentDevice?.users || [],
    }
  })
  const location = useLocation()
  const history = useHistory()
  const css = useStyles()
  const guest = guests.find(g => g.id === userID)
  const email = guest?.email || ''

  useEffect(() => {
    ;(async () => {
      if (!guest && userID) await organization.fetch()
      await shares.fetch({ email, serviceID, device })
    })()
  }, [])

  const handleUnshare = async () => {
    if (device) await shares.delete({ deviceId: device.id, email })
    history.push(location.pathname.replace(REGEX_LAST_PATH, ''))
  }

  const handleChange = (emails: string[]) => {
    shares.selectContacts(emails)
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
