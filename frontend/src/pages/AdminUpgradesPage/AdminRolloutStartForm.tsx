import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { Confirm } from '../../components/Confirm'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { Notice } from '../../components/Notice'
import { Title } from '../../components/Title'
import { IconButton } from '../../buttons/IconButton'
import { spacing } from '../../styling'
import { DAEMON_CHANNELS } from '../../services/graphQLDaemon'
import { DaemonChannel, StartRollout, startDaemonRollout } from '../../services/graphQLDaemonRollout'
import { UPGRADES_ROUTE, parseLadder } from './rolloutHelpers'

type Props = { channels: DaemonChannel[]; showBackArrow?: boolean; onStarted: () => void }

// The manifest a version's release is published at, guessed from the channel's current one: the same URL with the
// version swapped (https://downloads.<stage>.remote.it/device/<version>/manifest.json).
export const manifestFor = (version: string, channel?: DaemonChannel) => {
  const current = channel?.current
  if (!version || !current?.manifest || !current.manifest.includes(current.version)) return ''
  return current.manifest.split(current.version).join(version)
}

const optionalNumber = (text: string) => (text.trim() === '' ? undefined : Number(text))
const validOptional = (text: string, min: number) => {
  const value = optionalNumber(text)
  return value === undefined || (Number.isFinite(value) && value >= min)
}

export const AdminRolloutStartForm: React.FC<Props> = ({ channels, showBackArrow, onStarted }) => {
  const history = useHistory()
  const names = channels.length ? channels.map(c => c.channel) : DAEMON_CHANNELS
  const [channel, setChannel] = useState(names[0])
  const [version, setVersion] = useState('')
  const [manifest, setManifest] = useState('')
  const [manifestTouched, setManifestTouched] = useState(false)
  const [ladder, setLadder] = useState('')
  const [soak, setSoak] = useState('')
  const [firstSoak, setFirstSoak] = useState('')
  const [rateCeiling, setRateCeiling] = useState('')
  // The controller holds a run on any failure it counts: 0 unless the operator chooses to tolerate some.
  const [failureThreshold, setFailureThreshold] = useState('0')
  const [promote, setPromote] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState<string>()

  const selected = channels.find(c => c.channel === channel)
  const shownManifest = manifestTouched ? manifest : manifestFor(version.trim(), selected)
  const parsedLadder = ladder.trim() ? parseLadder(ladder) : undefined
  const ladderValid = !ladder.trim() || !!parsedLadder
  const valid =
    !!version.trim() &&
    /^https:\/\//.test(shownManifest.trim()) &&
    ladderValid &&
    validOptional(soak, 0) &&
    validOptional(firstSoak, 0) &&
    validOptional(rateCeiling, 0.001) &&
    validOptional(failureThreshold, 0)

  const start: StartRollout = {
    channel,
    candidateVersion: version.trim(),
    candidateManifest: shownManifest.trim(),
    ladder: parsedLadder,
    soakMinutes: optionalNumber(soak),
    firstSoakMinutes: optionalNumber(firstSoak),
    rateCeiling: optionalNumber(rateCeiling),
    failureThreshold: optionalNumber(failureThreshold),
    promoteWhenDone: promote,
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

  return (
    <Container gutterBottom bodyProps={{ verticalOverflow: true }} header={header}>
      <Gutters>
        {problem && (
          <Notice severity="error" fullWidth onClose={() => setProblem(undefined)}>
            {problem}
          </Notice>
        )}
        <Stack spacing={2} component="form" data-start-form onSubmit={e => e.preventDefault()}>
          <TextField select label="Channel" value={channel} onChange={e => setChannel(e.target.value)} size="small">
            {names.map(name => (
              <MenuItem key={name} value={name}>
                {name}
                {channels.find(c => c.channel === name)?.current?.version &&
                  ` — now ${channels.find(c => c.channel === name)?.current?.version}`}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Candidate version"
            value={version}
            onChange={e => setVersion(e.target.value)}
            placeholder="1.1.0.20261030215119"
            size="small"
            required
          />
          <TextField
            label="Manifest URL"
            value={shownManifest}
            onChange={e => {
              setManifestTouched(true)
              setManifest(e.target.value)
            }}
            helperText={manifestTouched ? undefined : "Guessed from the channel's current manifest — edit to change"}
            size="small"
            required
          />
          <TextField
            label="Ladder (percent)"
            value={ladder}
            onChange={e => setLadder(e.target.value)}
            placeholder="1, 5, 25, 50, 100"
            helperText={ladderValid ? "Blank for the controller's default" : 'Rising percentages, 1 to 100'}
            error={!ladderValid}
            size="small"
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Soak (minutes)"
              value={soak}
              onChange={e => setSoak(e.target.value)}
              type="number"
              size="small"
              error={!validOptional(soak, 0)}
              helperText="Blank for default"
              fullWidth
            />
            <TextField
              label="First soak (minutes)"
              value={firstSoak}
              onChange={e => setFirstSoak(e.target.value)}
              type="number"
              size="small"
              error={!validOptional(firstSoak, 0)}
              helperText="Blank for default"
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Rate ceiling (devices/s)"
              value={rateCeiling}
              onChange={e => setRateCeiling(e.target.value)}
              type="number"
              size="small"
              error={!validOptional(rateCeiling, 0.001)}
              helperText="Blank for default"
              fullWidth
            />
            <TextField
              label="Failure threshold"
              value={failureThreshold}
              onChange={e => setFailureThreshold(e.target.value)}
              type="number"
              size="small"
              error={!validOptional(failureThreshold, 0)}
              helperText="0 holds on any failure"
              fullWidth
              inputProps={{ 'data-failure-threshold': true }}
            />
          </Stack>
          <FormControlLabel
            control={<Checkbox checked={promote} onChange={e => setPromote(e.target.checked)} />}
            label="Promote to current when done"
          />
          <Box>
            <Button variant="contained" disabled={!valid || saving} onClick={() => setConfirming(true)}>
              {saving ? 'Starting…' : 'Start rollout'}
            </Button>
            <Button sx={{ marginLeft: 1 }} onClick={() => history.push(UPGRADES_ROUTE)}>
              Cancel
            </Button>
          </Box>
        </Stack>
      </Gutters>
      <Confirm
        open={confirming}
        title="Start this rollout?"
        action="Start"
        onConfirm={submit}
        onDeny={() => setConfirming(false)}
      >
        <Typography variant="body2">
          {start.candidateVersion} becomes {channel}'s candidate, and the controller delivers it to{' '}
          {parsedLadder ? `${parsedLadder[0]}%` : 'the first step'} of the channel's devices at once.
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1, wordBreak: 'break-all' }}>
          {start.candidateManifest}
          <br />
          Failure threshold {start.failureThreshold ?? 'default'}
          {promote ? ' · promotes when done' : ''}
        </Typography>
      </Confirm>
    </Container>
  )
}
