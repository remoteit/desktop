import React, { useEffect, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  FormControlLabel,
  Link,
  List,
  ListSubheader,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  AdminAccountTransfer,
  AdminExitTotal,
  AdminTransferKindUsage,
  AdminTransferSort,
  AdminTransferUsagePage,
  fetchAdminExitTransfer,
  fetchAdminTransferUsage,
} from '../services/adminTransferUsage'
import { gigabyteNumber, gigabytes, megabits } from '../components/TransferUsage'
import { LoadingMessage } from '../components/LoadingMessage'
import { Gutters } from '../components/Gutters'

export const SEARCH_DELAY = 300
export const NEAR_LIMIT = 0.8

const SORTS: { value: AdminTransferSort; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: 'exit', label: 'Exit' },
  { value: 'proxy', label: 'Proxy' },
]

export const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export type KindStatus = { level: 'over' | 'near' | 'ok'; text: string }

// Over: slowed, at its rate where the plan has one. Near: 80% of the allowance or more. No allowance is never near.
export const kindStatus = (usage: AdminTransferKindUsage): KindStatus => {
  if (usage.over)
    return { level: 'over', text: usage.rateBps ? `Slowed to ${megabits(usage.rateBps)} Mbit/s` : 'Slowed' }
  if (usage.allowanceBytes && usage.usedBytes >= usage.allowanceBytes * NEAR_LIMIT)
    return { level: 'near', text: 'Near limit' }
  return { level: 'ok', text: 'ok' }
}

const usedText = (usage: AdminTransferKindUsage) =>
  usage.allowanceBytes
    ? `${gigabyteNumber(usage.usedBytes)} of ${gigabytes(usage.allowanceBytes)}`
    : `${gigabytes(usage.usedBytes)}, no limit`

type Filter = { month?: string; search: string; overOnly: boolean; sort: AdminTransferSort }

/* Each account's public transfer in a month (services/adminTransferUsage), on Admin → Proxies & exits: the month's
   totals, the accounts — searchable, the over-allowance ones alone, sorted by either kind or both — a page at a time,
   and what each of remote.it's exits carried. Each read that fails says so in its own section and no more. */
export const AdminTransferUsage: React.FC = () => {
  const [filter, setFilter] = useState<Filter>({ search: '', overOnly: false, sort: 'total' })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState<AdminTransferUsagePage | 'ERROR'>()
  const [loading, setLoading] = useState(false)
  const [more, setMore] = useState<'loading' | 'ERROR'>()
  const [exits, setExits] = useState<AdminExitTotal[] | 'ERROR'>()
  const asked = useRef(0)

  const variables = (after?: string) => ({
    month: filter.month,
    search: filter.search || undefined,
    overOnly: filter.overOnly || undefined,
    sort: filter.sort,
    after,
  })

  // The search applies once typing pauses, not on every key.
  useEffect(() => {
    if (search.trim() === filter.search) return
    const timer = setTimeout(() => setFilter(f => ({ ...f, search: search.trim() })), SEARCH_DELAY)
    return () => clearTimeout(timer)
  }, [search, filter.search])

  // A newer filter's answer wins: one asked before it, a page more included, is dropped when it comes.
  useEffect(() => {
    const id = ++asked.current
    setLoading(true)
    setMore(undefined)
    fetchAdminTransferUsage(variables())
      .catch(() => 'ERROR' as const)
      .then(result => {
        if (id !== asked.current) return
        setPage(result)
        setLoading(false)
      })
  }, [filter])

  useEffect(() => {
    let current = true
    setExits(undefined)
    fetchAdminExitTransfer(filter.month)
      .catch(() => 'ERROR' as const)
      .then(result => current && setExits(result))
    return () => {
      current = false
    }
  }, [filter.month])

  const loadMore = async () => {
    if (!page || page === 'ERROR' || !page.next) return
    const id = asked.current
    setMore('loading')
    const result = await fetchAdminTransferUsage(variables(page.next)).catch(() => 'ERROR' as const)
    if (id !== asked.current) return
    if (result === 'ERROR') return setMore('ERROR')
    setMore(undefined)
    setPage({ ...page, accounts: [...page.accounts, ...result.accounts], next: result.next })
  }

  const loaded = page && page !== 'ERROR' ? page : undefined
  const months = !loaded ? [] : loaded.months.includes(loaded.month) ? loaded.months : [loaded.month, ...loaded.months]

  return (
    <>
      <List>
        <ListSubheader>Public transfer by account</ListSubheader>
      </List>
      <Gutters>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            select
            size="small"
            label="Month"
            value={filter.month ?? loaded?.month ?? ''}
            disabled={!loaded}
            sx={{ minWidth: 170 }}
            onChange={e => setFilter(f => ({ ...f, month: e.target.value }))}
            inputProps={{ 'data-choice': 'month' }}
          >
            {months.map(month => (
              <MenuItem key={month} value={month}>
                {monthLabel(month)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Search"
            placeholder="Email or account ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
            inputProps={{ 'data-choice': 'search' }}
          />
          <TextField
            select
            size="small"
            label="Sort by"
            value={filter.sort}
            sx={{ minWidth: 110 }}
            onChange={e => setFilter(f => ({ ...f, sort: e.target.value as AdminTransferSort }))}
            inputProps={{ 'data-choice': 'sort' }}
          >
            {SORTS.map(sort => (
              <MenuItem key={sort.value} value={sort.value}>
                {sort.label}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            label="Over allowance only"
            control={
              <Switch
                size="small"
                checked={filter.overOnly}
                onChange={e => setFilter(f => ({ ...f, overOnly: e.target.checked }))}
                inputProps={{ 'data-choice': 'over-only' } as any}
              />
            }
          />
        </Stack>
      </Gutters>
      {page === undefined ? (
        <LoadingMessage />
      ) : page === 'ERROR' ? (
        <Quiet testId="usage-error">Usage could not be read.</Quiet>
      ) : (
        <Box sx={{ opacity: loading ? 0.6 : undefined }}>
          <Totals page={page} />
          <Accounts accounts={page.accounts} overOnly={filter.overOnly} searched={!!filter.search} />
          {(page.next || more === 'ERROR') && (
            <Gutters>
              <Stack direction="row" spacing={1} alignItems="center">
                {page.next && (
                  <Button size="small" variant="outlined" disabled={more === 'loading'} onClick={loadMore}>
                    Load more
                  </Button>
                )}
                {more === 'ERROR' && (
                  <Typography variant="caption" color="textSecondary" data-testid="more-error">
                    More could not be read.
                  </Typography>
                )}
              </Stack>
            </Gutters>
          )}
        </Box>
      )}
      <List>
        <ListSubheader>Public transfer by exit</ListSubheader>
      </List>
      <Exits exits={exits} />
    </>
  )
}

const Quiet: React.FC<{ testId: string; children: React.ReactNode }> = ({ testId, children }) => (
  <Gutters>
    <Typography variant="caption" color="textSecondary" data-testid={testId}>
      {children}
    </Typography>
  </Gutters>
)

const Totals: React.FC<{ page: AdminTransferUsagePage }> = ({ page }) => {
  const { totals } = page
  const total = (label: string, bytes: number, accounts: number, kind: string) => (
    <Box data-total={kind}>
      <Typography variant="caption" color="textSecondary" component="p">
        {label}
      </Typography>
      <Typography variant="h3" component="p">
        {gigabytes(bytes)}
      </Typography>
      <Typography variant="caption" color="textSecondary" component="p">
        {accounts === 1 ? '1 account' : `${accounts} accounts`}
      </Typography>
    </Box>
  )
  return (
    <Gutters>
      <Stack direction="row" spacing={4} data-testid="usage-totals">
        {total(`Public exit, ${monthLabel(page.month)}`, totals.exitBytes, totals.exitAccounts, 'exit')}
        {total(`Public proxy, ${monthLabel(page.month)}`, totals.proxyBytes, totals.proxyAccounts, 'proxy')}
      </Stack>
    </Gutters>
  )
}

const Accounts: React.FC<{ accounts: AdminAccountTransfer[]; overOnly: boolean; searched: boolean }> = ({
  accounts,
  overOnly,
  searched,
}) => {
  if (!accounts.length)
    return (
      <Quiet testId="usage-empty">
        {overOnly || searched ? 'No account matches.' : 'No account used a public exit or proxy.'}
      </Quiet>
    )
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" data-testid="usage-accounts">
        <TableHead>
          <TableRow>
            <TableCell>Account</TableCell>
            <TableCell>Exit</TableCell>
            <TableCell>Proxy</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map(account => (
            <AccountRow key={account.accountId} account={account} />
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

const AccountRow: React.FC<{ account: AdminAccountTransfer }> = ({ account }) => {
  const statuses = (['exit', 'proxy'] as const)
    .map(kind => ({ kind, ...kindStatus(account[kind]) }))
    .filter(status => status.level !== 'ok')
    .sort((a, b) => (a.level === b.level ? 0 : a.level === 'over' ? -1 : 1))
  return (
    <TableRow data-account={account.accountId}>
      <TableCell>
        <Link component={RouterLink} to={`/admin/users/${account.accountId}`}>
          {account.email || account.accountId}
        </Link>
      </TableCell>
      <TableCell data-used="exit">{usedText(account.exit)}</TableCell>
      <TableCell data-used="proxy">{usedText(account.proxy)}</TableCell>
      <TableCell data-status={statuses[0]?.level ?? 'ok'}>
        {statuses.length
          ? statuses.map(status => (
              <Typography
                key={status.kind}
                variant="body2"
                component="p"
                color={status.level === 'over' ? 'warning.main' : undefined}
              >
                {status.text}{' '}
                <Typography variant="caption" color="textSecondary" component="span">
                  {status.kind}
                </Typography>
              </Typography>
            ))
          : 'ok'}
      </TableCell>
    </TableRow>
  )
}

const Exits: React.FC<{ exits?: AdminExitTotal[] | 'ERROR' }> = ({ exits }) => {
  if (exits === undefined) return <LoadingMessage />
  if (exits === 'ERROR') return <Quiet testId="exits-error">Exit transfer could not be read.</Quiet>
  if (!exits.length) return <Quiet testId="exits-empty">No exit carried public transfer.</Quiet>
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" data-testid="usage-exits">
        <TableHead>
          <TableRow>
            <TableCell>Exit</TableCell>
            <TableCell>Transfer</TableCell>
            <TableCell>Accounts</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...exits]
            .sort((a, b) => b.bytes - a.bytes)
            .map(exit => (
              <TableRow key={exit.exitId} data-exit={exit.exitId}>
                <TableCell>{exit.name || exit.exitId}</TableCell>
                <TableCell>{gigabytes(exit.bytes)}</TableCell>
                <TableCell>{exit.accounts}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Box>
  )
}
