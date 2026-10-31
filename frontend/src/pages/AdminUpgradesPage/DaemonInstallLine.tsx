import React, { useEffect, useState } from 'react'
import { Box, Link, MenuItem, TextField, Typography } from '@mui/material'
import { Confirm } from '../../components/Confirm'
import { Notice } from '../../components/Notice'
import {
  DaemonInstall,
  DaemonPackage,
  graphQLDaemonPackages,
  rolloutActionsServed,
  setDaemonInstall,
} from '../../services/graphQLDaemonRollout'
import { compareVersions, dateTime } from './rolloutHelpers'

const FOLLOW = '__follow__'

const byLabel = (by: DaemonInstall['updatedBy']) => (typeof by === 'string' ? by : by?.email) || undefined

// The published versions new installs may take: none older than the channel's current release (the server refuses
// those too).
export const installChoices = (packages: DaemonPackage[], current?: string | null) =>
  packages.filter(pkg => !current || compareVersions(pkg.version, current) >= 0)

type Props = { install: DaemonInstall; current?: string | null; onChanged: () => void }

/* What new installs download, stage-wide: the stable channel's current release, or a newer published build set ahead
   of it. A change reaches every new install at once — there is no gradual rollout for installs. */
export const DaemonInstallLine: React.FC<Props> = ({ install, current, onChanged }) => {
  const [canChange, setCanChange] = useState(false)
  const [open, setOpen] = useState(false)
  const [packages, setPackages] = useState<DaemonPackage[] | 'ERROR' | false>()
  const [choice, setChoice] = useState(FOLLOW)
  const [confirming, setConfirming] = useState(false)
  const [problem, setProblem] = useState<string>()

  useEffect(() => {
    let live = true
    rolloutActionsServed().then(served => live && setCanChange(served.has('setDaemonInstall')))
    return () => {
      live = false
    }
  }, [])

  const openDialog = async () => {
    setProblem(undefined)
    setChoice(install.followsCurrent === false && install.version ? install.version : FOLLOW)
    setOpen(true)
    setPackages(await graphQLDaemonPackages())
  }

  const choices = Array.isArray(packages) ? installChoices(packages, current) : []
  const target = choice === FOLLOW ? current || 'the current release' : choice

  const save = async () => {
    setConfirming(false)
    const result = await setDaemonInstall(choice === FOLLOW ? null : choice)
    if (!result.ok) return setProblem(result.reason)
    setOpen(false)
    onChanged()
  }

  const by = byLabel(install.updatedBy)
  return (
    <Box data-install-line sx={{ marginBottom: 1 }}>
      <Typography variant="caption" component="div">
        New installs: <b>{install.version || '—'}</b>{' '}
        <span>({install.followsCurrent === false ? 'ahead of current' : 'follows current'})</span>
        {install.updatedAt && (
          <Box component="span" sx={{ color: 'grayDark.main' }}>
            {' '}
            · set {dateTime(install.updatedAt)}
            {by ? ` by ${by}` : ''}
          </Box>
        )}
        {canChange && (
          <>
            {' '}
            ·{' '}
            <Link component="button" variant="caption" onClick={openDialog} data-install-change>
              Change
            </Link>
          </>
        )}
      </Typography>

      <Confirm
        open={open && !confirming}
        title="What new installs download"
        action="Continue"
        disabled={choice !== FOLLOW && !choices.some(pkg => pkg.version === choice)}
        onConfirm={() => setConfirming(true)}
        onDeny={() => setOpen(false)}
      >
        {problem && (
          <Notice severity="error" fullWidth>
            {problem}
          </Notice>
        )}
        <TextField
          select
          fullWidth
          label="Version"
          variant="filled"
          value={choice}
          onChange={e => setChoice(e.target.value)}
          inputProps={{ 'data-field': 'install-version' }}
        >
          <MenuItem value={FOLLOW}>Follow current{current ? ` (${current})` : ''}</MenuItem>
          {choices.map(pkg => (
            <MenuItem key={pkg.version} value={pkg.version}>
              {pkg.version}
              <Typography variant="caption" color="textSecondary" sx={{ marginLeft: 1 }}>
                published {dateTime(pkg.publishedAt)}
              </Typography>
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="caption" color="textSecondary" component="div" sx={{ marginTop: 1 }}>
          {packages === undefined
            ? 'Reading the published packages…'
            : Array.isArray(packages)
            ? 'Published builds no older than current. Follow current tracks the stable channel’s release.'
            : 'This API does not list the published packages: only Follow current.'}
        </Typography>
      </Confirm>

      <Confirm
        open={confirming}
        title="Change what new installs download?"
        action="Change"
        color="warning"
        onConfirm={save}
        onDeny={() => setConfirming(false)}
      >
        <Typography variant="body2" data-install-confirm>
          New installs everywhere will get {target} immediately — there is no gradual rollout for installs.
        </Typography>
        {choice === FOLLOW && (
          <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
            From now on they follow the stable channel's current release as it changes.
          </Typography>
        )}
      </Confirm>
      {problem && !open && (
        <Typography variant="caption" color="error" component="div">
          {problem}
        </Typography>
      )}
    </Box>
  )
}
