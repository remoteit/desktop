import React, { useEffect, useState, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  Typography, Box, TextField, InputAdornment, Stack, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import { Container } from '../../components/Container'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../buttons/IconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { graphQLAdminPartners, graphQLCreatePartner } from '../../services/graphQLRequest'
import { Gutters } from '../../components/Gutters'
import { GridList } from '../../components/GridList'
import { GridListItem } from '../../components/GridListItem'
import { Attribute } from '../../components/Attributes'
import { State } from '../../store'
import { makeStyles } from '@mui/styles'
import { removeObject } from '../../helpers/utilHelper'

class AdminPartnerAttribute extends Attribute {
  type: Attribute['type'] = 'MASTER'
}

const adminPartnerAttributes: Attribute[] = [
  new AdminPartnerAttribute({
    id: 'partnerName',
    label: 'Name',
    defaultWidth: 250,
    required: true,
    value: ({ partner }: { partner: any }) => partner?.name || partner?.id,
  }),
  new AdminPartnerAttribute({
    id: 'partnerDevicesTotal',
    label: 'Devices',
    defaultWidth: 80,
    value: ({ partner }: { partner: any }) => partner?.deviceCount || 0,
  }),
  new AdminPartnerAttribute({
    id: 'partnerActivated',
    label: 'Activated',
    defaultWidth: 100,
    value: ({ partner }: { partner: any }) => partner?.activated || 0,
  }),
  new AdminPartnerAttribute({
    id: 'partnerActive',
    label: 'Active',
    defaultWidth: 80,
    value: ({ partner }: { partner: any }) => partner?.active || 0,
  }),
  new AdminPartnerAttribute({
    id: 'partnerOnline',
    label: 'Online',
    defaultWidth: 80,
    value: ({ partner }: { partner: any }) => partner?.online || 0,
  }),
]

export const AdminPartnersListPage: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const css = useStyles()
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(adminPartnerAttributes, a => a.required === true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newPartnerName, setNewPartnerName] = useState('')
  const [newPartnerParentId, setNewPartnerParentId] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchPartners()
  }, [])

  useEffect(() => {
    const handleRefresh = () => {
      fetchPartners()
    }
    window.addEventListener('refreshAdminData', handleRefresh)
    return () => window.removeEventListener('refreshAdminData', handleRefresh)
  }, [])

  const fetchPartners = async () => {
    setLoading(true)
    const result = await graphQLAdminPartners()
    if (result !== 'ERROR' && result?.data?.data?.admin?.partners) {
      setPartners(result.data.data.admin.partners || [])
    }
    setLoading(false)
  }

  const filteredPartners = useMemo(() => {
    if (!searchValue.trim()) return partners
    const search = searchValue.toLowerCase()
    return partners.filter(partner => 
      partner.name?.toLowerCase().includes(search) ||
      partner.id?.toLowerCase().includes(search)
    )
  }, [partners, searchValue])

  const handlePartnerClick = (partnerId: string) => {
    history.push(`/admin/partners/${partnerId}`)
  }

  const handleCreatePartner = async () => {
    if (!newPartnerName.trim()) return
    
    setCreating(true)
    const result = await graphQLCreatePartner(newPartnerName, newPartnerParentId || undefined)
    setCreating(false)
    
    if (result !== 'ERROR' && result?.data?.data?.createPartner) {
      setCreateDialogOpen(false)
      setNewPartnerName('')
      setNewPartnerParentId('')
      fetchPartners()
      // Navigate to new partner
      history.push(`/admin/partners/${result.data.data.createPartner.id}`)
    } else {
      alert('Failed to create partner.')
    }
  }

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <Gutters>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="small"
              children="Create Partner"
            />
            <TextField
              fullWidth
              size="small"
              placeholder="Search partners..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon name="search" size="md" color="grayDark" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </Gutters>
      }
    >
      {loading ? (
        <LoadingMessage message="Loading partners..." />
      ) : filteredPartners.length === 0 ? (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <Icon name="handshake" size="xxl" color="grayLight" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {searchValue ? 'No matching partners' : 'No partners found'}
          </Typography>
        </Box>
      ) : (
        <GridList
          attributes={attributes}
          required={required}
          columnWidths={columnWidths}
          fetching={loading}
        >
          {filteredPartners.map(partner => (
            <GridListItem
              key={partner.id}
              onClick={() => handlePartnerClick(partner.id)}
              selected={location.pathname.includes(`/admin/partners/${partner.id}`)}
              disableGutters
              icon={<Icon name="building" size="md" color="grayDark" />}
              required={required?.value({ partner })}
            >
              {attributes.map(attribute => (
                <Box key={attribute.id} className="attribute">
                  <div className={css.truncate}>
                    {attribute.value({ partner })}
                  </div>
                </Box>
              ))}
            </GridListItem>
          ))}
        </GridList>
      )}

      {/* Create Partner Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Partner</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Partner Name"
            fullWidth
            value={newPartnerName}
            onChange={(e) => setNewPartnerName(e.target.value)}
            sx={{ marginTop: 2 }}
          />
          <FormControl fullWidth sx={{ marginTop: 2 }}>
            <InputLabel>Parent Partner (Optional)</InputLabel>
            <Select
              value={newPartnerParentId}
              label="Parent Partner (Optional)"
              onChange={(e) => setNewPartnerParentId(e.target.value)}
            >
              <MenuItem value="">None (Top-level)</MenuItem>
              {partners.map((p: any) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} color="grayDark">Cancel</Button>
          <Button onClick={handleCreatePartner} disabled={!newPartnerName.trim() || creating}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

const useStyles = makeStyles(() => ({
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    flex: 1,
  },
}))

