import React, { useEffect, useState, useCallback } from 'react'
import { TextField, MenuItem, IconButton, Tooltip, CircularProgress } from '@material-ui/core'
import { serviceTypes, findType } from '../../services/serviceTypes'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from '../Icon'
import styles from '../../styling'
import { serviceNameValidation } from '../../shared/nameHelper'

type Props = {
  init?: boolean
  data: ITarget
  disable: boolean
  busy?: boolean
  adding?: boolean
  deleting?: boolean
  onSave: (target: ITarget) => void
  onDelete: () => void
  onCancel?: () => void
}

export const Target: React.FC<Props> = ({
  init,
  data,
  disable,
  busy,
  adding,
  deleting,
  onSave,
  onDelete,
  onCancel,
}) => {
  const [state, setState] = useState<ITarget>(data)
  const [nameError, setNameError] = useState<string>()
  const css = useStyles()
  const type = findType(data.type)
  const disabled = disable || deleting
  const same = useCallback(
    () =>
      data.name === state.name &&
      data.type === state.type &&
      data.port === state.port &&
      data.hostname === state.hostname,
    [data, state]
  )
  const changed = (!deleting && !same()) || init

  function update(key: string, value: any) {
    setState({ ...state, [key]: value })
  }

  function cancel() {
    setState(data)
    if (onCancel) onCancel()
  }

  useEffect(() => {
    if (same()) {
      if (!data.port) data.port = type.defaultPort || 1
      setState(data)
    }
  }, [same, data, type])

  return (
    <tr className={css.service + (changed ? ' ' + css.serviceEdited : '')}>
      <td className={css.cell}>
        <TextField
          autoFocus={init}
          margin="dense"
          value={state.name}
          disabled={disabled}
          error={!!nameError}
          variant="filled"
          onChange={event => {
            const validation = serviceNameValidation(event.target.value)
            update('name', validation.value)
            validation.error ? setNameError( validation.error ) :  setNameError(undefined)
          }}
          helperText={nameError || ''}
        />
      </td>
      <td className={css.cell}>
        <TextField
          select
          margin="dense"
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
          margin="dense"
          value={state.port}
          disabled={disabled}
          variant="filled"
          onChange={event => update('port', +event.target.value)}
        />
      </td>
      <td className={css.cell}>
        <TextField
          margin="dense"
          value={state.hostname || ''}
          disabled={disabled}
          variant="filled"
          onChange={event => update('hostname', event.target.value)}
        />
      </td>
      <td>
        {changed && !adding && (
          <Tooltip title="Save">
            <IconButton color="primary" onClick={() => onSave(state)} type="submit" disabled={state.name.length < 1}>
              <Icon name="check" size="md" fixedWidth />
            </IconButton>
          </Tooltip>
        )}
      </td>
      <td>
        {deleting || adding ? (
          <CircularProgress className={css.loading} size={styles.fontSizes.lg} />
        ) : changed ? (
          <Tooltip title="Cancel">
            <IconButton onClick={cancel}>
              <Icon name="times" size="md" fixedWidth />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Delete">
            <IconButton disabled={busy} onClick={() => onDelete()}>
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
