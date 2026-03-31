import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Typography, List, ListItem, ListItemText, Box, Divider, Button, Checkbox, FormControlLabel } from '@mui/material'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Confirm } from '../../components/Confirm'
import { Notice } from '../../components/Notice'
import { Dispatch } from '../../store'
import { graphQLAdminUpdateEmail, graphQLAdminDeleteUser, graphQLRemoveAdmin } from '../../services/graphQLMutation'
import { ChangeEmailDialog } from './ChangeEmailDialog'

export const AdminUserAccountPanel: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [removeAdminConfirmOpen, setRemoveAdminConfirmOpen] = useState(false)
  const [removingAdmin, setRemovingAdmin] = useState(false)
  const [forceDelete, setForceDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const handleChangeEmail = () => {
    setChangeEmailOpen(true)
  }

  const handleSubmitEmail = async (newEmail: string) => {
    try {
      const result = await graphQLAdminUpdateEmail(user.email, newEmail)

      if (result !== 'ERROR') {
        dispatch.ui.set({ successMessage: 'Email updated successfully' })
        // Invalidate cache and refresh
        dispatch.adminUsers.invalidateUserDetail(userId)
        await fetchUser()
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
    setForceDelete(false)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      const result = await graphQLAdminDeleteUser(userId, forceDelete)

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
        dispatch.adminUsers.invalidateUserDetail(userId)
        await fetchUser()
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
  const hasOnlineDevices = deviceOnline > 0
  const canDelete = !hasOnlineDevices || forceDelete

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
        disabled={deleting || !canDelete}
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
            This user has <strong>{deviceCount} device{deviceCount !== 1 ? 's' : ''}</strong> that will also be removed.
          </Typography>
        )}

        {hasOnlineDevices && (
          <Notice severity="warning" gutterBottom fullWidth sx={{ marginTop: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Warning: This user has {deviceOnline} online device{deviceOnline !== 1 ? 's' : ''}.</strong>
            </Typography>
            <Typography variant="body2" gutterBottom>
              To delete this user without forcing, you must first uninstall Remote.It on all online devices so they go offline.
            </Typography>
            <Typography variant="body2">
              If you force delete with online devices, they will continue attempting to connect to Remote.It but will be unsuccessful.
            </Typography>
          </Notice>
        )}

        <Box sx={{ marginTop: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                disabled={deleting}
              />
            }
            label={
              <Typography variant="body2">
                {hasOnlineDevices
                  ? 'Force delete (required for users with online devices)'
                  : 'Force delete (bypasses safety checks)'}
              </Typography>
            }
          />
        </Box>
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
