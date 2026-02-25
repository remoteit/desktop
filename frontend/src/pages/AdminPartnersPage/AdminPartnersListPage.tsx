import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { Attribute } from '../../components/Attributes'
import { Container } from '../../components/Container'
import { GridList } from '../../components/GridList'
import { GridListItem } from '../../components/GridListItem'
import { Gutters } from '../../components/Gutters'
import { Icon } from '../../components/Icon'
import { LoadingMessage } from '../../components/LoadingMessage'
import { removeObject } from '../../helpers/utilHelper'
import { graphQLCreatePartner } from '../../services/graphQLRequest'
import { Dispatch, State } from '../../store'

type AdminPartnerAttributeOptions = {
  partner?: AdminPartnerRow
}

type AdminPartnerRow = {
  id: string
  name?: string
  deviceCount?: number
  activated?: number
  active?: number
  online?: number
}

class AdminPartnerAttribute extends Attribute<AdminPartnerAttributeOptions> {
  type: Attribute['type'] = 'MASTER'
}

const adminPartnerAttributes: AdminPartnerAttribute[] = [
  new AdminPartnerAttribute({
    id: 'partnerName',
    label: 'Name',
    defaultWidth: 250,
    required: true,
    value: ({ partner }: AdminPartnerAttributeOptions) => partner?.name || partner?.id,
  }),
  new AdminPartnerAttribute({
    id: 'partnerDevicesTotal',
    label: 'Devices',
    defaultWidth: 80,
    value: ({ partner }: AdminPartnerAttributeOptions) => partner?.deviceCount || 0,
  }),
  new AdminPartnerAttribute({
    id: 'partnerActivated',
    label: 'Activated',
    defaultWidth: 100,
    value: ({ partner }: AdminPartnerAttributeOptions) => partner?.activated || 0,
  }),
  new AdminPartnerAttribute({
    id: 'partnerActive',
    label: 'Active',
    defaultWidth: 80,
    value: ({ partner }: AdminPartnerAttributeOptions) => partner?.active || 0,
  }),
  new AdminPartnerAttribute({
    id: 'partnerOnline',
    label: 'Online',
    defaultWidth: 80,
    value: ({ partner }: AdminPartnerAttributeOptions) => partner?.online || 0,
  }),
]

export const AdminPartnersListPage: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(adminPartnerAttributes, a => a.required === true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newPartnerName, setNewPartnerName] = useState('')
  const [newPartnerParentId, setNewPartnerParentId] = useState('')
  const [creating, setCreating] = useState(false)

  // Get state from Redux
  const partners = useSelector((state: State) => state.adminPartners.partners as AdminPartnerRow[])
  const loading = useSelector((state: State) => state.adminPartners.loading)
  const searchValue = useSelector((state: State) => state.adminPartners.searchValue)

  useEffect(() => {
    dispatch.adminPartners.fetchIfEmpty(undefined)
  }, [])

  useEffect(() => {
    const handleRefresh = () => {
      dispatch.adminPartners.fetch()
    }
    window.addEventListener('refreshAdminData', handleRefresh)
    return () => window.removeEventListener('refreshAdminData', handleRefresh)
  }, [])

  const filteredPartners = useMemo(() => {
    if (!searchValue.trim()) return partners
    const search = searchValue.toLowerCase()
    return partners.filter(
      partner => partner.name?.toLowerCase().includes(search) || partner.id?.toLowerCase().includes(search)
    )
  }, [partners, searchValue])

  const handlePartnerClick = (partnerId: string) => {
    dispatch.ui.setDefaultSelected({
      key: '/admin/partners',
      value: `/admin/partners/${partnerId}`,
      accountId: 'admin',
    })
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
      dispatch.adminPartners.fetch()
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
            <Button onClick={() => setCreateDialogOpen(true)} size="small" children="Create Partner" />
            <TextField
              fullWidth
              size="small"
              placeholder="Search partners..."
              value={searchValue}
              onChange={e => dispatch.adminPartners.setSearchValue(e.target.value)}
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
        <GridList attributes={attributes} required={required} columnWidths={columnWidths} fetching={loading}>
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
                  <div className={css.truncate}>{attribute.value({ partner })}</div>
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
            onChange={e => setNewPartnerName(e.target.value)}
            sx={{ marginTop: 2 }}
          />
          <FormControl fullWidth sx={{ marginTop: 2 }}>
            <InputLabel>Parent Partner (Optional)</InputLabel>
            <Select
              value={newPartnerParentId}
              label="Parent Partner (Optional)"
              onChange={e => setNewPartnerParentId(e.target.value)}
            >
              <MenuItem value="">None (Top-level)</MenuItem>
              {partners.map((p: AdminPartnerRow) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
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
