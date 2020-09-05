import React, { useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Typography, IconButton, Tooltip, CircularProgress } from '@material-ui/core'
import { DeviceShareContainer } from '../../components/DeviceShareContainer'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { useHistory } from 'react-router-dom'
import analyticsHelper from '../../helpers/analyticsHelper'
import { makeStyles } from '@material-ui/core/styles'
import styles from '../../styling'

export const SharePage = () => {
  const { shares } = useDispatch<Dispatch>()
  const { deleting } = useSelector((state: ApplicationState) => state.shares)
  const { email = '' } = useParams()
  const { deviceID = '' } = useParams()
  const location = useLocation()
  const history = useHistory()
  const css = useStyles()

  useEffect(() => {
    analyticsHelper.page('SharePage')
  }, [])

  const handleUnshare = async () => {
    await shares.delete({ deviceID, email })
    history.push(location.pathname.replace(email ? `/${email}` : '/share', ''))
  }

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          {email && (
            <Typography variant="h1">
              <Icon name={email === '' ? 'user-plus' : 'user'} size="lg" />
              <Title>{email || 'Share'}</Title>
              {deleting ? (
                <CircularProgress className={css.loading} size={styles.fontSizes.md} />
              ) : (
                <Tooltip title={`Remove ${email}`}>
                  <IconButton onClick={handleUnshare} disabled={deleting}>
                    <Icon name="trash-alt" size="md" fixedWidth />
                  </IconButton>
                </Tooltip>
              )}
            </Typography>
          )}
        </>
      }
    >
      <DeviceShareContainer username={email} />
    </Container>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
