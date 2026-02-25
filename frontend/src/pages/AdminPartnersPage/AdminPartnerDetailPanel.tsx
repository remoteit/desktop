import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  Typography, List, ListItem, ListItemText, ListItemButton, ListItemIcon, Box, Divider, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton as MuiIconButton
} from '@mui/material'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { IconButton } from '../../buttons/IconButton'
import { CopyIconButton } from '../../buttons/CopyIconButton'
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
  const [addRegistrantDialogOpen, setAddRegistrantDialogOpen] = useState(false)
  const [newRegistrantEmail, setNewRegistrantEmail] = useState('')
  const [addingRegistrant, setAddingRegistrant] = useState(false)
  const [removingRegistrant, setRemovingRegistrant] = useState<string | null>(null)

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

  const handleBack = () => {
    history.push('/admin/partners')
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
      alert('Failed to add admin.')
    }
  }

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return

    setRemovingAdmin(userId)
    const result = await graphQLRemovePartnerAdmin(partnerId, userId)
    setRemovingAdmin(null)

    if (result !== 'ERROR') {
      fetchPartner(true)
    } else {
      alert('Failed to remove admin.')
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
      alert('Failed to add registrant. They may already have access to this entity.')
    }
  }

  const handleRemoveRegistrant = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this registrant?')) return

    setRemovingRegistrant(userId)
    const result = await graphQLRemovePartnerRegistrant(partnerId, userId)
    setRemovingRegistrant(null)

    if (result !== 'ERROR') {
      fetchPartner(true)
    } else {
      alert('Failed to remove registrant.')
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
      alert('Failed to add child partner.')
    }
  }

  const handleRemoveChild = async (childId: string) => {
    if (!confirm('Remove this child partner? It will become a top-level partner.')) return

    setRemovingChild(childId)
    const result = await graphQLRemovePartnerChild(childId)
    setRemovingChild(null)

    if (result !== 'ERROR') {
      fetchPartner(true)
    } else {
      alert('Failed to remove child partner.')
    }
  }

  const handleDeletePartner = async () => {
    const childCount = children.length
    const message = childCount > 0
      ? `Delete this partner? Its ${childCount} child partner(s) will become top-level partners.`
      : 'Delete this partner? This action cannot be undone.'

    if (!confirm(message)) return

    setDeleting(true)
    const result = await graphQLDeletePartner(partnerId)
    setDeleting(false)

    if (result !== 'ERROR') {
      history.push('/admin/partners')
    } else {
      alert('Failed to delete partner.')
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
      alert('Failed to export devices.')
    }
  }

  if (loading) {
    return (
      <Container gutterBottom>
        <LoadingMessage message="Loading partner..." />
      </Container>
    )
  }

  if (!partner) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            Partner not found
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
        <Box>
          <Box sx={{ height: 45, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                icon="chevron-left"
                title="Back to Partners"
                onClick={handleBack}
                size="md"
              />
              <IconButton
                icon="sync"
                title="Refresh partner"
                onClick={() => fetchPartner(true)}
                spin={loading}
                size="md"
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                icon="arrow-to-bottom"
                title="Export devices to CSV"
                onClick={handleExportDevices}
                disabled={exporting}
                spin={exporting}
                size="md"
              />
              <IconButton
                icon="trash"
                title="Delete partner"
                onClick={handleDeletePartner}
                disabled={deleting}
                spin={deleting}
                size="md"
                color="danger"
              />
            </Box>
          </Box>
          <Box sx={{ paddingX: `${spacing.md}px`, paddingBottom: `${spacing.md}px` }}>
            <Typography variant="h2">
              <Title>{partner.name}</Title>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 1 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
                {partner.id}
              </Typography>
              <CopyIconButton value={partner.id} size="xs" />
            </Box>
          </Box>
          <Divider />
        </Box>
      }
    >
      {/* Parent Partner */}
      {partner.parent && (
        <>
          <Typography variant="subtitle1" sx={{ marginTop: 2 }}>
            <Title>Parent Partner</Title>
          </Typography>
          <List disablePadding>
            <ListItemButton onClick={() => handleNavigateToPartner(partner.parent.id)}>
              <ListItemIcon>
                <Icon name="building" size="md" color="grayDark" />
              </ListItemIcon>
              <ListItemText
                primary={partner.parent.name}
                secondary={`${partner.parent.deviceCount || 0} total • ${partner.parent.online || 0} online • ${partner.parent.active || 0} active`}
              />
              <Icon name="chevron-right" size="md" color="grayLight" />
            </ListItemButton>
          </List>
        </>
      )}

      {/* Device Counts */}
      <Typography variant="subtitle1" sx={{ marginTop: 2 }}>
        <Title>Device Summary</Title>
      </Typography>
      <List disablePadding>
        <ListItem>
          <ListItemText
            primary="Total Devices"
            secondary={partner.deviceCount || 0}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary="Activated"
            secondary={`${partner.activated || 0} devices have reported at least once`}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary="Active (Last 30 Days)"
            secondary={`${partner.active || 0} devices`}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary="Currently Online"
            secondary={`${partner.online || 0} devices`}
          />
        </ListItem>
      </List>

      {/* Children Partners */}
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <Typography variant="subtitle1">
            <Title>Child Partners ({children.length})</Title>
          </Typography>
          <Button
            onClick={handleOpenAddChildDialog}
            size="small"
            children="Add Child"
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
                      secondary={`${child.deviceCount || 0} total • ${child.online || 0} online • ${child.active || 0} active`}
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
            <Title>Registrants ({registrants.length})</Title>
          </Typography>
          <Button
            onClick={() => setAddRegistrantDialogOpen(true)}
            size="small"
            children="Add Registrant"
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
                      secondary={`${user.deviceCount || 0} total • ${user.online || 0} online • ${user.active || 0} active`}
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
            <Title>Admins ({admins.length})</Title>
          </Typography>
          <Button
            onClick={() => setAddAdminDialogOpen(true)}
            size="small"
            children="Add Admin"
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
                      secondary={`${user.deviceCount || 0} total • ${user.online || 0} online • ${user.active || 0} active`}
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
        <DialogTitle>Add Admin to Partner</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            sx={{ marginTop: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAdminDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleAddAdmin} disabled={!newAdminEmail || addingAdmin}>
            {addingAdmin ? 'Adding...' : 'Add Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Registrant Dialog */}
      <Dialog open={addRegistrantDialogOpen} onClose={() => setAddRegistrantDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Registrant to Partner</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newRegistrantEmail}
            onChange={(e) => setNewRegistrantEmail(e.target.value)}
            sx={{ marginTop: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRegistrantDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleAddRegistrant} disabled={!newRegistrantEmail || addingRegistrant}>
            {addingRegistrant ? 'Adding...' : 'Add Registrant'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Child Dialog */}
      <Dialog open={addChildDialogOpen} onClose={() => setAddChildDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Child Partner</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ marginTop: 2 }}>
            <InputLabel>Select Partner</InputLabel>
            <Select
              value={selectedChildId}
              label="Select Partner"
              onChange={(e) => setSelectedChildId(e.target.value)}
            >
              {availablePartners.map((p: any) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddChildDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleAddChild} disabled={!selectedChildId || addingChild}>
            {addingChild ? 'Adding...' : 'Add Child'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
