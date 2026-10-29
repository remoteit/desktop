import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, Checkbox, List, Stack, Typography } from '@mui/material'
import { Dispatch, State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { disabledAdaptor, graphQLFetchDisabledDevices } from '../services/deviceDisable'
import { useDeviceDisable, useDisabledDevicesAccess } from '../hooks/useDeviceDisable'
import { disabledDescription } from '../components/DisabledDeviceNotice'
import { DecommissionDialog } from '../components/DecommissionDialog'
import { ListItemCheckbox } from '../components/ListItemCheckbox'
import { LoadingMessage } from '../components/LoadingMessage'
import { TargetPlatform } from '../components/TargetPlatform'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

type DisabledRow = Pick<IDevice, 'id' | 'name' | 'disabledAt' | 'disabledReason' | 'disabledBy'> & {
  platform?: number
  owner?: IUserRef
}

/* The account's disabled devices (graphql-api docs/DEVICE-DISABLE.md), for its owner and org admins: when each was
   disabled, by whom or by the expiry, and Restore or Decommission… — one, or those ticked. Read here, apart from the
   device lists, which leave disabled devices out. */
export const DisabledDevicesPage: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const schema = useDeviceDisable()
  const access = useDisabledDevicesAccess()
  const accountId = useSelector(selectActiveAccountId)
  const destroying = useSelector((state: State) => state.ui.destroying)
  const [rows, setRows] = useState<DisabledRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [decommission, setDecommission] = useState<DisabledRow[]>([])

  const load = useCallback(
    async (from = 0) => {
      setLoading(true)
      const response = await graphQLFetchDisabledDevices(accountId, from)
      setLoading(false)
      if (response === 'ERROR') return setFailed(true)
      setFailed(false)
      const devices = response?.data?.data?.login?.account?.devices
      const page: DisabledRow[] = (devices?.items || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        platform: d.platform,
        owner: d.owner,
        ...disabledAdaptor(d),
      }))
      setTotal(devices?.total || 0)
      setRows(previous => (from ? [...previous, ...page.filter(p => !previous.some(r => r.id === p.id))] : page))
      if (!from) setSelected([])
    },
    [accountId]
  )

  useEffect(() => {
    if (schema?.filter && access) load()
  }, [schema, access, load])

  if (!access)
    return (
      <Body center>
        <Typography variant="body2" color="textSecondary">
          {t('disabledDevicesPage.noAccess', 'Disabled devices are seen by their owner and the organization’s admins.')}
        </Typography>
      </Body>
    )

  const restore = async (ids: string[]) => {
    if (await dispatch.devices.restore(ids)) load()
  }

  const byId = (ids: string[]) => rows.filter(r => ids.includes(r.id))
  const allSelected = !!rows.length && selected.length === rows.length

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>{t('disabledDevicesPage.title', 'Disabled devices')}</Title>
          </Typography>
          <Gutters bottom="sm">
            <Typography variant="body2" color="textSecondary">
              {t(
                'disabledDevicesPage.description',
                'A disabled device serves nothing and is not counted, but keeps its services, shares and settings. Restore it to bring it back as it was, or decommission it to remove it for good.'
              )}
            </Typography>
          </Gutters>
          {!!rows.length && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ paddingLeft: 1, paddingRight: 3 }}>
              <Checkbox
                checked={allSelected}
                indeterminate={!!selected.length && !allSelected}
                onChange={event => setSelected(event.target.checked ? rows.map(r => r.id) : [])}
                checkedIcon={<Icon name="check-square" size="md" type="solid" />}
                indeterminateIcon={<Icon name="minus-square" size="md" type="solid" />}
                icon={<Icon name="square" size="md" />}
                inputProps={{ 'aria-label': t('disabledDevicesPage.selectAll', 'Select all') }}
              />
              <Typography variant="caption" sx={{ flexGrow: 1 }}>
                {selected.length
                  ? t('disabledDevicesPage.selectedCount', {
                      count: selected.length,
                      defaultValue_one: '{{count}} selected',
                      defaultValue_other: '{{count}} selected',
                    })
                  : t('disabledDevicesPage.count', {
                      count: total,
                      defaultValue_one: '{{count}} disabled device',
                      defaultValue_other: '{{count}} disabled devices',
                    })}
              </Typography>
              <Button
                size="small"
                variant="contained"
                disabled={!selected.length || destroying}
                onClick={() => restore(selected)}
              >
                {t('disabledDevicesPage.restoreSelected', 'Restore')}
              </Button>
              <Button
                size="small"
                color="error"
                disabled={!selected.length || destroying}
                onClick={() => setDecommission(byId(selected))}
              >
                {t('disabledDevicesPage.decommissionSelected', 'Decommission…')}
              </Button>
            </Stack>
          )}
        </>
      }
    >
      {!schema?.filter ? (
        schema === undefined ? (
          <LoadingMessage />
        ) : (
          <Notice gutterTop>
            {t('disabledDevicesPage.notServed', 'This server does not list disabled devices yet.')}
          </Notice>
        )
      ) : loading && !rows.length ? (
        <LoadingMessage />
      ) : failed ? (
        <Notice severity="error" gutterTop>
          {t('disabledDevicesPage.failed', 'Disabled devices could not be read.')}
        </Notice>
      ) : !rows.length ? (
        <Body center>
          <Typography variant="body2" color="textSecondary">
            {t('disabledDevicesPage.empty', 'No disabled devices.')}
          </Typography>
        </Body>
      ) : (
        <>
          <List>
            {rows.map(row => (
              <ListItemCheckbox
                key={row.id}
                checked={selected.includes(row.id)}
                label={
                  <Box display="flex" alignItems="center">
                    <TargetPlatform id={row.platform} size="md" inlineLeft />
                    {row.name}
                  </Box>
                }
                subLabel={disabledDescription(t, row)}
                onClick={checked =>
                  setSelected(previous => (checked ? [...previous, row.id] : previous.filter(id => id !== row.id)))
                }
              >
                <Stack direction="row" onClick={event => event.stopPropagation()}>
                  <IconButton
                    icon="rotate-left"
                    title={t('disabledDevicesPage.restore', 'Restore')}
                    disabled={destroying}
                    onClick={() => restore([row.id])}
                  />
                  <IconButton
                    icon="trash"
                    title={t('disabledDevicesPage.decommission', 'Decommission…')}
                    disabled={destroying}
                    onClick={() => setDecommission([row])}
                  />
                  <IconButton
                    icon="angle-right"
                    title={t('disabledDevicesPage.open', 'Open')}
                    to={`/devices/${row.id}`}
                  />
                </Stack>
              </ListItemCheckbox>
            ))}
          </List>
          {rows.length < total && (
            <Box display="flex" justifyContent="center">
              <Button size="small" disabled={loading} onClick={() => load(rows.length)}>
                {t('disabledDevicesPage.more', 'Load more')}
              </Button>
            </Box>
          )}
        </>
      )}
      <DecommissionDialog
        open={!!decommission.length}
        devices={decommission}
        onClose={() => setDecommission([])}
        onDone={() => load()}
      />
    </Container>
  )
}
