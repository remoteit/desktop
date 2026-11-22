import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import { Dispatch, State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { selectTags } from '../selectors/tags'
import { getProductModel } from '../models/products'
import { AppTarget, CatalogApp, graphQLAppTargets, graphQLCatalogApp } from '../services/graphQLAppCatalog'
import { DeviceAppChange, graphQLAddDeviceApps, MANY_DEVICES_MAX, refused } from '../services/graphQLDeviceApps'
import { graphQLSetDeviceProductApp } from '../services/productPolicy'
import { graphQLFetchDeviceCount } from '../services/graphQLDevice'
import { AppChangeResults } from '../components/AppChangeResults'
import { LoadingMessage } from '../components/LoadingMessage'
import { Notice } from '../components/Notice'
import { AppCapabilities } from '../components/AppRootConsent'
import { addAsks, adminControlLine, allowLine, appName, asksConsent, channelName } from '../helpers/appsHelper'

type Target = 'devices' | 'tag' | 'product'

/* Add <app> (presence-server docs/device-apps-design.md, "The Apps pages", /apps/:appID/add): a dialog over the app.

     To   Devices — the account's devices the person manages, searched by name; one that cannot take it is listed
               unticked with why (no Manage and Scripting there, already there, its administrator refuses it, no
               release here, not offered to it at all — no build for its platform —); a remote.it too old is said, and
               it can still be ticked: graphql gives it the release once remote.it is upgraded.
          A tag — any or all of the tags chosen, read once now: how many devices that is now, and a device tagged later
               gets nothing (that is what a product is for).
          A product — its devices now and later: set Enabled on the product (setDeviceProductApp state enabled), with
               the product's root consent.
     Channel  the account's, stable or beta; and a version to pin, where wanted.
     What it asks is the releases the choice gives (helpers/appsHelper addAsks): the pin, else the channel's — not the
     account's channel's where another is chosen. Where they ask for a consent (asksConsent, graphql's rule) the
     person's yes, in words, comes before Add is offered: to full control of each device where one runs as root — of
     every device in the product, now and later, for a product —, and to what they ask of remote.it (their
     capabilities), said in the same place. The yes is to those releases, for that target (and product): another choice
     asks it again.

   Devices and a tag call addDeviceApps (at most 500 devices a call: more, and it says to add it to a product); each
   device's result is listed after — Added · Enabled · Already there · Refused: <why>. */
export const AppAddDialog: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const { appID } = useParams<{ appID: string }>()
  const accountId = useSelector((state: State) => selectActiveAccountId(state))
  const userId = useSelector((state: State) => state.user.id)
  const account = accountId && accountId !== userId ? accountId : undefined
  const tags = useSelector(selectTags)
  const products = useSelector((state: State) => getProductModel(state).all)

  const [app, setApp] = useState<CatalogApp | null | 'ERROR'>()
  const [target, setTarget] = useState<Target>('devices')
  const [search, setSearch] = useState('')
  const [devices, setDevices] = useState<AppTarget[] | 'ERROR'>()
  const [ticked, setTicked] = useState<string[]>([])
  const [tagged, setTagged] = useState<string[]>([])
  const [operator, setOperator] = useState<ITagOperator>('ANY')
  const [tagCount, setTagCount] = useState<number>()
  const [productId, setProductId] = useState('')
  const [channel, setChannel] = useState('')
  const [pinning, setPinning] = useState(false)
  const [version, setVersion] = useState('')
  const [consentedTo, setConsentedTo] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const [results, setResults] = useState<DeviceAppChange[]>()
  const [productDone, setProductDone] = useState<string>()

  const close = () => history.push(`/apps/${appID}`)

  useEffect(() => {
    let current = true
    graphQLCatalogApp(appID, { accountId: account, releases: 100 }).then(
      answer => current && setApp(answer === 'UNSERVED' ? 'ERROR' : answer)
    )
    dispatch.tags.fetchIfEmpty(accountId)
    dispatch.products.fetchIfEmpty()
    return () => {
      current = false
    }
  }, [appID, account])

  useEffect(() => {
    if (target !== 'devices') return
    let current = true
    const timer = setTimeout(
      () => graphQLAppTargets(appID, { accountId: account, name: search }).then(answer => current && setDevices(answer)),
      search ? 300 : 0
    )
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [appID, account, search, target])

  useEffect(() => {
    setTagCount(undefined)
    if (target !== 'tag' || !tagged.length) return
    let current = true
    graphQLFetchDeviceCount({ tag: { operator, values: tagged }, accountId } as gqlOptions).then(response => {
      if (current && response !== 'ERROR') setTagCount(response?.data?.data?.login?.account?.devices?.total)
    })
    return () => {
      current = false
    }
  }, [target, tagged.join(','), operator, accountId])

  const ready = app && app !== 'ERROR' ? app : undefined
  const standing = ready?.releases.filter(r => !r.withdrawn) ?? []
  const asks = ready ? addAsks(ready, channel, pinning ? version : undefined) : undefined
  const root = !!asks?.root
  const capabilities = asks?.capabilities
  const asking = asksConsent(asks)
  // A release it gives not among those read: what it asks is not known, and Add waits.
  const unknown = !!asks && !asks.known
  const consentFor = [target, target === 'product' ? productId : '', ...(asks?.versions ?? [])].join('/')
  const consented = consentedTo === consentFor
  const product = products.find(p => p.id === productId)
  const count = target === 'devices' ? ticked.length : target === 'tag' ? tagCount ?? 0 : 0
  const tooMany = target !== 'product' && count > MANY_DEVICES_MAX
  const chosen = target === 'devices' ? ticked.length > 0 : target === 'tag' ? tagged.length > 0 : !!product
  const done = !!results || !!productDone
  const canAdd = !!ready && chosen && !tooMany && (!asking || consented) && !unknown && !busy && !done

  const release = {
    ...(channel && { channel }),
    ...(pinning && version && { version }),
    ...(asking && consented && { consentRoot: true }),
  }

  const add = async () => {
    if (!ready) return
    setBusy(true)
    setRefusal(undefined)
    if (target === 'product' && product) {
      const answer = await graphQLSetDeviceProductApp(product.id, ready.id, 'enabled', release)
      setBusy(false)
      if (answer === true) setProductDone(product.name)
      else setRefusal((answer !== 'ERROR' && answer.reason) || t('apps.notAddedRetry', 'Couldn’t add the app. Try again.'))
      return
    }
    const answer = await graphQLAddDeviceApps(ready.id, {
      ...(target === 'devices' ? { deviceIds: ticked } : { tags: { operator, values: tagged } }),
      accountId: account,
      ...release,
    })
    setBusy(false)
    if (refused(answer)) setRefusal(answer.reason || t('apps.notAddedRetry', 'Couldn’t add the app. Try again.'))
    else setResults(answer)
  }

  const tick = (id: string) => setTicked(now => (now.includes(id) ? now.filter(d => d !== id) : [...now, id]))

  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm" data-app-add-dialog>
      <DialogTitle>{t('apps.addTitle', 'Add {{app}}', { app: ready ? appName(t, ready) : appID })}</DialogTitle>
      <DialogContent>
        {app === undefined ? (
          <LoadingMessage />
        ) : !ready ? (
          <Notice severity="error" fullWidth>
            {app === null
              ? t('apps.notInCatalog', 'This app is not one this account may use.')
              : t('apps.catalogFailedRetry', 'Couldn’t load apps. Reload the page to try again.')}
          </Notice>
        ) : done ? (
          <Box data-app-add-results>
            {results && <AppChangeResults changes={results} adding />}
            {productDone && (
              <Typography variant="body2" data-app-add-product-done>
                {t('apps.productEnabled', '{{product}} sets {{app}} enabled on its devices, now and later.', {
                  product: productDone,
                  app: ready.name,
                })}
              </Typography>
            )}
          </Box>
        ) : (
          <>
            <Typography variant="subtitle2" color="textSecondary">
              {t('apps.to', 'To')}
            </Typography>
            <RadioGroup row value={target} onChange={e => setTarget(e.target.value as Target)}>
              <FormControlLabel value="devices" control={<Radio size="small" />} label={t('apps.toDevices', 'Devices')} data-app-add-to="devices" />
              <FormControlLabel value="tag" control={<Radio size="small" />} label={t('apps.toTag', 'A tag')} data-app-add-to="tag" />
              <FormControlLabel value="product" control={<Radio size="small" />} label={t('apps.toProduct', 'A product')} data-app-add-to="product" />
            </RadioGroup>

            {target === 'devices' && (
              <Box data-app-add-devices>
                <TextField
                  size="small"
                  fullWidth
                  variant="standard"
                  placeholder={t('apps.searchDevices', 'Search devices…')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {devices === undefined ? (
                  <LoadingMessage />
                ) : devices === 'ERROR' ? (
                  <Notice severity="error" fullWidth gutterTop>
                    {t('apps.devicesFailedRetry', 'Couldn’t load devices. Try again.')}
                  </Notice>
                ) : (
                  <List dense sx={{ maxHeight: 280, overflowY: 'auto' }}>
                    {devices.map(device => {
                      const why = whyNot(t, device)
                      return (
                        <ListItem key={device.id} disableGutters data-app-add-device={device.id}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Checkbox
                              size="small"
                              edge="start"
                              disabled={!!why}
                              checked={!why && ticked.includes(device.id)}
                              onChange={() => tick(device.id)}
                              inputProps={{ 'aria-label': device.name, 'data-app-add-tick': device.id } as any}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={device.name}
                            secondary={
                              why ??
                              (device.has === 'disabled'
                                ? t('apps.offThere', 'Off there. Adding turns it on.')
                                : device.offer?.needsNewer
                                ? t('apps.needsNewerAgentTick', 'Needs a newer agent. It starts once the agent is updated.')
                                : undefined)
                            }
                            secondaryTypographyProps={{ color: why ? 'textSecondary' : 'warning.main' }}
                          />
                        </ListItem>
                      )
                    })}
                  </List>
                )}
              </Box>
            )}

            {target === 'tag' && (
              <Box data-app-add-tags sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <TextField
                  select
                  size="small"
                  variant="standard"
                  label={t('apps.tags', 'Tags')}
                  value={tagged}
                  onChange={e => setTagged([...(e.target as unknown as HTMLSelectElement).selectedOptions].map(o => o.value))}
                  SelectProps={{ native: true, multiple: true }}
                  inputProps={{ 'data-app-add-tag-select': true }}
                  sx={{ minWidth: 200 }}
                >
                  {tags.map(tag => (
                    <option key={tag.name} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  variant="standard"
                  value={operator}
                  onChange={e => setOperator(e.target.value as ITagOperator)}
                  SelectProps={{ native: true }}
                  inputProps={{ 'data-app-add-operator': true }}
                >
                  <option value="ANY">{t('apps.anyTag', 'Any of these')}</option>
                  <option value="ALL">{t('apps.allTags', 'All of these')}</option>
                </TextField>
                {tagCount !== undefined && (
                  <Typography variant="body2" color="textSecondary" data-app-add-tag-count>
                    {t('apps.devicesNow', { count: tagCount, defaultValue_one: '{{count}} device now', defaultValue_other: '{{count}} devices now' })}
                  </Typography>
                )}
                <Typography variant="caption" color="textSecondary" component="p" sx={{ width: '100%' }}>
                  {t('apps.tagOnce', 'The tag is read once, now: a device tagged later gets nothing. A product gives it to its devices now and later.')}
                </Typography>
              </Box>
            )}

            {target === 'product' && (
              <Box data-app-add-product>
                <TextField
                  select
                  size="small"
                  variant="standard"
                  fullWidth
                  label={t('apps.product', 'Product')}
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  SelectProps={{ native: true }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 'data-app-add-product-select': true }}
                >
                  <option value="">{t('apps.chooseProduct', 'Choose a product')}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </TextField>
                <Typography variant="caption" color="textSecondary" component="p" sx={{ marginTop: 1 }}>
                  {t('apps.productNowAndLater', 'Its devices now and later: set Enabled on the product.')}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', marginTop: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                size="small"
                variant="standard"
                label={t('apps.channel', 'Channel')}
                value={channel}
                onChange={e => setChannel(e.target.value)}
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ 'data-app-add-channel': true }}
              >
                <option value="">
                  {t('apps.accountDefaultChannel', 'Account default ({{channel}})', {
                    channel: channelName(t, ready.accountChannel ?? 'stable'),
                  })}
                </option>
                <option value="stable">{channelName(t, 'stable')}</option>
                <option value="beta">{channelName(t, 'beta')}</option>
              </TextField>
              {pinning ? (
                <TextField
                  select
                  size="small"
                  variant="standard"
                  label={t('apps.keepOn', 'Keep on')}
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  SelectProps={{ native: true }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 'data-app-add-version': true }}
                >
                  <option value="">{t('apps.latestVersion', 'Latest version')}</option>
                  {standing.map(r => (
                    <option key={r.version} value={r.version}>
                      {r.version}
                    </option>
                  ))}
                </TextField>
              ) : (
                <Button size="small" onClick={() => setPinning(true)} disabled={!standing.length} data-app-add-pin>
                  {t('apps.keepOnOneVersion', 'Keep on one version')}
                </Button>
              )}
            </Box>

            {asking && (
              <Box
                sx={{ marginTop: 2 }}
                data-app-add-root={root || undefined}
                data-app-add-capabilities={!root || undefined}
              >
                <Notice severity="warning" fullWidth>
                  {root && (
                    <Typography variant="body2">
                      {target === 'product'
                        ? t('apps.rootProduct', '{{app}} runs as root: full control of every device in this product, now and later.', { app: ready.name })
                        : t('apps.rootDevices', '{{app}} runs as root: full control of each device.', { app: ready.name })}
                    </Typography>
                  )}
                  <AppCapabilities
                    capabilities={capabilities}
                    title={root ? undefined : t('apps.capabilitiesAsksFor', 'It also asks for')}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={consented}
                        onChange={e => setConsentedTo(e.target.checked ? consentFor : undefined)}
                        inputProps={{ 'data-app-add-consent': true } as any}
                      />
                    }
                    label={allowLine(t, root, target === 'product', ready.publisher.name, ready.name)}
                  />
                </Notice>
              </Box>
            )}
            {unknown && (
              <Typography variant="body2" color="error" sx={{ marginTop: 1 }} data-app-add-unknown>
                {t(
                  'apps.asksUnknown',
                  'What this version asks could not be read, so it cannot be consented to here. Try again later.'
                )}
              </Typography>
            )}
            {tooMany && (
              <Typography variant="body2" color="error" sx={{ marginTop: 1 }} data-app-add-too-many>
                {t('apps.tooMany', 'More than 500 devices: add it to a product.')}
              </Typography>
            )}
            {refusal && (
              <Box sx={{ marginTop: 1 }}>
                <Notice severity="error" fullWidth onClose={() => setRefusal(undefined)}>
                  {refusal}
                </Notice>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close} data-app-add-close>
          {done ? t('apps.done', 'Done') : t('apps.cancel', 'Cancel')}
        </Button>
        {!done && (
          <Button variant="contained" color={asking ? 'error' : 'primary'} disabled={!canAdd} onClick={add} data-app-add-submit>
            {busy
              ? t('apps.adding', 'Adding…')
              : target === 'product'
              ? t('apps.addToProduct', 'Set Enabled on {{product}}', { product: product?.name ?? t('apps.theProduct', 'the product') })
              : t('apps.addToCount', {
                  count,
                  defaultValue_one: 'Add to {{count}} device',
                  defaultValue_other: 'Add to {{count}} devices',
                })}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

// Why a device cannot be ticked: none where it can.
function whyNot(t: TFunction, device: AppTarget): string | undefined {
  if (!device.canRun) return t('apps.needsManageScripting', 'Needs Manage and Scripting on it')
  if (device.has === 'enabled') return t('apps.alreadyThere', 'Already there')
  // Adding it — or enabling it, disabled there — its administrator refuses under local or off, as graphql does.
  const admin = adminControlLine(t, device)
  if (admin) return admin
  if (device.has === 'disabled') return
  if (!device.offer) return t('apps.notOffered', 'Not offered to this device: no build for its platform, or not its account’s')
  if (device.offer.refused) return device.offer.refused
  if (!device.offer.version) return t('apps.noReleaseYet', 'Not available yet')
}

