import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Typography, List, ListItem, ListItemText, Box, Divider, Button } from '@mui/material'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../buttons/IconButton'
import { Body } from '../../components/Body'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Confirm } from '../../components/Confirm'
import { Dispatch } from '../../store'
import { spacing } from '../../styling'
import { graphQLAdminUser } from '../../services/graphQLRequest'
import { graphQLRemoveAdmin } from '../../services/graphQLMutation'

interface Props {
  showBackArrow?: boolean
  onAdminRemoved?: () => void
}

export const AdminAdminDetailPanel: React.FC<Props> = ({ showBackArrow, onAdminRemoved }) => {
  const { adminId } = useParams<{ adminId: string }>()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    if (adminId) {
      fetchAdmin()
    }
  }, [adminId])

  const fetchAdmin = async () => {
    setLoading(true)
    try {
      const result = await graphQLAdminUser(adminId)
      const user = result !== 'ERROR' ? result?.data?.data?.admin?.users?.items?.[0] : null
      if (user?.admin) {
        setAdmin(user)
      } else {
        setAdmin(null)
      }
    } catch (error) {
      console.error('Failed to fetch admin:', error)
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAdmin = async () => {
    setRemoving(true)
    try {
      const result = await graphQLRemoveAdmin(adminId)
      if (result !== 'ERROR') {
        dispatch.ui.set({ successMessage: `Admin privileges removed from ${admin?.email}` })
        setRemoveConfirmOpen(false)
        dispatch.adminUsers.invalidateUserDetail(adminId)
        dispatch.adminUsers.fetch(undefined)
        history.push('/admin/admins')
        onAdminRemoved?.()
        window.dispatchEvent(new Event('refreshAdminData'))
      } else {
        dispatch.ui.set({ errorMessage: 'Failed to remove admin privileges' })
      }
    } catch (error) {
      console.error('Error removing admin:', error)
      dispatch.ui.set({ errorMessage: 'Failed to remove admin privileges' })
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <Container gutterBottom>
        <LoadingMessage message="Loading admin details..." />
      </Container>
    )
  }

  if (!admin) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            Admin not found
          </Typography>
        </Body>
      </Container>
    )
  }

  const deviceCount = admin.info?.devices?.total || 0
  const deviceOnline = admin.info?.devices?.online || 0
  const deviceOffline = deviceCount - deviceOnline

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Box>
          {showBackArrow && (
            <Box sx={{ height: 45, display: 'flex', alignItems: 'center', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
              <IconButton
                icon="chevron-left"
                title="Back to Admins"
                onClick={() => history.push('/admin/admins')}
                size="md"
                color="grayDarker"
              />
            </Box>
          )}
          <Typography variant="h2" sx={{ padding: 2 }}>
            <Title>Admin Details</Title>
          </Typography>
        </Box>
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
                  {admin.id}
                </Typography>
                <CopyIconButton value={admin.id} size="sm" />
              </Box>
            }
          />
        </ListItem>
        <Divider component="li" />

        <ListItem>
          <ListItemText primary="Email" secondary={admin.email || 'N/A'} />
        </ListItem>
        <Divider component="li" />

        <ListItem>
          <ListItemText
            primary="Admin Status"
            secondary={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <Icon name="shield" size="sm" color="primary" />
                <Typography variant="body2" component="span" color="primary">
                  System Admin
                </Typography>
              </Box>
            }
          />
        </ListItem>
        <Divider component="li" />

        {admin.organization?.name && (
          <>
            <ListItem>
              <ListItemText primary="Organization" secondary={admin.organization.name} />
            </ListItem>
            <Divider component="li" />
          </>
        )}

        <ListItem>
          <ListItemText
            primary="Created"
            secondary={admin.created ? new Date(admin.created).toLocaleString() : 'N/A'}
          />
        </ListItem>
        <Divider component="li" />

        <ListItem>
          <ListItemText
            primary="Last Login"
            secondary={admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'N/A'}
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
            secondary={`${deviceCount} total \u2022 ${deviceOnline} online \u2022 ${deviceOffline} offline`}
          />
        </ListItem>
      </List>

      <Typography variant="subtitle1" sx={{ marginTop: 3, paddingX: 2 }}>
        <Title>Actions</Title>
      </Typography>
      <List disablePadding>
        <ListItem>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => setRemoveConfirmOpen(true)}
          >
            Remove Admin
          </Button>
        </ListItem>
      </List>

      <Confirm
        open={removeConfirmOpen}
        onConfirm={handleRemoveAdmin}
        onDeny={() => setRemoveConfirmOpen(false)}
        title="Remove Admin Privileges"
        action={removing ? 'Removing...' : 'Remove Admin'}
        disabled={removing}
        color="warning"
      >
        <Typography variant="body2" gutterBottom>
          Are you sure you want to remove admin privileges from <strong>{admin.email || admin.id}</strong>?
        </Typography>
        <Typography variant="body2" color="textSecondary">
          This user will no longer have access to the admin panel.
        </Typography>
      </Confirm>
    </Container>
  )
}
