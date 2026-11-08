import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, Button, Checkbox, List, ListItemButton, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material'
import { getAllDevices } from '../selectors/devices'
import { RunCandidate, graphQLRunCandidates } from '../services/graphQLDeviceRuns'
import { lanAddWarning } from '../helpers/runsHelper'
import { LoadingMessage } from './LoadingMessage'
import { Notice } from './Notice'

// An account of more than this many devices names those to weigh.
export const CANDIDATES_MAX = 1000

// None refused yet: one object, so the candidates are read again only when an add answers.
const NO_REFUSALS: ILookup<string> = {}

type Props = {
  kind: 'proxy' | 'exit'
  target: string // the proxy's or exit's id
  ownerId: string // its account: where it has too many devices to weigh them all, those the app has listed are weighed
  busy?: boolean
  // Each device refused, by id, with graphql's words: said by its name, left chosen to try again. Each answer read again.
  refusals?: ILookup<string>
  // An exit whose users reach its devices' local networks: each device added opens its own to them, said before.
  lan?: boolean
  action?: string
  onAdd: (deviceIds: string[]) => void
  onSkip?: () => void
  skip?: string
}

/* Devices to run a proxy or an exit (graphql-api docs/PROXY-GROUPS.md §13, "No shortcuts"; graphql exitCandidates and
   proxyCandidates): its account's devices you manage, each fit to be added, or why not in the words adding it would
   refuse with — another account's, a client only, its administrator forbidding it on the machine, not online to say
   what it can be, using the exit itself, or serving others in another — said beside it. Those running it already are
   listed with it, not here. A search narrows them by name, and more than one is chosen at once. Each joins out of
   service and goes into service as the activation says, once its checks pass. Added to an exit whose users reach its
   devices' local networks, each takes that too: said above the button, naming those chosen, before any is added. */
export const RunDevicePicker: React.FC<Props> = ({
  kind,
  target,
  ownerId,
  busy,
  refusals = NO_REFUSALS,
  lan,
  action,
  onAdd,
  onSkip,
  skip,
}) => {
  const { t } = useTranslation()
  const devices = useSelector(getAllDevices)
  const [candidates, setCandidates] = useState<RunCandidate[] | { reason: string }>()
  const [search, setSearch] = useState('')
  const [chosen, setChosen] = useState<string[]>([])
  const owner = ownerId.toUpperCase()

  // Read when shown, and again after each add — those added run it now. An account with too many devices to weigh
  // whole is weighed by those the app has listed.
  useEffect(() => {
    let live = true
    const listed = () =>
      devices
        .filter(device => device.owner?.id?.toUpperCase() === owner && device.permissions.includes('MANAGE'))
        .map(device => device.id)
        .filter((id, index, all) => all.indexOf(id) === index)
        .slice(0, CANDIDATES_MAX)
    ;(async () => {
      let read = await graphQLRunCandidates(kind, { id: target })
      if ('reason' in read && listed().length) read = await graphQLRunCandidates(kind, { id: target }, listed())
      if (live) setCandidates(read)
    })()
    return () => {
      live = false
    }
  }, [kind, target, owner, refusals])

  const all = Array.isArray(candidates)
    ? candidates
        .filter(candidate => !runsIt(candidate, kind, target))
        .sort((a, b) => Number(b.fit) - Number(a.fit) || nameOf(a).localeCompare(nameOf(b)))
    : []
  const fit = all.filter(candidate => candidate.fit)
  // The search field shows with more than eight to choose from, and stays while a search is set, so a search is never
  // left narrowing the list unseen.
  const searching = all.length > 8 || !!search
  const shown = search.trim()
    ? all.filter(candidate => nameOf(candidate).toLowerCase().includes(search.trim().toLowerCase()))
    : all
  const refused = Object.keys(refusals)
  // Only the chosen devices still fit are counted and added: one added meanwhile, or no longer fit, is not chosen.
  const listed = chosen.filter(id => fit.some(candidate => candidate.id === id))
  const ids = fit.map(candidate => candidate.id).join()

  useEffect(() => {
    setChosen(list => {
      const still = list.filter(id => fit.some(candidate => candidate.id === id))
      return still.length === list.length ? list : still
    })
  }, [ids])

  const toggle = (id: string) => setChosen(list => (list.includes(id) ? list.filter(each => each !== id) : [...list, id]))

  if (candidates === undefined) return <LoadingMessage />

  return (
    <Box data-device-picker={kind}>
      {'reason' in candidates && (
        <Notice severity="error" fullWidth gutterBottom>
          {candidates.reason || t('runDevicePicker.unread', 'The devices could not be read: try again.')}
        </Notice>
      )}
      {!!refused.length && (
        <Notice severity="warning" fullWidth gutterBottom>
          {refused.map(id => (
            <div key={id} data-refused={id}>
              {t('runDevicePicker.refused', '{{device}}: {{reason}}', {
                device: nameOf(all.find(candidate => candidate.id === id) ?? { id, name: null }),
                reason: refusals[id] || t('runDevicePicker.notAdded', 'not added: try again'),
              })}
            </div>
          ))}
        </Notice>
      )}
      {searching && (
        <TextField
          size="small"
          fullWidth
          label={t('runDevicePicker.search', 'Find a device')}
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      )}
      {Array.isArray(candidates) && !all.length ? (
        <Typography variant="body2" color="textSecondary" paddingY={1}>
          {t('runDevicePicker.none', 'No device of this account that you manage is listed here.')}
        </Typography>
      ) : (
        <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
          {shown.map(candidate => (
            <ListItemButton
              key={candidate.id}
              dense
              disabled={!candidate.fit}
              data-candidate={candidate.id}
              data-fit={candidate.fit ? 'yes' : 'no'}
              onClick={() => candidate.fit && toggle(candidate.id)}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  size="small"
                  checked={chosen.includes(candidate.id)}
                  disabled={!candidate.fit}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText primary={nameOf(candidate)} secondary={candidateLine(t, kind, candidate)} />
            </ListItemButton>
          ))}
        </List>
      )}
      {kind === 'exit' && lan && (
        <Notice severity="warning" fullWidth gutterTop>
          <span data-lan-warning>
            {lanAddWarning(
              t,
              listed.map(id => nameOf(fit.find(candidate => candidate.id === id) ?? { id, name: null }))
            )}
          </span>
        </Notice>
      )}
      <Box display="flex" gap={1} marginTop={1}>
        <Button variant="contained" size="small" disabled={busy || !listed.length} data-add onClick={() => onAdd(listed)}>
          {action ||
            t('runDevicePicker.add', {
              count: listed.length,
              defaultValue_one: 'Add {{count}} device',
              defaultValue_other: 'Add {{count}} devices',
            })}
        </Button>
        {onSkip && (
          <Button size="small" disabled={busy} onClick={onSkip}>
            {skip || t('runDevicePicker.skip', 'Not now')}
          </Button>
        )}
      </Box>
    </Box>
  )
}

const nameOf = (candidate: Pick<RunCandidate, 'id' | 'name'>) => candidate.name || candidate.id

// Whether a device runs this very proxy or exit: listed with it already, not here.
const runsIt = (candidate: RunCandidate, kind: 'proxy' | 'exit', target: string) =>
  kind === 'proxy' ? candidate.runs.proxy?.proxy?.id === target : candidate.runs.exit?.exit?.id === target

// Beside a device: why it cannot be added, or what it leaves to run this one.
export function candidateLine(t: TFunction, kind: 'proxy' | 'exit', candidate: RunCandidate): string {
  if (!candidate.fit) return candidate.refusal || t('runDevicePicker.unfit', 'It cannot run it')
  const other = kind === 'proxy' ? candidate.runs.proxy?.proxy?.name : candidate.runs.exit?.exit?.name
  if (other)
    return kind === 'proxy'
      ? t('runDevicePicker.leavesProxy', 'Runs the proxy {{name}}: added, it leaves it', { name: other })
      : t('runDevicePicker.leavesExit', 'Runs the exit {{name}}: added, it leaves it', { name: other })
  return t('runDevicePicker.fit', 'Can run it')
}

// Devices added one after another: each refusal by device, in graphql's words.
export async function addEach(
  deviceIds: string[],
  add: (deviceId: string) => Promise<{ runs: unknown } | { reason: string }>
): Promise<ILookup<string>> {
  const refusals: ILookup<string> = {}
  for (const id of deviceIds) {
    const result = await add(id)
    if ('reason' in result) refusals[id] = result.reason
  }
  return refusals
}
