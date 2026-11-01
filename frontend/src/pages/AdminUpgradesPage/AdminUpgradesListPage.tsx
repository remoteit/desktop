import React, { useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box, Button, List, ListSubheader, Stack, Typography } from '@mui/material'
import { State } from '../../store'
import { Container } from '../../components/Container'
import { ScrollContent } from './ScrollContent'
import { GridList } from '../../components/GridList'
import { Gutters } from '../../components/Gutters'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Notice } from '../../components/Notice'
import { IconButton } from '../../buttons/IconButton'
import { removeObject } from '../../helpers/utilHelper'
import { UNSUPPORTED } from '../../services/graphQLDaemon'
import { AdminChannelOverview } from './AdminChannelOverview'
import { AdminRolloutListItem } from './AdminRolloutListItem'
import { adminRolloutAttributes } from './adminRolloutAttributes'
import { NEW_ROLLOUT, UPGRADES_ROUTE, active, dateTime, hasOfflineBands } from './rolloutHelpers'
import { UpgradesSeenToggle, keepSeen } from './upgradesSeen'
import { Upgrades } from './useUpgrades'
import { useRecount } from './useRecount'
import { RecountNote } from './RecountNote'
import { UpgradesTabs } from './UpgradesTabs'

export const AdminUpgradesListPage: React.FC<{ upgrades: Upgrades }> = ({ upgrades }) => {
  const history = useHistory()
  const location = useLocation()
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(adminRolloutAttributes, a => a.required === true)
  const { channels, runs, loading, fetchedAt, live, reload } = upgrades
  const shown = Array.isArray(channels) ? channels : []
  const recount = useRecount(
    useCallback(() => shown.map(c => c.channel), [channels]),
    reload,
    () => shown.map(c => c.rollout?.checked)
  )

  const header = (
    <Gutters>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="h2">Upgrades</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="textSecondary">
            {live ? 'Live · ' : ''}
            {fetchedAt ? `read ${dateTime(new Date(fetchedAt).toISOString())}` : ''}
          </Typography>
          <RecountNote state={recount.state} problem={recount.problem} />
          <IconButton
            icon="sync"
            title="Refresh: recount the channels"
            onClick={recount.recount}
            spin={loading || recount.state === 'recounting'}
            size="md"
          />
          {runs !== false && runs !== UNSUPPORTED && (
            <Button
              variant="contained"
              size="small"
              onClick={() => history.push(keepSeen(`${UPGRADES_ROUTE}/${NEW_ROLLOUT}`, location.search))}
            >
              New rollout
            </Button>
          )}
        </Stack>
      </Stack>
      <UpgradesTabs value="rollouts" />
      <Box sx={{ marginTop: 1 }} data-upgrades-seen>
        <UpgradesSeenToggle bands={shown.some(c => hasOfflineBands(c.rollout))} />
      </Box>
    </Gutters>
  )

  if (channels === undefined) return <LoadingMessage message="Loading upgrades..." />

  if (channels === UNSUPPORTED)
    return (
      <Container integrated gutterBottom header={header}>
        <Gutters>
          <Notice severity="info" fullWidth>
            This API does not serve device package upgrades.
            <em>Point Test Settings → API Target at a stage that does (solo, local or dev).</em>
          </Notice>
        </Gutters>
      </Container>
    )

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true, className: 'upgrades-scroll' }}
      header={header}
    >
      <ScrollContent>
        <List>
          <ListSubheader disableGutters>
            <Gutters>Channels</Gutters>
          </ListSubheader>
        </List>
        <Gutters>
          {channels === 'ERROR' ? (
            <Notice severity="error" fullWidth>
              Could not read the release channels.
            </Notice>
          ) : (
            channels.map(channel => (
              <AdminChannelOverview
                key={channel.channel}
                channel={channel}
                install={channel.channel === 'stable' && upgrades.install ? upgrades.install : undefined}
                onChanged={reload}
                live={Array.isArray(runs) && runs.some(run => run.channel === channel.channel && active(run))}
              />
            ))
          )}
        </Gutters>
        <List>
          <ListSubheader disableGutters>
            <Gutters>Rollouts</Gutters>
          </ListSubheader>
        </List>
        {runs === undefined ? (
          <LoadingMessage message="Loading rollouts..." />
        ) : runs === false || runs === UNSUPPORTED ? (
          <Gutters>
            <Notice severity="info" fullWidth>
              This API has no rollout controller yet.
              <em>Channels above are live; rollout runs appear once graphql serves daemonRollouts.</em>
            </Notice>
          </Gutters>
        ) : runs === 'ERROR' ? (
          <Gutters>
            <Notice severity="error" fullWidth>
              Could not read the rollouts.
            </Notice>
          </Gutters>
        ) : !runs.length ? (
          <Gutters>
            <Notice severity="info" fullWidth>
              No rollouts yet
            </Notice>
          </Gutters>
        ) : (
          <Box>
            <GridList attributes={attributes} required={required} columnWidths={columnWidths} fetching={loading}>
              {runs.map(run => (
                <AdminRolloutListItem
                  key={run.id}
                  run={run}
                  required={required}
                  attributes={attributes}
                  active={location.pathname === `${UPGRADES_ROUTE}/${run.id}`}
                  onClick={() => history.push(keepSeen(`${UPGRADES_ROUTE}/${run.id}`, location.search))}
                />
              ))}
            </GridList>
          </Box>
        )}
      </ScrollContent>
    </Container>
  )
}
