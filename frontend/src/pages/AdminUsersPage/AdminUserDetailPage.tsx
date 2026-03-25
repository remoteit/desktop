import React, { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Typography, List, ListItemText, Box, Divider } from '@mui/material'
import { Container } from '../../components/Container'
import { ListItemLocation } from '../../components/ListItemLocation'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { LoadingMessage } from '../../components/LoadingMessage'
import { IconButton } from '../../buttons/IconButton'
import { spacing } from '../../styling'
import { Dispatch } from '../../store'
import browser from '../../services/browser'
import { windowOpen } from '../../services/browser'

export const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async (forceRefresh = false) => {
    setLoading(true)
    if (forceRefresh) {
      dispatch.adminUsers.invalidateUserDetail(userId)
    }
    const userData = await dispatch.adminUsers.fetchUserDetail(userId)
    setUser(userData)
    setLoading(false)
  }

  if (loading) {
    return (
      <Container gutterBottom>
        <LoadingMessage message="Loading user..." />
      </Container>
    )
  }

  if (!user) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            User not found
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
              title="View as User"
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
        <Title>Devices</Title>
      </Typography>
      <List>
        <ListItemLocation
          to={`/admin/users/${user.id}/devices`}
          match={`/admin/users/${user.id}/devices`}
          dense
          icon={<Icon name="router" size="md" />}
        >
          <ListItemText
            primary="User Devices"
            secondary={`${deviceCount} total • ${deviceOnline} online • ${deviceCount - deviceOnline} offline`}
          />
        </ListItemLocation>
      </List>
    </Container>
  )
}
