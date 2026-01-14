import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { Typography, List, ListItemText, Box, Divider } from '@mui/material'
import { Container } from '../../components/Container'
import { ListItemLocation } from '../../components/ListItemLocation'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { IconButton } from '../../buttons/IconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { spacing } from '../../styling'
import { graphQLAdminUser } from '../../services/graphQLRequest'

type Props = {
  showRefresh?: boolean
}

export const AdminUserDetailPage: React.FC<Props> = ({ showRefresh = true }) => {
  const { userId } = useParams<{ userId: string }>()
  const history = useHistory()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async () => {
    setLoading(true)
    setUser(null) // Clear stale data
    const result = await graphQLAdminUser(userId)
    if (result !== 'ERROR' && result?.data?.data?.admin?.users?.items?.[0]) {
      setUser(result.data.data.admin.users.items[0])
    }
    setLoading(false)
  }

  const handleBack = () => {
    history.push('/admin/users')
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

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <Box>
          <Box sx={{ height: 45, display: 'flex', alignItems: 'center', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
            <IconButton
              icon="chevron-left"
              title="Back to Users"
              onClick={handleBack}
              size="md"
            />
            {showRefresh && (
              <IconButton
                icon="sync"
                title="Refresh user"
                onClick={fetchUser}
                spin={loading}
                size="md"
              />
            )}
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
