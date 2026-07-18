import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Attribute } from '../../components/Attributes'
import { Confirm } from '../../components/Confirm'
import { Container } from '../../components/Container'
import { GridList } from '../../components/GridList'
import { GridListItem } from '../../components/GridListItem'
import { Gutters } from '../../components/Gutters'
import { Icon } from '../../components/Icon'
import { LoadingMessage } from '../../components/LoadingMessage'
import { removeObject } from '../../helpers/utilHelper'
import { graphQLAddEnterpriseCustomer, graphQLRemoveEnterpriseCustomer } from '../../services/graphQLMutation'
import { AdminEnterpriseCustomer } from '../../models/adminEnterpriseLicenses'
import { Dispatch, State } from '../../store'

type EnterpriseCustomerAttributeOptions = {
  customer?: AdminEnterpriseCustomer
}

class EnterpriseCustomerAttribute extends Attribute<EnterpriseCustomerAttributeOptions> {
  type: Attribute['type'] = 'MASTER'
}

const enterpriseCustomerAttributes: EnterpriseCustomerAttribute[] = [
  new EnterpriseCustomerAttribute({
    id: 'email',
    label: 'Account',
    defaultWidth: 250,
    required: true,
    value: ({ customer }) => customer?.email || '-',
  }),
  new EnterpriseCustomerAttribute({
    id: 'devices',
    label: 'Devices',
    defaultWidth: 100,
    value: ({ customer }) => customer?.deviceCount ?? 0,
  }),
  new EnterpriseCustomerAttribute({
    id: 'members',
    label: 'Members',
    defaultWidth: 100,
    value: ({ customer }) => customer?.memberCount ?? 0,
  }),
  new EnterpriseCustomerAttribute({
    id: 'created',
    label: 'Created',
    defaultWidth: 150,
    value: ({ customer }) => (customer?.created ? new Date(customer.created).toLocaleDateString() : '-'),
  }),
]

export const AdminEnterpriseLicensesListPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<AdminEnterpriseCustomer | null>(null)
  const [removing, setRemoving] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const customers = useSelector((state: State) => state.adminEnterpriseLicenses.customers)
  const loading = useSelector((state: State) => state.adminEnterpriseLicenses.loading)
  const total = useSelector((state: State) => state.adminEnterpriseLicenses.total)
  const hasMore = useSelector((state: State) => state.adminEnterpriseLicenses.hasMore)
  const searchValue = useSelector((state: State) => state.adminEnterpriseLicenses.searchValue)

  const listAttributes = useMemo(
    () => [
      ...enterpriseCustomerAttributes,
      new EnterpriseCustomerAttribute({
        id: 'actions',
        label: '',
        defaultWidth: 48,
        align: 'right',
        value: ({ customer }) => (
          <IconButton
            size="small"
            title="Remove enterprise customer"
            onClick={e => {
              e.stopPropagation()
              if (customer) setRemoveTarget(customer)
            }}
          >
            <Icon name="trash" size="md" color="grayDark" />
          </IconButton>
        ),
      }),
    ],
    []
  )
  const [required, attributes] = removeObject(listAttributes, a => a.required === true)

  useEffect(() => {
    setSearchInput(searchValue)
  }, [])

  useEffect(() => {
    dispatch.adminEnterpriseLicenses.fetchIfEmpty(undefined)
  }, [])

  // Refetch when the (committed) search term changes, skipping the initial mount.
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    dispatch.adminEnterpriseLicenses.fetch()
  }, [searchValue])

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      dispatch.adminEnterpriseLicenses.setSearch(searchInput)
    }
  }

  const handleAddCustomer = async () => {
    if (!newCustomerEmail.trim()) return

    setAdding(true)
    const result = await graphQLAddEnterpriseCustomer(newCustomerEmail.trim())
    setAdding(false)

    if (result !== 'ERROR' && result?.data?.data?.addEnterpriseCustomer) {
      setAddDialogOpen(false)
      setNewCustomerEmail('')
      dispatch.ui.set({ successMessage: `Added enterprise customer ${newCustomerEmail.trim()}` })
      await dispatch.adminEnterpriseLicenses.fetch()
    } else {
      dispatch.ui.set({ errorMessage: 'Failed to add enterprise customer' })
    }
  }

  const handleRemoveCustomer = async () => {
    if (!removeTarget) return

    setRemoving(true)
    const result = await graphQLRemoveEnterpriseCustomer(removeTarget.userId)
    setRemoving(false)

    if (result !== 'ERROR' && result?.data?.data?.removeEnterpriseCustomer) {
      dispatch.ui.set({ successMessage: `Removed enterprise customer ${removeTarget.email}` })
      setRemoveTarget(null)
      await dispatch.adminEnterpriseLicenses.fetch()
    } else {
      dispatch.ui.set({ errorMessage: 'Failed to remove enterprise customer' })
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
            <Button onClick={() => setAddDialogOpen(true)} size="small" children="Add Enterprise Customer" />
            <TextField
              fullWidth
              size="small"
              placeholder="Search by email or name, then press Enter..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
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
      {loading && customers.length === 0 ? (
        <LoadingMessage message="Loading enterprise customers..." />
      ) : customers.length === 0 ? (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <Icon name="building" size="xxl" color="grayLight" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {searchValue ? 'No matching enterprise customers' : 'No enterprise customers found'}
          </Typography>
        </Box>
      ) : (
        <GridList attributes={attributes} required={required} columnWidths={columnWidths} fetching={loading}>
          {customers.map(customer => (
            <GridListItem
              key={customer.userId}
              disableGutters
              icon={<Icon name="building" size="md" color="grayDark" />}
              required={required?.value({ customer })}
            >
              {attributes.map(attribute => (
                <Box key={attribute.id} className="attribute">
                  {attribute.id === 'actions' ? (
                    attribute.value({ customer })
                  ) : (
                    <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                      {attribute.value({ customer })}
                    </Box>
                  )}
                </Box>
              ))}
            </GridListItem>
          ))}
          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Button color="primary" disabled={loading} onClick={() => dispatch.adminEnterpriseLicenses.fetchMore(undefined)}>
                {loading ? 'Loading...' : `Load More (${customers.length} of ${total})`}
              </Button>
            </Box>
          )}
        </GridList>
      )}

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Enterprise Customer</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Account Email"
            type="email"
            fullWidth
            value={newCustomerEmail}
            onChange={e => setNewCustomerEmail(e.target.value)}
            sx={{ marginTop: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCustomer} disabled={!newCustomerEmail.trim() || adding}>
            {adding ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Confirm
        open={!!removeTarget}
        title="Remove Enterprise Customer"
        action={removing ? 'Removing...' : 'Remove'}
        color="error"
        disabled={removing}
        onConfirm={handleRemoveCustomer}
        onDeny={() => setRemoveTarget(null)}
      >
        {removeTarget && (
          <>
            Are you sure you want to remove <strong>{removeTarget.email}</strong> from the enterprise license plan?
          </>
        )}
      </Confirm>
    </Container>
  )
}

