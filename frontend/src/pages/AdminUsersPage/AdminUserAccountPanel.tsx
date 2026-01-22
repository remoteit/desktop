import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Typography, List, ListItem, ListItemText, Box, Divider } from '@mui/material'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Dispatch } from '../../store'

export const AdminUserAccountPanel: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const dispatch = useDispatch<Dispatch>()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async () => {
    setLoading(true)
    const userData = await dispatch.adminUsers.fetchUserDetail(userId)
    setUser(userData)
    setLoading(false)
  }

  if (loading) {
    return (
      <Container gutterBottom>
        <LoadingMessage message="Loading account..." />
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
  const deviceOffline = deviceCount - deviceOnline

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Typography variant="h2" sx={{ padding: 2 }}>
          <Title>Account Details</Title>
        </Typography>
      }
    >
      <List disablePadding>
        <ListItem>
          <ListItemText
            primary="User ID"
            secondary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  component="span"
                  sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                >
                  {user.id}
                </Typography>
                <CopyIconButton value={user.id} size="sm" />
              </Box>
            }
          />
        </ListItem>
        <Divider component="li" />

        <ListItem>
          <ListItemText
            primary="Email"
            secondary={user.email || 'N/A'}
          />
        </ListItem>
        <Divider component="li" />

        {user.organization?.name && (
          <>
            <ListItem>
              <ListItemText
                primary="Organization"
                secondary={user.organization.name}
              />
            </ListItem>
            <Divider component="li" />
          </>
        )}

        <ListItem>
          <ListItemText
            primary="Created"
            secondary={user.created ? new Date(user.created).toLocaleString() : 'N/A'}
          />
        </ListItem>
        <Divider component="li" />

        <ListItem>
          <ListItemText
            primary="Last Login"
            secondary={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
          />
        </ListItem>
      </List>

      <Typography variant="subtitle1" sx={{ marginTop: 3, paddingX: 2 }}>
        <Title>Device Summary</Title>
      </Typography>
      <List disablePadding>
        <ListItem>
          <ListItemText
            primary="User Devices"
            secondary={`${deviceCount} total • ${deviceOnline} online • ${deviceOffline} offline`}
          />
        </ListItem>
      </List>
    </Container>
  )
}

