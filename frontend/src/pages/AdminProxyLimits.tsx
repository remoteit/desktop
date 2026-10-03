import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { graphQLProxyLimits, graphQLSetProxyLimit } from '../services/graphQLProxyLimits'
import { LIMIT_LABELS, ProxyLimits, cellLabel, findRow } from '../helpers/proxyLimitHelper'
import { LoadingMessage } from '../components/LoadingMessage'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'

/* Each plan's limits on remote.it's proxies and exits (presence-server docs/proxy-plan.md §5, §8): a plan without a
   row of its own takes the default's; a row with no value is no limit. A change takes effect at once. */

type Editing = { plan: string | null; name: string }

export const AdminProxyLimits: React.FC = () => {
  const [limits, setLimits] = useState<ProxyLimits | null | 'ERROR' | typeof UNSUPPORTED>()
  const [editing, setEditing] = useState<Editing>()

  const load = useCallback(async () => setLimits(await graphQLProxyLimits()), [])

  useEffect(() => {
    load()
  }, [load])

  if (limits === undefined) return <LoadingMessage />
  if (limits === UNSUPPORTED) return null // the page above says the API has no device sessions
  if (limits === 'ERROR' || limits === null)
    return (
      <Notice severity="error" fullWidth>
        Could not read the plans' limits.
      </Notice>
    )

  const plans: (string | null)[] = [null, ...limits.plans]

  return (
    <>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Plan</TableCell>
              {limits.names.map(name => (
                <TableCell key={name}>
                  {LIMIT_LABELS[name]?.label ?? name}
                  {LIMIT_LABELS[name]?.unit && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      {LIMIT_LABELS[name].unit}
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map(plan => (
              <TableRow key={plan ?? 'default'}>
                <TableCell>
                  {plan ?? 'Default'}
                  {plan === null && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      no plan; the rate over a month's transfer
                    </Typography>
                  )}
                </TableCell>
                {limits.names.map(name => {
                  const cell = cellLabel(limits, plan, name)
                  return (
                    <TableCell
                      key={name}
                      onClick={() => setEditing({ plan, name })}
                      sx={{
                        cursor: 'pointer',
                        color: cell.inherited ? 'grayDark.main' : undefined,
                        '&:hover': { backgroundColor: 'primaryHighlight.main' },
                      }}
                    >
                      {cell.text}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Gutters>
        <Typography variant="caption" color="textSecondary">
          Click a limit to change it. Grey: the plan has no row of its own and takes the default's.
        </Typography>
      </Gutters>
      {editing && (
        <LimitDialog
          limits={limits}
          editing={editing}
          onClose={() => setEditing(undefined)}
          onSaved={async () => {
            setEditing(undefined)
            await load()
          }}
        />
      )}
    </>
  )
}

type Choice = 'inherit' | 'none' | 'value'

const LimitDialog: React.FC<{ limits: ProxyLimits; editing: Editing; onClose: () => void; onSaved: () => void }> = ({
  limits,
  editing,
  onClose,
  onSaved,
}) => {
  const { plan, name } = editing
  const meta = LIMIT_LABELS[name] ?? { label: name }
  const own = findRow(limits, plan, name)
  const [choice, setChoice] = useState<Choice>(!own ? 'inherit' : own.value === null ? 'none' : 'value')
  const [value, setValue] = useState(own?.value != null ? String(own.value) : '')
  const [scale, setScale] = useState(own?.scale != null ? String(own.scale) : '')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()

  const whole = (text: string, max: number) => /^\d+$/.test(text) && Number(text) <= max
  const valid =
    choice !== 'value' ||
    (whole(value, meta.toggle ? 1 : 1000000) && (plan === null || scale === '' || whole(scale, 1000000)))

  const save = async () => {
    setBusy(true)
    setProblem(undefined)
    const result = await graphQLSetProxyLimit(
      choice === 'inherit'
        ? { plan, name, inherit: true }
        : choice === 'none'
        ? { plan, name, value: null, scale: null }
        : { plan, name, value: Number(value), scale: plan === null || scale === '' ? null : Number(scale) }
    )
    setBusy(false)
    if (result === 'ERROR') return setProblem('Not changed: the API refused it.')
    onSaved()
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {meta.label} — {plan ?? 'Default'}
      </DialogTitle>
      <DialogContent>
        {problem && (
          <Notice severity="error" fullWidth>
            {problem}
          </Notice>
        )}
        <RadioGroup value={choice} onChange={event => setChoice(event.target.value as Choice)}>
          {plan !== null && <FormControlLabel value="inherit" control={<Radio />} label="The default's" />}
          <FormControlLabel value="none" control={<Radio />} label="No limit" />
          <FormControlLabel value="value" control={<Radio />} label={meta.toggle ? 'On or off' : 'A limit'} />
        </RadioGroup>
        {choice === 'value' && (
          <Box display="flex" gap={1} marginTop={1}>
            {meta.toggle ? (
              <RadioGroup row value={value} onChange={event => setValue(event.target.value)}>
                <FormControlLabel value="1" control={<Radio />} label="On" />
                <FormControlLabel value="0" control={<Radio />} label="Off" />
              </RadioGroup>
            ) : (
              <>
                <TextField
                  size="small"
                  label={meta.unit ?? 'Value'}
                  value={value}
                  onChange={event => setValue(event.target.value.replace(/[^0-9]/g, ''))}
                />
                {plan !== null && (
                  <TextField
                    size="small"
                    label="Added per license"
                    placeholder="none"
                    value={scale}
                    onChange={event => setScale(event.target.value.replace(/[^0-9]/g, ''))}
                  />
                )}
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || !valid} onClick={save}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
