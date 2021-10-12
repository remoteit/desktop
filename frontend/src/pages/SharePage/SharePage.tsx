import React, { useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { makeStyles, Typography, IconButton, Tooltip, CircularProgress } from '@material-ui/core'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { useHistory } from 'react-router-dom'
import { ContactSelector } from '../../components/ContactSelector'
import analyticsHelper from '../../helpers/analyticsHelper'
import styles from '../../styling'
import { SharingForm } from '../../components/SharingForm'

export const SharePage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { email = '', serviceID = '' } = useParams<{ email: string; serviceID: string }>()
  const { shares } = useDispatch<Dispatch>()
  const {
    contacts = [],
    user,
    userSelected,
    deleting,
  } = useSelector((state: ApplicationState) => ({
    contacts: state.devices.contacts,
    user: state.devices.contacts.find(c => c.email === email),
    userSelected: state.shares.currentDevice?.userSelected,
    deleting: state.shares.deleting,
  }))
  const location = useLocation()
  const history = useHistory()
  const css = useStyles()

  useEffect(() => {
    analyticsHelper.page('SharePage')
    shares.fetch({ email, serviceID, device })
  }, [])

  if (!device) return null

  const handleUnshare = async () => {
    await shares.delete({ deviceId: device.id, email })
    history.push(location.pathname.replace(email ? `/${email}` : '/share', ''))
  }

  const handleChange = (emails: string[]) => {
    shares.selectContacts(emails)
  }

  return (
    <Container
      header={
        <>
          <Typography variant="h1">
            {email ? (
              <>
                <Title>{email || 'Share'}</Title>
                {deleting ? (
                  <CircularProgress className={css.loading} size={styles.fontSizes.md} />
                ) : (
                  <Tooltip title={`Remove ${email}`}>
                    <IconButton onClick={handleUnshare} disabled={deleting}>
                      <Icon name="trash" size="md" fixedWidth />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            ) : (
              device && (
                <ContactSelector
                  contacts={contacts}
                  selected={contacts.filter(c => device.access.find(s => s.email === c.email))}
                  onChange={handleChange}
                />
              )
            )}
          </Typography>
        </>
      }
    >
      {device && <SharingForm device={device} user={email === '' ? userSelected : user} />}
    </Container>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
