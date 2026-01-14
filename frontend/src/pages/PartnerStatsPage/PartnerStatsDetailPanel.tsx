import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
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
  graphQLExportPartnerDevices,
  graphQLAddPartnerAdmin,
  graphQLRemovePartnerAdmin,
  graphQLAddPartnerRegistrant,
  graphQLRemovePartnerRegistrant
} from '../../services/graphQLRequest'
import { windowOpen } from '../../services/browser'
import { spacing } from '../../styling'
import { State, Dispatch as AppDispatch } from '../../store'
import { getPartnerStatsModel } from '../../models/partnerStats'

export const PartnerStatsDetailPanel: React.FC = () => {
  const { partnerId } = useParams<{ partnerId: string }>()
  const history = useHistory()
  const dispatch = useDispatch<AppDispatch>()
  const [exporting, setExporting] = useState(false)
  const userId = useSelector((state: State) => state.user.id)
  const partnerStatsModel = useSelector((state: State) => getPartnerStatsModel(state))
  const { flattened: partners, all: rootPartners, fetching: loading } = partnerStatsModel
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [removingAdmin, setRemovingAdmin] = useState<string | null>(null)
  const [addRegistrantDialogOpen, setAddRegistrantDialogOpen] = useState(false)
  const [newRegistrantEmail, setNewRegistrantEmail] = useState('')
  const [addingRegistrant, setAddingRegistrant] = useState(false)
  const [removingRegistrant, setRemovingRegistrant] = useState<string | null>(null)

  // Find the partner in the flattened list
  const partner = useMemo(() => {
    if (!partnerId) return null
    return partners.find(p => p.id === partnerId)
  }, [partnerId, partners])

  const handleBack = () => {
    history.push('/partner-stats')
  }

  const handleNavigateToPartner = (id: string) => {
    history.push(`/partner-stats/${id}`)
  }

  const handleExportDevices = async () => {
    if (!partnerId) return
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

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !partnerId) return
    
    setAddingAdmin(true)
    const result = await graphQLAddPartnerAdmin(partnerId, newAdminEmail)
    setAddingAdmin(false)
    
    if (result !== 'ERROR') {
      setAddAdminDialogOpen(false)
      setNewAdminEmail('')
      dispatch.partnerStats.fetch()
    } else {
      alert('Failed to add admin.')
    }
  }

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this admin?') || !partnerId) return
    
    setRemovingAdmin(userId)
    const result = await graphQLRemovePartnerAdmin(partnerId, userId)
    setRemovingAdmin(null)
    
    if (result !== 'ERROR') {
      dispatch.partnerStats.fetch()
    } else {
      alert('Failed to remove admin.')
    }
  }

  const handleAddRegistrant = async () => {
    if (!newRegistrantEmail || !partnerId) return
    
    setAddingRegistrant(true)
    const result = await graphQLAddPartnerRegistrant(partnerId, newRegistrantEmail)
    setAddingRegistrant(false)
    
    if (result !== 'ERROR') {
      setAddRegistrantDialogOpen(false)
      setNewRegistrantEmail('')
      dispatch.partnerStats.fetch()
    } else {
      alert('Failed to add registrant. They may already have access to this entity.')
    }
  }

  const handleRemoveRegistrant = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this registrant?') || !partnerId) return
    
    setRemovingRegistrant(userId)
    const result = await graphQLRemovePartnerRegistrant(partnerId, userId)
    setRemovingRegistrant(null)
    
    if (result !== 'ERROR') {
      dispatch.partnerStats.fetch()
    } else {
      alert('Failed to remove registrant.')
    }
  }

  // Don't show anything if no partner is selected
  if (!partnerId) {
    return null
  }

  if (loading && !partner) {
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

  const children = partner.children || []
  const users = partner.users || []
  
  // Split users into admins and registrants (admin_registrant users show in both lists)
  const admins = users.filter((u: any) => u.role === 'admin' || u.role === 'admin_registrant')
  const registrants = users.filter((u: any) => u.role === 'device_registrant' || u.role === 'admin_registrant')

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
            </Box>
            <IconButton
              icon="arrow-to-bottom"
              title="Export devices to CSV"
              onClick={handleExportDevices}
              disabled={exporting}
              spin={exporting}
              size="md"
            />
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
            <ListItemButton onClick={() => handleNavigateToPartner(partner.parent!.id)}>
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
      {children.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ marginTop: 3 }}>
            <Title>Child Partners ({children.length})</Title>
          </Typography>
          <List disablePadding>
            {children.map((child: any, index: number) => (
              <React.Fragment key={child.id}>
                {index > 0 && <Divider />}
                <ListItemButton onClick={() => handleNavigateToPartner(child.id)}>
                  <ListItemIcon>
                    <Icon name="building" size="md" color="grayDark" />
                  </ListItemIcon>
                  <ListItemText
                    primary={child.name}
                    secondary={`${child.deviceCount || 0} total • ${child.online || 0} online • ${child.active || 0} active`}
                  />
                  <Icon name="chevron-right" size="md" color="grayLight" />
                </ListItemButton>
              </React.Fragment>
            ))}
          </List>
        </>
      )}

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
                  <ListItemIcon>
                    <Icon name="user" size="md" color="grayDark" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={user.email}
                    secondary={`${user.deviceCount || 0} total • ${user.online || 0} online • ${user.active || 0} active`}
                  />
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
                  <ListItemIcon>
                    <Icon name="user-shield" size="md" color="grayDark" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={user.email}
                    secondary={`${user.deviceCount || 0} total • ${user.online || 0} online • ${user.active || 0} active`}
                  />
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
          <Button onClick={() => setAddAdminDialogOpen(false)} color="grayDark">Cancel</Button>
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
          <Button onClick={() => setAddRegistrantDialogOpen(false)} color="grayDark">Cancel</Button>
          <Button onClick={handleAddRegistrant} disabled={!newRegistrantEmail || addingRegistrant}>
            {addingRegistrant ? 'Adding...' : 'Add Registrant'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
