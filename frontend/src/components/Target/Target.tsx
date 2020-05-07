import React, { useEffect, useState, useCallback } from 'react'
import { TextField, MenuItem, IconButton, Tooltip, CircularProgress } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { REGEX_NAME_SAFE } from '../../constants'
import { serviceTypes, findType } from '../../services/serviceTypes'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../Icon'
import styles from '../../styling'

type Props = {
  init?: boolean
  data: ITarget
  device: IDevice
  disable: boolean
  cliError?: string
  onSave: (target: ITarget) => void
  onDelete: () => void
  onCancel?: () => void
}

export const Target: React.FC<Props> = ({ init, data, disable, device, cliError, onSave, onDelete, onCancel }) => {
  const { setupDeletingService } = useSelector((state: ApplicationState) => state.ui)
  const [state, setState] = useState<ITarget>(data)
  const [loading, setLoading] = useState<boolean>()
  const css = useStyles()
  const type = findType(data.type)
  const disabled = disable || loading
  const same = useCallback(
    () =>
      data.name === state.name &&
      data.type === state.type &&
      data.port === state.port &&
      data.hostname === state.hostname,
    [data, state]
  )
  const changed = (!loading && !same()) || init

  function update(key: string, value: any) {
    setState({ ...state, [key]: value })
  }

  function save() {
    onSave(state)
    setLoading(true)
  }

  function cancel() {
    setState(data)
    if (onCancel) onCancel()
  }

  useEffect(() => {
    if (same()) {
      if (!data.port) data.port = type.defaultPort || 0
      setState(data)
    }
  }, [same, data, type])

  useEffect(() => {
    if (cliError) setLoading(false)
  }, [cliError])

  return (
    <tr className={css.service + (changed ? ' ' + css.serviceEdited : '')}>
      <td className={css.cell}>
        <TextField
          autoFocus={init}
          value={state.name}
          disabled={disabled}
          variant="filled"
          onChange={event => {
            const value = event.target.value.replace(REGEX_NAME_SAFE, '')
            update('name', value)
          }}
          // helperText={addDeviceName(device.name, state.name)}
        />
      </td>
      <td className={css.cell}>
        <TextField
          select
          value={state.type}
          disabled={disabled}
          variant="filled"
          onChange={event => {
            const type: number = Number(event.target.value)
            setState({ ...state, type, port: findType(type).defaultPort || state.port })
          }}
        >
          {serviceTypes.map(type => (
            <MenuItem value={type.id} key={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </TextField>
      </td>
      <td className={css.cell}>
        <TextField
          value={state.port}
          disabled={disabled}
          variant="filled"
          onChange={event => update('port', +event.target.value)}
        />
      </td>
      <td className={css.cell}>
        <TextField
          value={state.hostname || ''}
          disabled={disabled}
          variant="filled"
          onChange={event => update('hostname', event.target.value)}
        />
      </td>
      <td>
        {changed && !loading && (
          <Tooltip title="Save">
            <IconButton color="primary" onClick={save} disabled={state.name.length < 1}>
              <Icon name="check" size="md" fixedWidth />
            </IconButton>
          </Tooltip>
        )}
      </td>
      <td>
        {loading ? (
          <CircularProgress className={css.loading} size={styles.fontSizes.lg} />
        ) : changed ? (
          <Tooltip title="Cancel">
            <IconButton onClick={cancel}>
              <Icon name="times" size="md" fixedWidth />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Delete">
            <IconButton
              disabled={setupDeletingService}
              onClick={() => {
                onDelete()
                setLoading(true)
              }}
            >
              <Icon name="trash-alt" size="md" fixedWidth />
            </IconButton>
          </Tooltip>
        )}
      </td>
    </tr>
  )
}

const useStyles = makeStyles({
  button: { marginTop: styles.spacing.lg },
  loading: { color: styles.colors.gray, margin: styles.spacing.md },
  cell: { verticalAlign: 'top', height: 40 },
  service: {
    '& .MuiFormControl-root': { width: '100%', paddingRight: 10, paddingTop: 10 },
  },
  serviceEdited: {
    '& .MuiInputBase-input': { color: styles.colors.primary },
  },
})
