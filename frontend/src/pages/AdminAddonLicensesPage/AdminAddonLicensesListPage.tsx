import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { Attribute } from '../../components/Attributes'
import { Confirm } from '../../components/Confirm'
import { Container } from '../../components/Container'
import { GridList } from '../../components/GridList'
import { GridListItem } from '../../components/GridListItem'
import { Gutters } from '../../components/Gutters'
import { Icon } from '../../components/Icon'
import { LoadingMessage } from '../../components/LoadingMessage'
import { removeObject } from '../../helpers/utilHelper'
import { graphQLAddAddonCustomer, graphQLRemoveAddonCustomer } from '../../services/graphQLMutation'
import { AdminAddonCustomer, AdminAddonProduct } from '../../models/adminAddonLicenses'
import { AI_AGENT_PRODUCT_ID } from '../../models/plans'
import { Dispatch, State } from '../../store'

/* Add-on licences (graphql-api docs/AI-AGENT-LICENSE.md): one page for every add-on product, not
   one per add-on. The product is in the URL (/admin/add-ons/:productId) so a reload, a deep link
   and the sidebar's remembered route all land on the same list. ai-agent is the first product;
   the next one is a product row on the API and shows up in the selector with no change here. */

export const ADMIN_ADDONS_ROUTE = '/admin/add-ons'

const productLabel = (product?: AdminAddonProduct) =>
  product ? `${product.description || product.name}${product.enabled ? '' : ' (disabled)'}` : 'add-on'

// `datetime-local` needs `YYYY-MM-DDTHH:mm` in local time — toISOString() would shift to UTC.
const toInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

type AddonCustomerAttributeOptions = {
  customer?: AdminAddonCustomer
  /* The add-on the row's licence is for, looked up from the row's own productId — so the row says
     what it holds without leaning on the selector above it. */
  product?: AdminAddonProduct
}

// The ai-agent add-on wears the feature's own mark; any other add-on the generic one.
const addonIcon = (productId?: string) => (productId === AI_AGENT_PRODUCT_ID ? 'remote-ai' : 'puzzle-piece')

class AddonCustomerAttribute extends Attribute<AddonCustomerAttributeOptions> {
  type: Attribute['type'] = 'MASTER'
  translate = false // internal-only admin registry: render English, skip columns.* translation
}

const addonCustomerAttributes: AddonCustomerAttribute[] = [
  new AddonCustomerAttribute({
    id: 'email',
    label: 'Account',
    defaultWidth: 250,
    required: true,
    value: ({ customer }) => customer?.email || '-',
  }),
  new AddonCustomerAttribute({
    id: 'addon',
    label: 'Add-on',
    defaultWidth: 150,
    value: ({ product, customer }) => product?.description || product?.name || customer?.productId || '-',
  }),
  new AddonCustomerAttribute({
    id: 'devices',
    label: 'Devices',
    defaultWidth: 100,
    value: ({ customer }) => customer?.deviceCount ?? 0,
  }),
  new AddonCustomerAttribute({
    id: 'members',
    label: 'Members',
    defaultWidth: 100,
    value: ({ customer }) => customer?.memberCount ?? 0,
  }),
  new AddonCustomerAttribute({
    id: 'created',
    label: 'Granted',
    defaultWidth: 150,
    value: ({ customer }) => (customer?.created ? new Date(customer.created).toLocaleDateString() : '-'),
  }),
  new AddonCustomerAttribute({
    id: 'expiration',
    label: 'Expires',
    defaultWidth: 170,
    value: ({ customer }) => {
      if (!customer?.expiration) return '-'
      // The row outlives its time-box (the API skips an expired licence in the limits merge but
      // keeps the row until it is revoked), so say so rather than show a date that reads as future.
      const date = new Date(customer.expiration)
      const expired = date.getTime() < Date.now()
      return (
        <Box component="span" sx={expired ? { color: 'error.main' } : undefined}>
          {expired ? 'Expired ' : ''}
          {date.toLocaleDateString()}
        </Box>
      )
    },
  }),
]

export const AdminAddonLicensesListPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const location = useLocation()
  const { productId: urlProductId } = useParams<{ productId?: string }>()
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const defaultSelection = useSelector((state: State) => state.ui.defaultSelection)
  /* Each dialog acts on what it was OPENED for, not on the selection at the moment it is confirmed:
     the grant dialog captures the product, and the revoke confirm takes the product from the row.
     The URL can move the selection while a dialog is up — Back/Forward, or the product refresh
     redirecting off a product the API dropped — and a mutation built from the live selection would
     then hit product B under a title that said A. Both dialogs also close when that happens. */
  const [grantFor, setGrantFor] = useState<AdminAddonProduct | null>(null)
  const [grantEmail, setGrantEmail] = useState('')
  const [grantExpiration, setGrantExpiration] = useState('')
  const [granting, setGranting] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<AdminAddonCustomer | null>(null)
  const [removing, setRemoving] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const products = useSelector((state: State) => state.adminAddonLicenses.products)
  const productsLoaded = useSelector((state: State) => state.adminAddonLicenses.productsLoaded)
  const productId = useSelector((state: State) => state.adminAddonLicenses.productId)
  const customers = useSelector((state: State) => state.adminAddonLicenses.customers)
  const loading = useSelector((state: State) => state.adminAddonLicenses.loading)
  const total = useSelector((state: State) => state.adminAddonLicenses.total)
  const hasMore = useSelector((state: State) => state.adminAddonLicenses.hasMore)
  const searchValue = useSelector((state: State) => state.adminAddonLicenses.searchValue)

  const product = products.find(p => p.id === productId)
  const label = productLabel(product)
  const productOf = (customer: AdminAddonCustomer) => products.find(p => p.id === customer.productId)
  const removeLabel = removeTarget ? productLabel(productOf(removeTarget)) : label

  const listAttributes = useMemo(
    () => [
      ...addonCustomerAttributes,
      new AddonCustomerAttribute({
        id: 'actions',
        label: '',
        defaultWidth: 48,
        align: 'right',
        value: ({ customer }) => (
          <IconButton
            size="small"
            title="Revoke add-on license"
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
    dispatch.adminAddonLicenses.fetchProducts()
  }, [])

  // The URL is the selection — once the API has confirmed it names an add-on, so a stale link never
  // fires a list request that can only be refused. `select` is a no-op for the product on screen.
  useEffect(() => {
    if (urlProductId && products.some(p => p.id === urlProductId)) dispatch.adminAddonLicenses.select(urlProductId)
  }, [urlProductId, products])

  // No product in the URL, or one the API no longer lists: go to the product last looked at, else
  // the first add-on. Waits for the product list so a deep link to a real product is never bounced.
  useEffect(() => {
    if (!productsLoaded || !products.length) return
    if (urlProductId && products.some(p => p.id === urlProductId)) return
    const saved = defaultSelection['admin']?.[ADMIN_ADDONS_ROUTE]
    const remembered = products.find(p => saved === `${ADMIN_ADDONS_ROUTE}/${p.id}`)
    history.replace(`${ADMIN_ADDONS_ROUTE}/${(remembered || products[0]).id}`)
  }, [urlProductId, productsLoaded, products])

  // Remember the product for the sidebar's Add-ons entry (AdminSidebarNav.handleNavClick)
  useEffect(() => {
    if (urlProductId)
      dispatch.ui.setDefaultSelected({ key: ADMIN_ADDONS_ROUTE, value: location.pathname, accountId: 'admin' })
  }, [location.pathname])

  // Enter commits the term; the model refetches for it (and retires the page in flight).
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      dispatch.adminAddonLicenses.setSearch(searchInput)
    }
  }

  const closeGrantDialog = () => {
    setGrantFor(null)
    setGrantEmail('')
    setGrantExpiration('')
  }

  // The selection moved: whatever a dialog was about is no longer on screen.
  useEffect(() => {
    setRemoveTarget(null)
    closeGrantDialog()
  }, [productId])

  const handleGrant = async () => {
    const email = grantEmail.trim()
    if (!email || !grantFor) return
    const grantLabel = productLabel(grantFor)

    // Blank = open-ended. Sent as null, not omitted: the API leaves an OMITTED expiration alone,
    // and re-granting a time-boxed holder from a blank form should give the open-ended grant the
    // form shows, not silently keep the old date.
    const expiration = grantExpiration ? new Date(grantExpiration).toISOString() : null

    setGranting(true)
    const result = await graphQLAddAddonCustomer(grantFor.id, email, expiration)
    setGranting(false)

    // A refused grant (unknown email, a disabled add-on, a Stripe-owned licence) already surfaced
    // the API's own message; the dialog stays open for a correction.
    if (result === 'ERROR') return
    if (result?.data?.data?.addAddonCustomer) {
      closeGrantDialog()
      dispatch.ui.set({ successMessage: `Granted ${grantLabel} to ${email}` })
      await dispatch.adminAddonLicenses.fetch()
    } else {
      dispatch.ui.set({ errorMessage: `Failed to grant ${grantLabel}` })
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return

    setRemoving(true)
    // The row's own product — the licence being revoked is the one the row showed
    const result = await graphQLRemoveAddonCustomer(removeTarget.productId, removeTarget.userId)
    setRemoving(false)

    if (result === 'ERROR') return
    if (result?.data?.data?.removeAddonCustomer) {
      dispatch.ui.set({ successMessage: `Revoked ${removeLabel} from ${removeTarget.email}` })
      setRemoveTarget(null)
      await dispatch.adminAddonLicenses.fetch()
    } else {
      dispatch.ui.set({ errorMessage: `Failed to revoke ${removeLabel}` })
    }
  }

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <Gutters>
          {/* Two rows: which add-on and its one action, then the search over that add-on's holders */}
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                select
                size="small"
                label="Add-on"
                // Out-of-range values make MUI's Select warn; hold '' until the list carries the product.
                value={product ? product.id : ''}
                onChange={e => history.push(`${ADMIN_ADDONS_ROUTE}/${e.target.value}`)}
                sx={{ minWidth: 180 }}
              >
                {products.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    {productLabel(p)}
                  </MenuItem>
                ))}
              </TextField>
              {/* A disabled add-on refuses new grants at the API; its existing ones can still be revoked. */}
              {product?.enabled && (
                <Button
                  onClick={() => setGrantFor(product)}
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<Icon name="plus" />}
                  sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Grant
                </Button>
              )}
            </Stack>
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
      {productsLoaded && !products.length ? (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <Icon name="puzzle-piece" size="xxl" color="grayLight" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            No add-on products
          </Typography>
          <Typography variant="body2" color="grayDark.main">
            An add-on is a product with no default plan on the API — none is defined on this stage.
          </Typography>
        </Box>
      ) : loading && customers.length === 0 ? (
        <LoadingMessage message={`Loading ${label} licenses...`} />
      ) : customers.length === 0 ? (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <Icon name="puzzle-piece" size="xxl" color="grayLight" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {searchValue ? `No matching ${label} licenses` : `No ${label} licenses granted`}
          </Typography>
        </Box>
      ) : (
        <GridList attributes={attributes} required={required} columnWidths={columnWidths} fetching={loading}>
          {customers.map(customer => (
            <GridListItem
              key={customer.userId}
              disableGutters
              icon={<Icon name={addonIcon(customer.productId)} size="md" color="grayDark" />}
              required={required?.value({ customer, product: productOf(customer) })}
            >
              {attributes.map(attribute => (
                <Box key={attribute.id} className="attribute">
                  {attribute.id === 'actions' ? (
                    attribute.value({ customer })
                  ) : (
                    <Box
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}
                    >
                      {attribute.value({ customer, product: productOf(customer) })}
                    </Box>
                  )}
                </Box>
              ))}
            </GridListItem>
          ))}
          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Button
                color="primary"
                disabled={loading}
                onClick={() => dispatch.adminAddonLicenses.fetchMore(undefined)}
              >
                {loading ? 'Loading...' : `Load More (${customers.length} of ${total})`}
              </Button>
            </Box>
          )}
        </GridList>
      )}

      <Dialog open={!!grantFor} onClose={closeGrantDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Grant {productLabel(grantFor ?? undefined)}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Account Email"
            type="email"
            fullWidth
            value={grantEmail}
            onChange={e => setGrantEmail(e.target.value)}
            sx={{ marginTop: 2 }}
          />
          <TextField
            margin="dense"
            label="Expires"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: toInputValue(new Date()) }}
            value={grantExpiration}
            onChange={e => setGrantExpiration(e.target.value)}
            helperText="Optional — blank grants it open-ended. Granting an account that already holds it replaces its expiration."
            sx={{ marginTop: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeGrantDialog}>Cancel</Button>
          <Button onClick={handleGrant} disabled={!grantEmail.trim() || granting}>
            {granting ? 'Granting...' : 'Grant'}
          </Button>
        </DialogActions>
      </Dialog>

      <Confirm
        open={!!removeTarget}
        title={`Revoke ${removeLabel}`}
        action={removing ? 'Revoking...' : 'Revoke'}
        color="error"
        disabled={removing}
        onConfirm={handleRemove}
        onDeny={() => setRemoveTarget(null)}
      >
        {removeTarget && (
          <>
            Are you sure you want to revoke <strong>{removeLabel}</strong> from <strong>{removeTarget.email}</strong>?
            The account loses the feature immediately.
          </>
        )}
      </Confirm>
    </Container>
  )
}
