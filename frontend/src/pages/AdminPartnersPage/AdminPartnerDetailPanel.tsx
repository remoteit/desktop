import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  Typography, List, ListItem, ListItemText, ListItemButton, ListItemIcon, Box, Divider, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton as MuiIconButton
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { IconButton } from '../../buttons/IconButton'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { LinearProgress } from '../../components/LinearProgress'
import { LoadingMessage } from '../../components/LoadingMessage'
import {
  graphQLAdminPartners,
  graphQLAddPartnerAdmin,
  graphQLRemovePartnerAdmin,
  graphQLAddPartnerRegistrant,
  graphQLRemovePartnerRegistrant,
  graphQLAddPartnerChild,
  graphQLRemovePartnerChild,
  graphQLDeletePartner,
  graphQLUpdatePartner,
  graphQLExportPartnerDevices
} from '../../services/graphQLRequest'
import { windowOpen } from '../../services/browser'
import { spacing } from '../../styling'
import { Dispatch } from '../../store'

export const AdminPartnerDetailPanel: React.FC = () => {
  const { partnerId } = useParams<{ partnerId: string }>()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [partner, setPartner] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [removingAdmin, setRemovingAdmin] = useState<string | null>(null)
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false)
  const [availablePartners, setAvailablePartners] = useState<any[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [addingChild, setAddingChild] = useState(false)
  const [removingChild, setRemovingChild] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [addRegistrantDialogOpen, setAddRegistrantDialogOpen] = useState(false)
  const [newRegistrantEmail, setNewRegistrantEmail] = useState('')
  const [addingRegistrant, setAddingRegistrant] = useState(false)
  const [removingRegistrant, setRemovingRegistrant] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (partnerId) {
      fetchPartner()
    }
  }, [partnerId])

  const fetchPartner = async (forceRefresh = false) => {
    setLoading(true)
    if (forceRefresh) {
      dispatch.adminPartners.invalidatePartnerDetail(partnerId)
    }
    const partnerData = await dispatch.adminPartners.fetchPartnerDetail(partnerId)
    setPartner(partnerData)
    setLoading(false)
  }

  const handleNavigateToPartner = (id: string) => {
    history.push(`/admin/partners/${id}`)
  }

  const handleNavigateToUser = (userId: string) => {
    history.push(`/admin/users/${userId}`)
  }

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return

    setAddingAdmin(true)
    const result = await graphQLAddPartnerAdmin(partnerId, newAdminEmail)
    setAddingAdmin(false)

    if (result !== 'ERROR') {
      setAddAdminDialogOpen(false)
      setNewAdminEmail('')
      fetchPartner(true)
    } else {
      alert(t('adminPartnerDetailPanel.addAdminFailed', 'Failed to add admin.'))
    }
  }

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm(t('adminPartnerDetailPanel.removeAdminConfirm', 'Are you sure you want to remove this admin?'))) return

    setRemovingAdmin(userId)
    const result = await graphQLRemovePartnerAdmin(partnerId, userId)
    setRemovingAdmin(null)

    if (result !== 'ERROR') {
      fetchPartner(true)
    } else {
      alert(t('adminPartnerDetailPanel.removeAdminFailed', 'Failed to remove admin.'))
    }
  }

  const handleAddRegistrant = async () => {
    if (!newRegistrantEmail) return

    setAddingRegistrant(true)
    const result = await graphQLAddPartnerRegistrant(partnerId, newRegistrantEmail)
    setAddingRegistrant(false)

    if (result !== 'ERROR') {
      setAddRegistrantDialogOpen(false)
      setNewRegistrantEmail('')
      fetchPartner(true)
    } else {
      alert(
        t('adminPartnerDetailPanel.addRegistrantFailed', 'Failed to add registrant. They may already have access to this entity.')
      )
    }
  }

  const handleRemoveRegistrant = async (userId: string) => {
    if (!confirm(t('adminPartnerDetailPanel.removeRegistrantConfirm', 'Are you sure you want to remove this registrant?'))) return

    setRemovingRegistrant(userId)
    const result = await graphQLRemovePartnerRegistrant(partnerId, userId)
    setRemovingRegistrant(null)

    if (result !== 'ERROR') {
      fetchPartner(true)
    } else {
      alert(t('adminPartnerDetailPanel.removeRegistrantFailed', 'Failed to remove registrant.'))
    }
  }

  const handleOpenAddChildDialog = async () => {
    setAddChildDialogOpen(true)
    // Fetch all partners to show as options
    const result = await graphQLAdminPartners()
    if (result !== 'ERROR' && result?.data?.data?.admin?.partners) {
      // Filter out current partner, its children, and its parent
      const childIds = children.map((c: any) => c.id)
      const filtered = result.data.data.admin.partners.filter((p: any) =>
        p.id !== partnerId &&
        !childIds.includes(p.id) &&
        p.id !== partner.parent?.id
      )
      setAvailablePartners(filtered)
    }
  }

  const handleAddChild = async () => {
    if (!selectedChildId) return

    setAddingChild(true)
    const result = await graphQLAddPartnerChild(partnerId, selectedChildId)
    setAddingChild(false)

    if (result !== 'ERROR') {
      setAddChildDialogOpen(false)
      setSelectedChildId('')
      fetchPartner(true)
    } else {
      alert(t('adminPartnerDetailPanel.addChildFailed', 'Failed to add child partner.'))
    }
  }

  const handleRemoveChild = async (childId: string) => {
    if (!confirm(t('adminPartnerDetailPanel.removeChildConfirm', 'Remove this child partner? It will become a top-level partner.')))
      return

    setRemovingChild(childId)
    const result = await graphQLRemovePartnerChild(childId)
    setRemovingChild(null)

    if (result !== 'ERROR') {
      fetchPartner(true)
    } else {
      alert(t('adminPartnerDetailPanel.removeChildFailed', 'Failed to remove child partner.'))
    }
  }

  const handleDeletePartner = async () => {
    const childCount = children.length
    const message =
      childCount > 0
        ? t('adminPartnerDetailPanel.deleteWithChildrenConfirm', {
            count: childCount,
            defaultValue: 'Delete this partner? Its {{count}} child partner(s) will become top-level partners.',
          })
        : t('adminPartnerDetailPanel.deleteConfirm', 'Delete this partner? This action cannot be undone.')

    if (!confirm(message)) return

    setDeleting(true)
    const result = await graphQLDeletePartner(partnerId)
    setDeleting(false)

    if (result !== 'ERROR') {
      history.push('/admin/partners')
    } else {
      alert(t('adminPartnerDetailPanel.deleteFailed', 'Failed to delete partner.'))
    }
  }

  const handleExportDevices = async () => {
    setExporting(true)
    const result = await graphQLExportPartnerDevices(partnerId)
    setExporting(false)

    if (result !== 'ERROR' && result?.data?.data?.exportPartnerDevices) {
      const url = result.data.data.exportPartnerDevices
      windowOpen(url)
    } else {
      alert(t('adminPartnerDetailPanel.exportFailed', 'Failed to export devices.'))
    }
  }

  const handleStartEditName = () => {
    setEditedName(partner?.name || '')
    setEditingName(true)
  }

  const handleCancelEditName = () => {
    setEditingName(false)
    setEditedName('')
  }

  const handleSaveName = async () => {
    const trimmed = editedName.trim()
    if (!trimmed || trimmed === partner?.name) {
      handleCancelEditName()
      return
    }
    setSavingName(true)
    const result = await graphQLUpdatePartner(partnerId, trimmed)
    setSavingName(false)
    if (result !== 'ERROR' && result?.data?.data?.updatePartner) {
      setEditingName(false)
      setEditedName('')
      fetchPartner(true)
      dispatch.adminPartners.fetch()
    } else {
      alert(t('adminPartnerDetailPanel.updateNameFailed', 'Failed to update partner name.'))
    }
  }

  if (loading && !partner) {
    return (
      <Container gutterBottom>
        <LoadingMessage message={t('adminPartnerDetailPanel.loading', 'Loading partner...')} />
      </Container>
    )
  }

  if (!partner) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {t('adminPartnerDetailPanel.notFound', 'Partner not found')}
          </Typography>
        </Body>
      </Container>
    )
  }

  const admins = partner.admins || []
  const registrants = partner.registrants || []
  const children = partner.children || []

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ height: 45, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                icon="arrow-to-bottom"
                title={t('adminPartnerDetailPanel.exportDevices', 'Export devices to CSV')}
                onClick={handleExportDevices}
                disabled={exporting}
                spin={exporting}
                size="md"
              />
              <IconButton
                icon="trash"
                title={t('adminPartnerDetailPanel.deletePartner', 'Delete partner')}
                onClick={handleDeletePartner}
                disabled={deleting}
                spin={deleting}
                size="md"
                color="danger"
              />
            </Box>
          </Box>
          <Box sx={{ paddingX: `${spacing.md}px`, paddingBottom: `${spacing.md}px` }}>
            {editingName ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  autoFocus
                  size="small"
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') handleCancelEditName()
                  }}
                  disabled={savingName}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  icon={savingName ? 'spinner-third' : 'check'}
                  title={t('common.save', 'Save')}
                  onClick={handleSaveName}
                  disabled={savingName || !editedName.trim()}
                  spin={savingName}
                  size="md"
                  color="success"
                />
                <IconButton
                  icon="times"
                  title={t('common.cancel', 'Cancel')}
                  onClick={handleCancelEditName}
                  disabled={savingName}
                  size="md"
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h2">
                  <Title>{partner.name}</Title>
                </Typography>
                <IconButton
                  icon="pen"
                  title={t('adminPartnerDetailPanel.renamePartner', 'Rename partner')}
                  onClick={handleStartEditName}
                  size="sm"
                />
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 1 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
                {partner.id}
              </Typography>
              <CopyIconButton value={partner.id} size="xs" />
            </Box>
          </Box>
          <LinearProgress loading={loading} />
          <Divider />
        </Box>
      }
    >
      {/* Parent Partner */}
      {partner.parent && (
        <>
          <Typography variant="subtitle1" sx={{ marginTop: 2 }}>
            <Title>{t('adminPartnerDetailPanel.parentPartner', 'Parent Partner')}</Title>
          </Typography>
          <List disablePadding>
            <ListItemButton onClick={() => handleNavigateToPartner(partner.parent.id)}>
              <ListItemIcon>
                <Icon name="building" size="md" color="grayDark" />
              </ListItemIcon>
              <ListItemText
                primary={partner.parent.name}
                secondary={t('adminPartnerDetailPanel.deviceCounts', {
                  total: partner.parent.deviceCount || 0,
                  online: partner.parent.online || 0,
                  active: partner.parent.active || 0,
                  defaultValue: '{{total}} total • {{online}} online • {{active}} active',
                })}
              />
              <Icon name="chevron-right" size="md" color="grayLight" />
            </ListItemButton>
          </List>
        </>
      )}

      {/* Device Counts */}
      <Typography variant="subtitle1" sx={{ marginTop: 2 }}>
        <Title>{t('adminPartnerDetailPanel.deviceSummary', 'Device Summary')}</Title>
      </Typography>
      <List disablePadding>
        <ListItem>
          <ListItemText
            primary={t('adminPartnerDetailPanel.totalDevices', 'Total Devices')}
            secondary={partner.deviceCount || 0}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary={t('adminPartnerDetailPanel.activated', 'Activated')}
            secondary={t('adminPartnerDetailPanel.activatedCount', {
              count: partner.activated || 0,
              defaultValue: '{{count}} devices have reported at least once',
            })}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary={t('adminPartnerDetailPanel.activeLast30', 'Active (Last 30 Days)')}
            secondary={t('adminPartnerDetailPanel.devicesCount', {
              count: partner.active || 0,
              defaultValue_one: '{{count}} device',
              defaultValue_other: '{{count}} devices',
            })}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary={t('adminPartnerDetailPanel.currentlyOnline', 'Currently Online')}
            secondary={t('adminPartnerDetailPanel.devicesCount', {
              count: partner.online || 0,
              defaultValue_one: '{{count}} device',
              defaultValue_other: '{{count}} devices',
            })}
          />
        </ListItem>
      </List>

      {/* Children Partners */}
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <Typography variant="subtitle1">
            <Title>{t('adminPartnerDetailPanel.childPartners', { count: children.length, defaultValue: 'Child Partners ({{count}})' })}</Title>
          </Typography>
          <Button
            onClick={handleOpenAddChildDialog}
            size="small"
            children={t('adminPartnerDetailPanel.addChild', 'Add Child')}
          />
        </Box>
        {children.length > 0 && (
          <List disablePadding>
            {children.map((child: any, index: number) => (
              <React.Fragment key={child.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <MuiIconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveChild(child.id)
                      }}
                      disabled={removingChild === child.id}
                    >
                      <Icon name={removingChild === child.id ? 'spinner-third' : 'unlink'} size="sm" spin={removingChild === child.id} />
                    </MuiIconButton>
                  }
                >
                  <ListItemButton onClick={() => handleNavigateToPartner(child.id)}>
                    <ListItemIcon>
                      <Icon name="building" size="md" color="grayDark" />
                    </ListItemIcon>
                    <ListItemText
                      primary={child.name}
                      secondary={t('adminPartnerDetailPanel.deviceCounts', {
                        total: child.deviceCount || 0,
                        online: child.online || 0,
                        active: child.active || 0,
                        defaultValue: '{{total}} total • {{online}} online • {{active}} active',
                      })}
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </>

      {/* Registrants in this Partner */}
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <Typography variant="subtitle1">
            <Title>{t('adminPartnerDetailPanel.registrants', { count: registrants.length, defaultValue: 'Registrants ({{count}})' })}</Title>
          </Typography>
          <Button
            onClick={() => setAddRegistrantDialogOpen(true)}
            size="small"
            children={t('adminPartnerDetailPanel.addRegistrant', 'Add Registrant')}
          />
        </Box>
        {registrants.length > 0 && (
          <List disablePadding>
            {registrants.map((user: any, index: number) => (
              <React.Fragment key={user.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <MuiIconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveRegistrant(user.id)
                      }}
                      disabled={removingRegistrant === user.id}
                    >
                      <Icon name={removingRegistrant === user.id ? 'spinner-third' : 'trash'} size="sm" spin={removingRegistrant === user.id} />
                    </MuiIconButton>
                  }
                >
                  <ListItemButton onClick={() => handleNavigateToUser(user.id)}>
                    <ListItemIcon>
                      <Icon name="user" size="md" color="grayDark" />
                    </ListItemIcon>
                    <ListItemText
                      primary={user.email}
                      secondary={t('adminPartnerDetailPanel.deviceCounts', {
                        total: user.deviceCount || 0,
                        online: user.online || 0,
                        active: user.active || 0,
                        defaultValue: '{{total}} total • {{online}} online • {{active}} active',
                      })}
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </>

      {/* Admins in this Partner */}
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <Typography variant="subtitle1">
            <Title>{t('adminPartnerDetailPanel.admins', { count: admins.length, defaultValue: 'Admins ({{count}})' })}</Title>
          </Typography>
          <Button
            onClick={() => setAddAdminDialogOpen(true)}
            size="small"
            children={t('adminPartnerDetailPanel.addAdmin', 'Add Admin')}
          />
        </Box>
        {admins.length > 0 && (
          <List disablePadding>
            {admins.map((user: any, index: number) => (
              <React.Fragment key={user.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <MuiIconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveAdmin(user.id)
                      }}
                      disabled={removingAdmin === user.id}
                    >
                      <Icon name={removingAdmin === user.id ? 'spinner-third' : 'trash'} size="sm" spin={removingAdmin === user.id} />
                    </MuiIconButton>
                  }
                >
                  <ListItemButton onClick={() => handleNavigateToUser(user.id)}>
                    <ListItemIcon>
                      <Icon name="user-shield" size="md" color="grayDark" />
                    </ListItemIcon>
                    <ListItemText
                      primary={user.email}
                      secondary={t('adminPartnerDetailPanel.deviceCounts', {
                        total: user.deviceCount || 0,
                        online: user.online || 0,
                        active: user.active || 0,
                        defaultValue: '{{total}} total • {{online}} online • {{active}} active',
                      })}
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminDialogOpen} onClose={() => setAddAdminDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('adminPartnerDetailPanel.addAdminDialogTitle', 'Add Admin to Partner')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('adminPartnerDetailPanel.emailLabel', 'Email')}
            type="email"
            fullWidth
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            sx={{ marginTop: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAdminDialogOpen(false)} color="inherit">{t('common.cancel', 'Cancel')}</Button>
          <Button onClick={handleAddAdmin} disabled={!newAdminEmail || addingAdmin}>
            {addingAdmin ? t('adminPartnerDetailPanel.adding', 'Adding...') : t('adminPartnerDetailPanel.addAdmin', 'Add Admin')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Registrant Dialog */}
      <Dialog open={addRegistrantDialogOpen} onClose={() => setAddRegistrantDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('adminPartnerDetailPanel.addRegistrantDialogTitle', 'Add Registrant to Partner')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('adminPartnerDetailPanel.emailLabel', 'Email')}
            type="email"
            fullWidth
            value={newRegistrantEmail}
            onChange={(e) => setNewRegistrantEmail(e.target.value)}
            sx={{ marginTop: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRegistrantDialogOpen(false)} color="inherit">{t('common.cancel', 'Cancel')}</Button>
          <Button onClick={handleAddRegistrant} disabled={!newRegistrantEmail || addingRegistrant}>
            {addingRegistrant
              ? t('adminPartnerDetailPanel.adding', 'Adding...')
              : t('adminPartnerDetailPanel.addRegistrant', 'Add Registrant')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Child Dialog */}
      <Dialog open={addChildDialogOpen} onClose={() => setAddChildDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('adminPartnerDetailPanel.addChildDialogTitle', 'Add Child Partner')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ marginTop: 2 }}>
            <InputLabel>{t('adminPartnerDetailPanel.selectPartner', 'Select Partner')}</InputLabel>
            <Select
              value={selectedChildId}
              label={t('adminPartnerDetailPanel.selectPartner', 'Select Partner')}
              onChange={(e) => setSelectedChildId(e.target.value)}
            >
              {availablePartners.map((p: any) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddChildDialogOpen(false)} color="inherit">{t('common.cancel', 'Cancel')}</Button>
          <Button onClick={handleAddChild} disabled={!selectedChildId || addingChild}>
            {addingChild ? t('adminPartnerDetailPanel.adding', 'Adding...') : t('adminPartnerDetailPanel.addChild', 'Add Child')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
