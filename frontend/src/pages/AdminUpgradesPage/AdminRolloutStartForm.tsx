import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Box, Button, Chip, InputAdornment, List, ListItem, MenuItem, TextField, Typography } from '@mui/material'
import { Confirm } from '../../components/Confirm'
import { Container } from '../../components/Container'
import { fieldSx } from '../../components/ServiceForm'
import { Gutters } from '../../components/Gutters'
import { ListItemCheckbox } from '../../components/ListItemCheckbox'
import { Notice } from '../../components/Notice'
import { Title } from '../../components/Title'
import { IconButton } from '../../buttons/IconButton'
import { spacing } from '../../styling'
import { DAEMON_CHANNELS } from '../../services/graphQLDaemon'
import {
  DaemonChannel,
  DaemonPackage,
  FALLBACK_DEFAULTS,
  RolloutDefaults,
  RolloutRun,
  StartRollout,
  graphQLDaemonPackages,
  graphQLRolloutDefaults,
  startArgsServed,
  startDaemonRollout,
} from '../../services/graphQLDaemonRollout'
import { UPGRADES_ROUTE, compareVersions, dateTime, parseLadder, runningNewest } from './rolloutHelpers'

type Props = { channels: DaemonChannel[]; runs?: RolloutRun[]; showBackArrow?: boolean; onStarted: () => void }

// The manifest a version's release is published at, guessed from the channel's current one: the same URL with the
// version swapped. Only for an API that does not list the published packages.
export const manifestFor = (version: string, channel?: DaemonChannel) => {
  const current = channel?.current
  if (!version || !current?.manifest || !current.manifest.includes(current.version)) return ''
  return current.manifest.split(current.version).join(version)
}

// What each published version already is to the channel: its current release, its candidate, or one a run has taken.
export const packageMarks = (version: string, channel?: DaemonChannel, runs: RolloutRun[] = []) => {
  const marks: string[] = []
  if (channel?.current?.version === version) marks.push('current')
  if (channel?.candidate?.version === version) marks.push('candidate')
  if (runs.some(run => run.channel === channel?.channel && run.version === version && run.mode !== 'manual'))
    marks.push('used')
  return marks
}

const number = (text: string) => (text.trim() === '' ? NaN : Number(text))
const atLeast = (text: string, min: number) => Number.isFinite(number(text)) && number(text) >= min

const formFrom = (defaults: RolloutDefaults) => ({
  ladder: defaults.ladder.join(', '),
  soak: String(defaults.soakMinutes),
  firstSoak: String(defaults.firstSoakMinutes),
  rateFloor: String(defaults.rateFloor),
  rateCeiling: String(defaults.rateCeiling),
  failureThreshold: String(defaults.failureThreshold),
})

export const AdminRolloutStartForm: React.FC<Props> = ({ channels, runs = [], showBackArrow, onStarted }) => {
  const history = useHistory()
  const names = channels.length ? channels.map(c => c.channel) : DAEMON_CHANNELS
  const [channel, setChannel] = useState(names[0])
  const [packages, setPackages] = useState<DaemonPackage[] | 'ERROR' | false>()
  const [version, setVersion] = useState('')
  const [manifest, setManifest] = useState('')
  const [editManifest, setEditManifest] = useState(false)
  // Every setting shown as it will be: the controller's defaults, filled in once read, each editable.
  const [form, setForm] = useState(formFrom(FALLBACK_DEFAULTS))
  const [touched, setTouched] = useState(false)
  const [promote, setPromote] = useState(false)
  const [rollback, setRollback] = useState(false)
  // Whether startDaemonRollout takes `rollback`: without it the box is not offered, as the API would drop it.
  const [rollbackServed, setRollbackServed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState<string>()

  useEffect(() => {
    let live = true
    graphQLDaemonPackages().then(found => live && setPackages(found))
    startArgsServed().then(args => live && setRollbackServed(args.has('rollback')))
    graphQLRolloutDefaults().then(defaults => live && !touched && setForm(formFrom(defaults)))
    return () => {
      live = false
    }
  }, [])

  const change = (patch: Partial<typeof form>) => {
    setTouched(true)
    setForm(current => ({ ...current, ...patch }))
  }

  const selected = channels.find(c => c.channel === channel)
  const listed = Array.isArray(packages) && packages.length > 0
  const picked = listed ? (packages as DaemonPackage[]).find(p => p.version === version) : undefined
  // A listed version's manifest is the one published with it, unless edited for an unusual case.
  const shownManifest = editManifest
    ? manifest
    : picked?.manifest ?? (listed ? '' : manifestFor(version.trim(), selected))

  // A version older than the newest the channel's devices may run goes back: only a rollback does that, and the server
  // refuses it otherwise.
  const newest = runningNewest(selected)
  const older = !!version.trim() && !!newest && compareVersions(version.trim(), newest) < 0

  const pick = (next: string) => {
    setVersion(next)
    const pkg = listed ? (packages as DaemonPackage[]).find(p => p.version === next) : undefined
    setManifest(pkg?.manifest ?? '')
    setEditManifest(false)
  }

  const ladder = parseLadder(form.ladder)
  const valid = {
    ladder: !!ladder,
    soak: atLeast(form.soak, 0),
    firstSoak: atLeast(form.firstSoak, 0),
    rateFloor: atLeast(form.rateFloor, 0.1),
    rateCeiling: atLeast(form.rateCeiling, 0.1) && number(form.rateCeiling) >= number(form.rateFloor),
    failureThreshold: atLeast(form.failureThreshold, 0) && Number.isInteger(number(form.failureThreshold)),
  }
  const ready =
    !!version.trim() && /^https:\/\//.test(shownManifest.trim()) && Object.values(valid).every(Boolean) && !saving

  const start: StartRollout = {
    channel,
    candidateVersion: version.trim(),
    candidateManifest: shownManifest.trim(),
    ladder,
    soakMinutes: number(form.soak),
    firstSoakMinutes: number(form.firstSoak),
    rateFloor: number(form.rateFloor),
    rateCeiling: number(form.rateCeiling),
    failureThreshold: number(form.failureThreshold),
    promoteWhenDone: promote,
    ...(rollbackServed ? { rollback } : {}),
  }

  const submit = async () => {
    setConfirming(false)
    setSaving(true)
    setProblem(undefined)
    const result = await startDaemonRollout(start)
    setSaving(false)
    if (!result.ok) return setProblem(result.reason)
    onStarted()
    history.push(result.data?.id ? `${UPGRADES_ROUTE}/${result.data.id}` : UPGRADES_ROUTE)
  }

  const header = (
    <Box>
      {showBackArrow && (
        <Box
          sx={{
            height: 45,
            display: 'flex',
            alignItems: 'center',
            paddingX: `${spacing.md}px`,
            marginTop: `${spacing.sm}px`,
          }}
        >
          <IconButton
            icon="chevron-left"
            title="Back to Upgrades"
            onClick={() => history.push(UPGRADES_ROUTE)}
            size="md"
            color="grayDarker"
          />
        </Box>
      )}
      <Typography variant="h2" sx={{ padding: 2 }}>
        <Title>New rollout</Title>
      </Typography>
    </Box>
  )

  const numberField = (
    key: 'soak' | 'firstSoak' | 'rateFloor' | 'rateCeiling' | 'failureThreshold',
    label: string,
    caption: React.ReactNode,
    unit?: string
  ) => (
    <ListItem sx={fieldSx}>
      <TextField
        label={label}
        variant="filled"
        type="number"
        value={form[key]}
        error={!valid[key]}
        onChange={e => change({ [key]: e.target.value })}
        inputProps={{ 'data-field': key, min: 0, step: 'any' }}
        InputProps={
          unit
            ? {
                endAdornment: (
                  <InputAdornment position="end" sx={{ marginRight: 1.5 }}>
                    {unit}
                  </InputAdornment>
                ),
              }
            : undefined
        }
      />
      <Typography variant="caption">{caption}</Typography>
    </ListItem>
  )

  return (
    <Container gutterBottom bodyProps={{ verticalOverflow: true }} header={header}>
      {problem && (
        <Gutters>
          <Notice severity="error" fullWidth onClose={() => setProblem(undefined)}>
            {problem}
          </Notice>
        </Gutters>
      )}
      <form data-start-form onSubmit={e => e.preventDefault()}>
        <List>
          <ListItem sx={fieldSx}>
            <TextField
              select
              label="Channel"
              variant="filled"
              value={channel}
              onChange={e => setChannel(e.target.value)}
            >
              {names.map(name => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="caption">
              Now on {selected?.current?.version || 'no release'}
              {selected?.candidate ? `, candidate ${selected.candidate.version} at ${selected.percent}%` : ''}.
            </Typography>
          </ListItem>

          <ListItem sx={fieldSx}>
            {listed ? (
              <TextField
                select
                required
                label="Candidate version"
                variant="filled"
                value={version}
                onChange={e => pick(e.target.value)}
                inputProps={{ 'data-field': 'version' }}
                SelectProps={{ renderValue: value => String(value) }}
              >
                {(packages as DaemonPackage[]).map(pkg => (
                  <MenuItem key={pkg.version} value={pkg.version} data-package={pkg.version}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Box sx={{ flex: 1 }}>
                        {pkg.version}
                        <Typography variant="caption" color="textSecondary" component="div">
                          published {dateTime(pkg.publishedAt)}
                          {pkg.platforms.length ? ` · ${pkg.platforms.length} platforms` : ''}
                        </Typography>
                      </Box>
                      {packageMarks(pkg.version, selected, runs).map(mark => (
                        <Chip
                          key={mark}
                          size="small"
                          label={mark}
                          color={mark === 'current' ? 'primary' : 'default'}
                          variant={mark === 'current' ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                required
                label="Candidate version"
                variant="filled"
                value={version}
                onChange={e => pick(e.target.value)}
                inputProps={{ 'data-field': 'version' }}
              />
            )}
            <Typography variant="caption">
              {older && !rollback && (
                <Box
                  component="span"
                  data-older-warning
                  sx={{ display: 'block', color: 'warning.main', fontWeight: 500 }}
                >
                  Older than what devices run ({newest}) — check Rollback to go back.
                </Box>
              )}
              {listed
                ? 'The packages published to this stage, newest first: their manifest and signature are both there.'
                : packages === undefined
                ? 'Reading the published packages…'
                : 'This API does not list the published packages: type the version.'}
            </Typography>
          </ListItem>

          <ListItem sx={fieldSx}>
            <TextField
              required
              label="Manifest URL"
              variant="filled"
              value={shownManifest}
              onChange={e => setManifest(e.target.value)}
              inputProps={{ 'data-field': 'manifest', readOnly: !editManifest }}
              InputProps={{
                endAdornment: !editManifest && (
                  <InputAdornment position="end" sx={{ marginRight: 1.5 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        setManifest(shownManifest)
                        setEditManifest(true)
                      }}
                    >
                      Edit
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="caption">
              {editManifest
                ? 'Edited by hand: devices fetch it and check it against the stage’s release key.'
                : listed
                ? 'The manifest published with the version.'
                : "Guessed from the channel's current manifest."}
            </Typography>
          </ListItem>

          <ListItem sx={fieldSx}>
            <TextField
              label="Ladder"
              variant="filled"
              value={form.ladder}
              error={!valid.ladder}
              onChange={e => change({ ladder: e.target.value })}
              inputProps={{ 'data-field': 'ladder' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ marginRight: 1.5 }}>
                    %
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="caption">
              Rising percents of the channel's devices, a step each; the last is where it ends.
            </Typography>
          </ListItem>

          {numberField('soak', 'Soak', 'Held clean after each step but the first converges.', 'min')}
          {numberField('firstSoak', 'First soak', 'Held clean after the first step converges.', 'min')}
          {numberField('rateFloor', 'Rate floor', 'Deliveries a second at least, when presence is busy.', '/s')}
          {numberField('rateCeiling', 'Rate ceiling', 'Deliveries a second at most, and to start at.', '/s')}
          {numberField(
            'failureThreshold',
            'Failure threshold',
            <>
              Real failures, beyond those reviewed, that hold the run: more than this. <b>0 holds on the first.</b>
            </>
          )}
          {rollbackServed && (
            <ListItemCheckbox
              label="Rollback"
              subLabel="Take the channel back to an older release: devices on newer ones are told to go back to it."
              checked={rollback}
              onClick={checked => setRollback(checked)}
            />
          )}
          <ListItemCheckbox
            label="Promote when done"
            subLabel="At the end, the candidate becomes the channel's current release."
            checked={promote}
            onClick={checked => setPromote(checked)}
          />
        </List>
        <Gutters>
          <Button variant="contained" disabled={!ready} onClick={() => setConfirming(true)}>
            {saving ? 'Starting…' : 'Start rollout'}
          </Button>
          <Button sx={{ marginLeft: 1 }} onClick={() => history.push(UPGRADES_ROUTE)}>
            Cancel
          </Button>
        </Gutters>
      </form>
      <Confirm
        open={confirming}
        title={rollback ? 'Start this rollback?' : 'Start this rollout?'}
        action={rollback ? 'Roll back' : 'Start'}
        color={rollback ? 'warning' : 'primary'}
        onConfirm={submit}
        onDeny={() => setConfirming(false)}
      >
        {rollback && (
          <Typography variant="body2" sx={{ fontWeight: 500, marginBottom: 1 }} data-rollback-confirm>
            Rollback to {start.candidateVersion} from {newest || 'what the devices run'}.
          </Typography>
        )}
        <Typography variant="body2">
          {start.candidateVersion} becomes {channel}'s candidate, and the controller delivers it to{' '}
          {ladder ? `${ladder[0]}%` : 'the first step'} of the channel's devices at once.
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1, wordBreak: 'break-all' }}>
          {start.candidateManifest}
          <br />
          Ladder {ladder?.join(', ')}% · soak {start.soakMinutes} min (first {start.firstSoakMinutes}) · rate{' '}
          {start.rateFloor} to {start.rateCeiling}/s · failure threshold {start.failureThreshold}
          {promote ? ' · promotes when done' : ''}
        </Typography>
      </Confirm>
    </Container>
  )
}
