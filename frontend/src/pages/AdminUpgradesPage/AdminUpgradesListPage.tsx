import React from 'react'
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
import { NEW_ROLLOUT, UPGRADES_ROUTE, dateTime } from './rolloutHelpers'
import { Upgrades } from './useUpgrades'
import { UpgradesTabs } from './UpgradesTabs'

export const AdminUpgradesListPage: React.FC<{ upgrades: Upgrades }> = ({ upgrades }) => {
  const history = useHistory()
  const location = useLocation()
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(adminRolloutAttributes, a => a.required === true)
  const { channels, runs, loading, fetchedAt, live, reload } = upgrades

  const header = (
    <Gutters>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="h2">Upgrades</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="textSecondary">
            {live ? 'Live · ' : ''}
            {fetchedAt ? `read ${dateTime(new Date(fetchedAt).toISOString())}` : ''}
          </Typography>
          <IconButton icon="sync" title="Refresh" onClick={reload} spin={loading} size="md" />
          {runs !== false && runs !== UNSUPPORTED && (
            <Button variant="contained" size="small" onClick={() => history.push(`${UPGRADES_ROUTE}/${NEW_ROLLOUT}`)}>
              New rollout
            </Button>
          )}
        </Stack>
      </Stack>
      <UpgradesTabs value="rollouts" />
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
            channels.map(channel => <AdminChannelOverview key={channel.channel} channel={channel} />)
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
                  onClick={() => history.push(`${UPGRADES_ROUTE}/${run.id}`)}
                />
              ))}
            </GridList>
          </Box>
        )}
      </ScrollContent>
    </Container>
  )
}
