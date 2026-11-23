import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Button, Collapse, List, TextField, Typography } from '@mui/material'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLAddProxyDevice } from '../services/graphQLDeviceRuns'
import { Proxy, graphQLCreateProxy } from '../services/graphQLProxy'
import { NAME_MAX, validLabel } from '../services/subnetNames'
import { refusalWhy } from '../helpers/exitWords'
import { RunDevicePicker } from '../components/RunDevicePicker'
import { ProxyKindChoice } from '../components/ProxyKindChoice'
import { useAccountProxies } from '../hooks/useAccountExits'
import { Container } from '../components/Container'
import { FormField } from '../components/FormField'
import { ListItemSetting } from '../components/ListItemSetting'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

/* Creating a proxy server in one step: its name, where it is reached from, and the device to run it, then Create proxy
   server. Its host label and whether it takes public addresses for anyone sit under More options. A device refused is
   said here, the proxy server kept. */
export const ProxyAddPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const accountId = useSelector(selectActiveAccountId)
  const { reload } = useAccountProxies()
  const [name, setName] = useState('')
  const [local, setLocal] = useState(false)
  const [label, setLabel] = useState('')
  const [publicEndpoints, setPublicEndpoints] = useState(true)
  const [more, setMore] = useState(false)
  const [device, setDevice] = useState<string>()
  const [proxy, setProxy] = useState<Proxy>()
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const labelProblem = label && !validLabel(label)

  const create = async () => {
    setBusy(true)
    setRefusal(undefined)
    let made = proxy
    if (!made) {
      const created = await graphQLCreateProxy({
        name: name.trim(),
        label: label || undefined,
        publicEndpoints,
        local,
        accountId,
      })
      if ('reason' in created) {
        setBusy(false)
        return setRefusal(created.reason || t('proxyAdd.notMade', 'Couldn’t create the proxy server. Try again.'))
      }
      made = created
      setProxy(created)
      reload()
    }
    if (device) {
      const added = await graphQLAddProxyDevice(made.id, device)
      if ('reason' in added) {
        setBusy(false)
        reload()
        return setRefusal(
          t('proxyAdd.deviceRefused', 'Proxy server created, but that device couldn’t be added. {{reason}}', {
            reason: added.reason
              ? refusalWhy(t, 'proxy', added.reason).reason
              : t('exitAdd.tryAnother', 'Choose another device.'),
          })
        )
      }
    }
    setBusy(false)
    reload()
    history.push(`/proxies/${made.id}`)
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{t('proxyAdd.title', 'Create proxy server')}</Title>
          </Typography>
          <Gutters top={null} bottom="sm">
            <Typography variant="body2" color="textSecondary">
              {t('proxyAdd.intro', 'Name it and choose the device that will run it.')}
            </Typography>
          </Gutters>
        </>
      }
    >
      <List>
        <FormField>
          <TextField
            autoFocus
            variant="filled"
            label={t('proxyAdd.name', 'Name')}
            value={proxy ? proxy.name : name}
            disabled={!!proxy}
            inputProps={{ maxLength: 255 }}
            onChange={event => setName(event.target.value)}
            data-name
          />
        </FormField>
      </List>
      {!proxy && <ProxyKindChoice local={local} disabled={busy} onChange={setLocal} />}
      <Typography variant="subtitle1">{t('proxyAdd.device', 'Device to run it')}</Typography>
      <RunDevicePicker
        kind="proxy"
        target={proxy?.id}
        ownerId={proxy?.owner?.id || accountId}
        single
        onChoose={setDevice}
      />
      {!proxy && (
        <>
          <Gutters top="sm" bottom={null}>
            <Button
              size="small"
              onClick={() => setMore(!more)}
              endIcon={<Icon name={more ? 'chevron-up' : 'chevron-down'} size="sm" />}
              data-more
            >
              {t('proxyAdd.more', 'More options')}
            </Button>
          </Gutters>
          <Collapse in={more}>
            <List>
              <FormField help={labelProblem ? undefined : t('proxyAdd.labelHint', 'The first part of its addresses.')}>
                <TextField
                  variant="filled"
                  label={t('proxyAdd.label', 'Address label')}
                  placeholder={t('proxyAdd.labelAutomatic', 'Made from the name')}
                  value={label}
                  error={!!labelProblem}
                  helperText={
                    labelProblem
                      ? t('proxyAdd.labelProblem', 'Lower case letters and digits, at most {{max}}', {
                          max: NAME_MAX,
                        })
                      : undefined
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ maxLength: NAME_MAX }}
                  onChange={event => setLabel(event.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                />
              </FormField>
              <ListItemSetting
                icon="globe"
                label={t('proxyAdd.publicEndpoints', 'Allow public addresses anyone can open')}
                toggle={publicEndpoints}
                onClick={() => setPublicEndpoints(!publicEndpoints)}
              />
            </List>
          </Collapse>
        </>
      )}
      {refusal && (
        <Gutters>
          <Notice severity="error" fullWidth>
            {refusal}
          </Notice>
        </Gutters>
      )}
      <Gutters top="lg">
        <Button
          variant="contained"
          disabled={busy || (!proxy && (!name.trim() || !!labelProblem))}
          onClick={create}
          data-create
        >
          {proxy ? t('proxyAdd.addDevice', 'Add device') : t('proxyAdd.create', 'Create proxy server')}
        </Button>
        <Button disabled={busy} onClick={() => history.push(proxy ? `/proxies/${proxy.id}` : '/proxies')}>
          {proxy ? t('proxyAdd.open', 'Open proxy server') : t('exitAdd.cancel', 'Cancel')}
        </Button>
      </Gutters>
    </Container>
  )
}
