import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Checkbox,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  TextField,
  Typography,
} from '@mui/material'
import { getAllDevices } from '../selectors/devices'
import { RunCandidate, graphQLRunCandidates } from '../services/graphQLDeviceRuns'
import { lanAddWarning } from '../helpers/runsHelper'
import { candidateFitLine, candidateWhy, candidatesShown, refusalWhy } from '../helpers/exitWords'
import { CarrierWhy } from './CarrierWhy'
import { LoadingMessage } from './LoadingMessage'
import { Notice } from './Notice'

// An account of more than this many devices names those to weigh.
export const CANDIDATES_MAX = 1000

// None refused yet: one object, so the candidates are read again only when an add answers.
const NO_REFUSALS: ILookup<string> = {}

type Props = {
  kind: 'proxy' | 'exit'
  target?: string // the proxy's or exit's id; none for one not made yet, weighed for the account ownerId
  ownerId: string // its account: where it has too many devices to weigh them all, those the app has listed are weighed
  busy?: boolean
  // Each device refused, by id, with graphql's words: said by its name, left chosen to try again. Each answer read again.
  refusals?: ILookup<string>
  // An exit whose users reach its devices' local networks: each device added opens its own to them, said before.
  lan?: boolean
  action?: string
  // One device chosen at most, and no button: each choice is said through onChoose.
  single?: boolean
  onChoose?: (deviceId: string | undefined) => void
  onAdd?: (deviceIds: string[]) => void
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
  single,
  onChoose,
  onAdd,
  onSkip,
  skip,
}) => {
  const { t } = useTranslation()
  const devices = useSelector(getAllDevices)
  const [candidates, setCandidates] = useState<RunCandidate[] | { reason: string }>()
  const [search, setSearch] = useState('')
  const [showUnfit, setShowUnfit] = useState(false)
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
      const of = target ? { id: target } : { accountId: ownerId }
      let read = await graphQLRunCandidates(kind, of)
      if ('reason' in read && listed().length) read = await graphQLRunCandidates(kind, of, listed())
      if (live) setCandidates(read)
    })()
    return () => {
      live = false
    }
  }, [kind, target, owner, refusals])

  const all = Array.isArray(candidates) ? candidatesShown(kind, candidates, target) : []
  const fit = all.filter(candidate => candidate.fit)
  // The search field shows with more than eight to choose from, and stays while a search is set, so a search is never
  // left narrowing the list unseen.
  const searching = all.length > 8 || !!search
  const matched = search.trim()
    ? all.filter(candidate => nameOf(candidate).toLowerCase().includes(search.trim().toLowerCase()))
    : all
  // Devices that can't be used wait behind a toggle while some can, so the choice stays short.
  const unfit = matched.filter(candidate => !candidate.fit)
  const folded = !showUnfit && unfit.length < matched.length
  const shown = folded ? matched.filter(candidate => candidate.fit) : matched
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

  useEffect(() => {
    if (single) onChoose?.(listed[0])
  }, [single, listed[0]])

  const toggle = (id: string) =>
    setChosen(list =>
      single ? (list.includes(id) ? [] : [id]) : list.includes(id) ? list.filter(each => each !== id) : [...list, id]
    )

  if (candidates === undefined) return <LoadingMessage />

  return (
    <Box data-device-picker={kind}>
      {'reason' in candidates && (
        <Notice severity="error" fullWidth gutterBottom>
          {candidates.reason || t('runDevicePicker.unread', 'Couldn’t load your devices. Try again.')}
        </Notice>
      )}
      {!!refused.length && (
        <Notice severity="warning" fullWidth gutterBottom>
          {refused.map(id => (
            <div key={id} data-refused={id}>
              {t('runDevicePicker.refused', '{{device}}: {{reason}}', {
                device: nameOf(all.find(candidate => candidate.id === id) ?? { id, name: null }),
                reason: refusals[id]
                  ? refusalWhy(t, kind, refusals[id]).reason
                  : t('runDevicePicker.notAdded', 'Couldn’t add it. Try again.'),
              })}
            </div>
          ))}
        </Notice>
      )}
      {searching && (
        <TextField
          fullWidth
          sx={{ marginBottom: 1 }}
          label={t('runDevicePicker.search', 'Find a device')}
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      )}
      {Array.isArray(candidates) && !all.length ? (
        <Typography variant="body2" color="textSecondary" paddingY={1}>
          {kind === 'exit'
            ? t('carry.noCandidates', 'You have no device that can be an exit device yet. Add a device first.')
            : t('carry.noCandidatesProxy', 'You have no device that can run a proxy server yet. Add a device first.')}
        </Typography>
      ) : (
        <List
          dense
          disablePadding
          sx={{
            maxHeight: 340,
            overflowY: 'auto',
            '& .MuiListItemButton-root': { paddingLeft: 0.5 },
            '& .MuiListItemIcon-root': { justifyContent: 'flex-start' },
          }}
        >
          {shown.map(candidate => (
            <ListItemButton
              key={candidate.id}
              dense
              disableGutters
              disabled={!candidate.fit}
              data-candidate={candidate.id}
              data-fit={candidate.fit ? 'yes' : 'no'}
              onClick={() => candidate.fit && toggle(candidate.id)}
            >
              <ListItemIcon>
                {single ? (
                  <Radio
                    edge="start"
                    size="small"
                    checked={chosen.includes(candidate.id)}
                    disabled={!candidate.fit}
                    tabIndex={-1}
                    disableRipple
                  />
                ) : (
                  <Checkbox
                    edge="start"
                    size="small"
                    checked={chosen.includes(candidate.id)}
                    disabled={!candidate.fit}
                    tabIndex={-1}
                    disableRipple
                  />
                )}
              </ListItemIcon>
              <ListItemText
                primary={nameOf(candidate)}
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  candidate.fit ? (
                    candidateFitLine(t, kind, candidate) || undefined
                  ) : (
                    <CarrierWhy why={candidateWhy(t, kind, candidate)} />
                  )
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
      {!!unfit.length && unfit.length < matched.length && (
        <Button size="small" onClick={() => setShowUnfit(!showUnfit)} data-show-unfit>
          {showUnfit
            ? t('carry.hideUnfit', 'Hide devices that can’t be used')
            : t('carry.showUnfit', {
                count: unfit.length,
                defaultValue_one: 'Show {{count}} device that can’t be used',
                defaultValue_other: 'Show {{count}} devices that can’t be used',
              })}
        </Button>
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
      {!single && (
        <Box display="flex" gap={1} marginTop={1}>
          <Button
            variant="contained"
            size="small"
            disabled={busy || !listed.length}
            data-add
            onClick={() => onAdd?.(listed)}
          >
            {action ||
              (listed.length
                ? t('runDevicePicker.add', {
                    count: listed.length,
                    defaultValue_one: 'Add {{count}} device',
                    defaultValue_other: 'Add {{count}} devices',
                  })
                : t('runDevicePicker.addNone', 'Add devices'))}
          </Button>
          {onSkip && (
            <Button size="small" disabled={busy} onClick={onSkip}>
              {skip || t('runDevicePicker.skip', 'Not now')}
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}

const nameOf = (candidate: Pick<RunCandidate, 'id' | 'name'>) => candidate.name || candidate.id

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
