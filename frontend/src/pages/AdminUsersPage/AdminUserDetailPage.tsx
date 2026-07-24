import React, { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Typography, List, ListItemText, Box, Divider } from '@mui/material'
import { Container } from '../../components/Container'
import { ListItemLocation } from '../../components/ListItemLocation'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { LoadingMessage } from '../../components/LoadingMessage'
import { IconButton } from '../../buttons/IconButton'
import { spacing } from '../../styling'
import { Dispatch, State } from '../../store'
import browser from '../../services/browser'
import { windowOpen } from '../../services/browser'

export const AdminUserDetailPage: React.FC = () => {
  const { t } = useTranslation()
  const { userId } = useParams<{ userId: string }>()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const user = useSelector((state: State) => state.adminUsers.detailCache[userId])
  const [loading, setLoading] = useState(!user)

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async (forceRefresh = false) => {
    setLoading(true)
    await dispatch.adminUsers.fetchUserDetail({ userId, force: forceRefresh })
    setLoading(false)
  }

  if (loading && !user) {
    return (
      <Container gutterBottom>
        <LoadingMessage message={t('adminUserDetailPage.loadingUser', 'Loading user...')} />
      </Container>
    )
  }

  if (!user) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {t('adminUserDetailPage.userNotFound', 'User not found')}
          </Typography>
        </Body>
      </Container>
    )
  }

  const deviceCount = user.info?.devices?.total || 0
  const deviceOnline = user.info?.devices?.online || 0

  const handleViewAsUser = () => {
    const viewAs = `/devices?viewAs=${user.id},${encodeURIComponent(user.email || '')}`
    if (browser.isElectron || browser.isMobile) {
      history.push(viewAs)
      return
    }
    windowOpen(`${window.location.href.split('#')[0]}#${viewAs}`, '_blank')
  }

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <Box>
          <Box sx={{ height: 45, display: 'flex', alignItems: 'center', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
            <IconButton
              icon="eye"
              title={t('adminUserDetailPage.viewAsUser', 'View as User')}
              onClick={handleViewAsUser}
              size="md"
              color="primary"
            />
          </Box>
          <List>
            <ListItemLocation
              to={`/admin/users/${user.id}/account`}
              match={`/admin/users/${user.id}/account`}
              icon={<Icon name="user" size="lg" color="grayDark" />}
              title={<Title>{user.email || user.id}</Title>}
            />
          </List>
          <Divider />
        </Box>
      }
    >
      <Typography variant="subtitle1">
        <Title>{t('adminUserDetailPage.devices', 'Devices')}</Title>
      </Typography>
      <List>
        <ListItemLocation
          to={`/admin/users/${user.id}/devices`}
          match={`/admin/users/${user.id}/devices`}
          dense
          icon={<Icon name="router" size="md" />}
        >
          <ListItemText
            primary={t('adminUserDetailPage.userDevices', 'User Devices')}
            secondary={t('adminUserDetailPage.deviceSummary', {
              total: deviceCount,
              online: deviceOnline,
              offline: deviceCount - deviceOnline,
              defaultValue: '{{total}} total • {{online}} online • {{offline}} offline',
            })}
          />
        </ListItemLocation>
      </List>
    </Container>
  )
}
