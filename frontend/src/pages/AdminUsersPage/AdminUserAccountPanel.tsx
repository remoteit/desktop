import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Typography, List, ListItem, ListItemText, Box, Divider, Button } from '@mui/material'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Confirm } from '../../components/Confirm'
import { Notice } from '../../components/Notice'
import { Dispatch, State } from '../../store'
import { graphQLAdminUpdateEmail, graphQLAdminDeleteUser, graphQLRemoveAdmin } from '../../services/graphQLMutation'
import { ChangeEmailDialog } from './ChangeEmailDialog'

export const AdminUserAccountPanel: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const user = useSelector((state: State) => state.adminUsers.detailCache[userId])
  const [loading, setLoading] = useState(!user)
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [removeAdminConfirmOpen, setRemoveAdminConfirmOpen] = useState(false)
  const [removingAdmin, setRemovingAdmin] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async (force = false) => {
    setLoading(true)
    await dispatch.adminUsers.fetchUserDetail({ userId, force })
    setLoading(false)
  }

  const handleChangeEmail = () => {
    setChangeEmailOpen(true)
  }

  const handleSubmitEmail = async (newEmail: string) => {
    try {
      const result = await graphQLAdminUpdateEmail(user.email, newEmail)

      if (result !== 'ERROR') {
        dispatch.ui.set({ successMessage: 'Email updated successfully' })
        // Refresh in place (keeps current data visible until fresh data loads)
        await fetchUser(true)
        await dispatch.adminUsers.fetch(undefined)
      } else {
        dispatch.ui.set({ errorMessage: 'Failed to update email' })
      }
    } catch (error) {
      console.error('Error updating email:', error)
      dispatch.ui.set({ errorMessage: 'Failed to update email' })
      throw error
    }
  }

  const handleDeleteUser = () => {
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      const result = await graphQLAdminDeleteUser(userId)

      if (result !== 'ERROR') {
        dispatch.ui.set({ successMessage: 'User deleted successfully' })
        setDeleteConfirmOpen(false)
        // Redirect to user list
        history.push('/admin/users')
        await dispatch.adminUsers.fetch(undefined)
      } else {
        dispatch.ui.set({ errorMessage: 'Failed to delete user' })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      dispatch.ui.set({ errorMessage: 'Failed to delete user' })
    } finally {
      setDeleting(false)
    }
  }

  const handleRemoveAdmin = async () => {
    setRemovingAdmin(true)
    try {
      const result = await graphQLRemoveAdmin(userId)
      if (result !== 'ERROR') {
        dispatch.ui.set({ successMessage: 'Admin privileges removed' })
        setRemoveAdminConfirmOpen(false)
        // Refresh in place (keeps current data visible until fresh data loads)
        await fetchUser(true)
        await dispatch.adminUsers.fetch(undefined)
      } else {
        dispatch.ui.set({ errorMessage: 'Failed to remove admin privileges' })
      }
    } catch (error) {
      console.error('Error removing admin:', error)
      dispatch.ui.set({ errorMessage: 'Failed to remove admin privileges' })
    } finally {
      setRemovingAdmin(false)
    }
  }

  if (loading && !user) {
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

        <ListItem>
          <ListItemText
            primary="Admin Status"
            secondary={
              user.admin ? (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <Icon name="shield" size="sm" color="primary" />
                  <Typography variant="body2" component="span" color="primary">
                    System Admin
                  </Typography>
                </Box>
              ) : (
                'Standard User'
              )
            }
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

      <Typography variant="subtitle1" sx={{ marginTop: 3, paddingX: 2 }}>
        <Title>Admin Actions</Title>
      </Typography>
      <List disablePadding>
        <ListItem sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleChangeEmail}
            disabled={!user.email}
          >
            Change Email
          </Button>
          {user.admin && (
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setRemoveAdminConfirmOpen(true)}
            >
              Remove Admin
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteUser}
          >
            Delete User
          </Button>
        </ListItem>
      </List>

      <ChangeEmailDialog
        open={changeEmailOpen}
        currentEmail={user.email || ''}
        onSubmit={handleSubmitEmail}
        onClose={() => setChangeEmailOpen(false)}
      />

      <Confirm
        open={deleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onDeny={() => setDeleteConfirmOpen(false)}
        title="Delete User"
        action={deleting ? 'Deleting...' : 'Delete'}
        disabled={deleting}
        color="error"
      >
        <Notice severity="error" gutterBottom fullWidth>
          This action cannot be undone.
        </Notice>
        <Typography variant="body2" gutterBottom>
          Are you sure you want to permanently delete user <strong>{user.email || user.id}</strong>?
        </Typography>
        {deviceCount > 0 && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            This user's <strong>{deviceCount} device{deviceCount !== 1 ? 's' : ''}</strong> will be transferred to the holding
            account and tagged with the user's email and the deletion date.
          </Typography>
        )}
      </Confirm>

      <Confirm
        open={removeAdminConfirmOpen}
        onConfirm={handleRemoveAdmin}
        onDeny={() => setRemoveAdminConfirmOpen(false)}
        title="Remove Admin Privileges"
        action={removingAdmin ? 'Removing...' : 'Remove Admin'}
        disabled={removingAdmin}
        color="warning"
      >
        <Typography variant="body2" gutterBottom>
          Are you sure you want to remove admin privileges from <strong>{user.email || user.id}</strong>?
        </Typography>
        <Typography variant="body2" color="textSecondary">
          This user will no longer have access to the admin panel.
        </Typography>
      </Confirm>
    </Container>
  )
}
