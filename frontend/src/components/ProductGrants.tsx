import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { NetworkDeviceRole } from '../services/graphQLDeviceNetworks'
import { graphQLSetProxyProduct } from '../services/graphQLProxy'
import { refusalOf } from '../services/graphQL'
import {
  ProductNetwork,
  ProductPolicyServed,
  ProxyGrant,
  graphQLAddDeviceProductNetwork,
  graphQLProductProxies,
  graphQLRemoveDeviceProductNetwork,
} from '../services/productPolicy'
import { useDeviceNetworks } from '../hooks/useDeviceNetworks'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { ListItemSetting } from './ListItemSetting'
import { Notice } from './Notice'
import { Gutters } from './Gutters'
import { Icon } from './Icon'
import { LIST_ITEM_ICON_WIDTH, spacing } from '../styling'
import { roleName } from '../helpers/productPolicyHelper'

type Props = {
  productId: string
  accountId: string
  name: string // the product's
  served: ProductPolicyServed
  networks: ProductNetwork[] | null
  manage: boolean
  registrationWarning?: string | null
  onChanged: () => void // read the product again, its registration warning with it
}

const ROLES: NetworkDeviceRole[] = ['INITIATOR', 'TARGET', 'BOTH']

// A grant's change answered: true, or graphql's refusal in its words ('' where it said none).
type Changed = true | 'ERROR' | { reason: string }

/* What a product grants its devices (graphql-api docs/PROXY-GROUPS.md §11, "Products as principals"): membership of
   networks, as initiator or target; membership of the account's own proxies; and its tags, which a network's tag rules
   turn into access (on the product's page). The exit a device goes out through is never a product's: each device's own.
   A grant needs manage on the product and on what it grants — a network's, a proxy's —: graphql refuses it otherwise,
   in its words. A product with grants that still registers with reusable codes is warned of: join keys or one-time
   codes are recommended. */
export const ProductGrants: React.FC<Props> = ({
  productId,
  accountId,
  name,
  served,
  networks,
  manage,
  registrationWarning,
  onChanged,
}) => {
  const { t } = useTranslation()
  const [refusal, setRefusal] = useState<string>()
  const [saving, setSaving] = useState(false)

  const change = async (request: Promise<Changed>, failed: string) => {
    setSaving(true)
    setRefusal(undefined)
    const result = await request
    setSaving(false)
    if (result !== true) setRefusal(result !== 'ERROR' && result.reason ? result.reason : failed)
    onChanged()
  }

  return (
    <Box marginTop={2} data-product-grants>
      <Typography variant="subtitle1">{t('productGrants.title', 'Grants')}</Typography>
      <Gutters top={null} bottom="xs">
        <Typography variant="caption" component="p">
          {t(
            'productGrants.hint',
            'What its devices get while they belong to it. To change a grant, you must be able to manage what it grants.'
          )}
        </Typography>
      </Gutters>
      {registrationWarning && (
        <Gutters top="xs">
          <Notice severity="warning" fullWidth>
            <strong>{t('productGrants.warningTitle', 'Register its devices with join keys')}</strong>
            <em>{registrationWarning}</em>
          </Notice>
        </Gutters>
      )}
      {served.networks && networks && (
        <Networks productId={productId} name={name} networks={networks} manage={manage && !saving} change={change} />
      )}
      {served.proxies && (
        <Proxies productId={productId} accountId={accountId} manage={manage && !saving} change={change} />
      )}
      {refusal && (
        <Gutters>
          <Notice severity="error" fullWidth onClose={() => setRefusal(undefined)}>
            {refusal}
          </Notice>
        </Gutters>
      )}
    </Box>
  )
}

type Change = (request: Promise<Changed>, failed: string) => Promise<void>

// Its networks, each with the role its devices take there; another of the account's networks added with a role.
const Networks: React.FC<{
  productId: string
  name: string
  networks: ProductNetwork[]
  manage: boolean
  change: Change
}> = ({ productId, name, networks, manage, change }) => {
  const { t } = useTranslation()
  const { networks: all } = useDeviceNetworks()
  const [adding, setAdding] = useState('')
  const [role, setRole] = useState<NetworkDeviceRole>('TARGET')
  const choices = Array.isArray(all) ? all.filter(network => !networks.some(n => n.id === network.id)) : []
  const failed = t('productGrants.networkNotChanged', 'Its networks were not changed.')

  return (
    <Box data-product-networks>
      <Gutters top="sm" bottom={null}>
        <Typography variant="body2">{t('productGrants.networks', 'Networks')}</Typography>
      </Gutters>
      <List dense disablePadding>
        {!networks.length && (
          <ListItem>
            <ListItemIcon>
              <Icon name="chart-network" size="md" fixedWidth />
            </ListItemIcon>
            <ListItemText secondary={t('productGrants.noNetworks', 'None')} />
          </ListItem>
        )}
        {networks.map(network => (
          <ListItem
            key={network.id}
            data-network={network.id}
            secondaryAction={
              manage && (
                <ConfirmIconButton
                  icon="times"
                  title={t('productGrants.removeNetwork', 'Remove')}
                  confirm
                  confirmProps={{
                    title: t('productGrants.removeNetworkTitle', {
                      network: network.name,
                      name,
                      defaultValue: 'Take {{name}} off {{network}}?',
                    }),
                    action: t('productGrants.removeNetwork', 'Remove'),
                    color: 'warning',
                    children: (
                      <Typography variant="body2">
                        {t(
                          'productGrants.removeNetworkBody',
                          'Its devices that are members through the product leave the network, while it is synced or enforced. Under template they keep what they have.'
                        )}
                      </Typography>
                    ),
                  }}
                  onClick={() => change(graphQLRemoveDeviceProductNetwork(productId, network.id), failed)}
                />
              )
            }
          >
            <ListItemIcon>
              <Icon name="chart-network" size="md" fixedWidth />
            </ListItemIcon>
            <ListItemText primary={network.name} secondary={roleName(t, network.role)} />
          </ListItem>
        ))}
      </List>
      {manage && !!choices.length && (
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
          flexWrap="wrap"
          marginY={1}
          sx={{ marginLeft: `${spacing.md + LIST_ITEM_ICON_WIDTH}px`, marginRight: `${spacing.md}px` }}
        >
          <TextField
            select
            variant="filled"
            size="small"
            label={t('productGrants.addNetwork', 'Add a network')}
            value={adding}
            onChange={e => setAdding(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            inputProps={{ 'data-add-network': true }}
          >
            {choices.map(network => (
              <MenuItem key={network.id} value={network.id}>
                {network.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            variant="filled"
            size="small"
            label={t('productGrants.role', 'As')}
            sx={{ minWidth: 140 }}
            value={role}
            onChange={e => setRole(e.target.value as NetworkDeviceRole)}
            inputProps={{ 'data-add-role': true }}
          >
            {ROLES.map(each => (
              <MenuItem key={each} value={each}>
                {roleName(t, each)}
              </MenuItem>
            ))}
          </TextField>
          <Button
            size="small"
            variant="contained"
            disabled={!adding}
            data-add-network-button
            onClick={async () => {
              await change(graphQLAddDeviceProductNetwork(productId, adding, role), failed)
              setAdding('')
            }}
          >
            {t('productGrants.add', 'Add')}
          </Button>
        </Stack>
      )}
    </Box>
  )
}

// The account's own proxies, each joined or not: a member's devices run it, each going into service as it says.
const Proxies: React.FC<{ productId: string; accountId: string; manage: boolean; change: Change }> = ({
  productId,
  accountId,
  manage,
  change,
}) => {
  const { t } = useTranslation()
  const [proxies, setProxies] = useState<ProxyGrant[]>()

  const load = async () => {
    const answer = await graphQLProductProxies(productId, accountId)
    setProxies(answer === 'ERROR' ? [] : answer)
  }

  useEffect(() => {
    load()
  }, [productId, accountId])

  if (!proxies?.length) return null

  return (
    <Box data-product-proxies>
      <Gutters top="sm" bottom={null}>
        <Typography variant="body2">{t('productGrants.proxies', 'Proxies')}</Typography>
      </Gutters>
      <List dense disablePadding>
        {proxies.map(proxy => (
          <ListItemSetting
            key={proxy.id}
            icon="server"
            label={proxy.name}
            subLabel={
              proxy.joined
                ? t('productGrants.proxyJoined', 'Its devices run this proxy')
                : t('productGrants.proxyNotJoined', 'Its devices do not run this proxy')
            }
            toggle={proxy.joined}
            disabled={!manage}
            onClick={async () => {
              await change(
                graphQLSetProxyProduct(proxy.id, productId, !proxy.joined).then(result =>
                  refusalOf(result) === undefined ? true : { reason: refusalOf(result) || '' }
                ),
                t('productGrants.proxyNotChanged', 'Its proxies were not changed.')
              )
              await load()
            }}
          />
        ))}
      </List>
    </Box>
  )
}
