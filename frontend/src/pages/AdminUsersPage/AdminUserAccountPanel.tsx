import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        dispatch.ui.set({ successMessage: t('adminUserAccountPanel.emailUpdated', 'Email updated successfully') })
        // Refresh in place (keeps current data visible until fresh data loads)
        await fetchUser(true)
        await dispatch.adminUsers.fetch(undefined)
      } else {
        dispatch.ui.set({ errorMessage: t('adminUserAccountPanel.emailUpdateFailed', 'Failed to update email') })
      }
    } catch (error) {
      console.error('Error updating email:', error)
      dispatch.ui.set({ errorMessage: t('adminUserAccountPanel.emailUpdateFailed', 'Failed to update email') })
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
        dispatch.ui.set({ successMessage: t('adminUserAccountPanel.userDeleted', 'User deleted successfully') })
        setDeleteConfirmOpen(false)
        // Redirect to user list
        history.push('/admin/users')
        await dispatch.adminUsers.fetch(undefined)
      } else {
        dispatch.ui.set({ errorMessage: t('adminUserAccountPanel.userDeleteFailed', 'Failed to delete user') })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      dispatch.ui.set({ errorMessage: t('adminUserAccountPanel.userDeleteFailed', 'Failed to delete user') })
    } finally {
      setDeleting(false)
    }
  }

  const handleRemoveAdmin = async () => {
    setRemovingAdmin(true)
    try {
      const result = await graphQLRemoveAdmin(userId)
      if (result !== 'ERROR') {
        dispatch.ui.set({ successMessage: t('adminUserAccountPanel.adminRemoved', 'Admin privileges removed') })
        setRemoveAdminConfirmOpen(false)
        // Refresh in place (keeps current data visible until fresh data loads)
        await fetchUser(true)
        await dispatch.adminUsers.fetch(undefined)
      } else {
        dispatch.ui.set({
          errorMessage: t('adminUserAccountPanel.adminRemoveFailed', 'Failed to remove admin privileges'),
        })
      }
    } catch (error) {
      console.error('Error removing admin:', error)
      dispatch.ui.set({ errorMessage: t('adminUserAccountPanel.adminRemoveFailed', 'Failed to remove admin privileges') })
    } finally {
      setRemovingAdmin(false)
    }
  }

  if (loading && !user) {
    return (
      <Container gutterBottom>
        <LoadingMessage message={t('adminUserAccountPanel.loading', 'Loading account...')} />
      </Container>
    )
  }

  if (!user) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {t('adminUserAccountPanel.userNotFound', 'User not found')}
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
          <Title>{t('adminUserAccountPanel.accountDetails', 'Account Details')}</Title>
        </Typography>
      }
    >
      <List disablePadding>
        <ListItem>
          <ListItemText
            primary={t('adminUserAccountPanel.userId', 'User ID')}
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
            primary={t('adminUserAccountPanel.email', 'Email')}
            secondary={user.email || t('adminUserAccountPanel.notAvailable', 'N/A')}
          />
        </ListItem>
        <Divider component="li" />

        <ListItem>
          <ListItemText
            primary={t('adminUserAccountPanel.adminStatus', 'Admin Status')}
            secondary={
              user.admin ? (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <Icon name="shield" size="sm" color="primary" />
                  <Typography variant="body2" component="span" color="primary">
                    {t('adminUserAccountPanel.systemAdmin', 'System Admin')}
                  </Typography>
                </Box>
              ) : (
                t('adminUserAccountPanel.standardUser', 'Standard User')
              )
            }
          />
        </ListItem>
        <Divider component="li" />

        {user.organization?.name && (
          <>
            <ListItem>
              <ListItemText
                primary={t('adminUserAccountPanel.organization', 'Organization')}
                secondary={user.organization.name}
              />
            </ListItem>
            <Divider component="li" />
          </>
        )}

        <ListItem>
          <ListItemText
            primary={t('adminUserAccountPanel.created', 'Created')}
            secondary={user.created ? new Date(user.created).toLocaleString() : t('adminUserAccountPanel.notAvailable', 'N/A')}
          />
        </ListItem>
        <Divider component="li" />

        <ListItem>
          <ListItemText
            primary={t('adminUserAccountPanel.lastLogin', 'Last Login')}
            secondary={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : t('adminUserAccountPanel.notAvailable', 'N/A')}
          />
        </ListItem>
      </List>

      <Typography variant="subtitle1" sx={{ marginTop: 3, paddingX: 2 }}>
        <Title>{t('adminUserAccountPanel.deviceSummary', 'Device Summary')}</Title>
      </Typography>
      <List disablePadding>
        <ListItem>
          <ListItemText
            primary={t('adminUserAccountPanel.userDevices', 'User Devices')}
            secondary={t('adminUserAccountPanel.deviceSummaryValue', {
              total: deviceCount,
              online: deviceOnline,
              offline: deviceOffline,
              defaultValue: '{{total}} total • {{online}} online • {{offline}} offline',
            })}
          />
        </ListItem>
      </List>

      <Typography variant="subtitle1" sx={{ marginTop: 3, paddingX: 2 }}>
        <Title>{t('adminUserAccountPanel.adminActions', 'Admin Actions')}</Title>
      </Typography>
      <List disablePadding>
        <ListItem sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleChangeEmail}
            disabled={!user.email}
          >
            {t('adminUserAccountPanel.changeEmail', 'Change Email')}
          </Button>
          {user.admin && (
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setRemoveAdminConfirmOpen(true)}
            >
              {t('adminUserAccountPanel.removeAdmin', 'Remove Admin')}
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteUser}
          >
            {t('adminUserAccountPanel.deleteUser', 'Delete User')}
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
        title={t('adminUserAccountPanel.deleteUser', 'Delete User')}
        action={deleting ? t('adminUserAccountPanel.deleting', 'Deleting...') : t('adminUserAccountPanel.delete', 'Delete')}
        disabled={deleting}
        color="error"
      >
        <Notice severity="error" gutterBottom fullWidth>
          {t('common.actionCannotBeUndone', 'This action cannot be undone.')}
        </Notice>
        <Typography variant="body2" gutterBottom>
          {t('adminUserAccountPanel.confirmDeleteBefore', 'Are you sure you want to permanently delete user')}{' '}
          <strong>{user.email || user.id}</strong>?
        </Typography>
        {deviceCount > 0 && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {t('adminUserAccountPanel.confirmDeleteDevicesBefore', "This user's")}{' '}
            <strong>
              {t('adminUserAccountPanel.deviceCount', {
                count: deviceCount,
                defaultValue_one: '{{count}} device',
                defaultValue_other: '{{count}} devices',
              })}
            </strong>{' '}
            {t(
              'adminUserAccountPanel.confirmDeleteDevicesAfter',
              "will be transferred to the holding account and tagged with the user's email and the deletion date."
            )}
          </Typography>
        )}
      </Confirm>

      <Confirm
        open={removeAdminConfirmOpen}
        onConfirm={handleRemoveAdmin}
        onDeny={() => setRemoveAdminConfirmOpen(false)}
        title={t('adminUserAccountPanel.removeAdminPrivileges', 'Remove Admin Privileges')}
        action={
          removingAdmin
            ? t('adminUserAccountPanel.removing', 'Removing...')
            : t('adminUserAccountPanel.removeAdmin', 'Remove Admin')
        }
        disabled={removingAdmin}
        color="warning"
      >
        <Typography variant="body2" gutterBottom>
          {t('adminUserAccountPanel.confirmRemoveAdminBefore', 'Are you sure you want to remove admin privileges from')}{' '}
          <strong>{user.email || user.id}</strong>?
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('adminUserAccountPanel.confirmRemoveAdminAfter', 'This user will no longer have access to the admin panel.')}
        </Typography>
      </Confirm>
    </Container>
  )
}
