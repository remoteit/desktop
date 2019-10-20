import React, { useEffect, useState } from 'react'
import { TextField, FormControl, Select, MenuItem, IconButton, Tooltip, CircularProgress } from '@material-ui/core'
import { Icon } from '../Icon'
import { makeStyles } from '@material-ui/styles'
import { serviceTypes, emptyServiceType } from '../../types/serviceTypes'
import { addNameExt } from '../../helpers/serviceNameHelper'
import styles from '../../styling'

type Props = {
  init?: boolean
  data: ITarget
  device: IDevice
  disable: boolean
  onSave: (target: ITarget) => void
  onDelete: () => void
  onCancel?: () => void
}

const Target: React.FC<Props> = ({ init, data, disable, device, onSave, onDelete, onCancel }) => {
  const [state, setState] = useState<ITarget>(data)
  const [loading, setLoading] = useState<boolean>()
  const css = useStyles()
  const type = findType(data.type)
  const disabled = disable || loading
  const changed = (!loading && !same()) || init

  function findType(type: number) {
    return serviceTypes.find(st => st.id === type) || emptyServiceType
  }

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

  function same() {
    return (
      data.name === state.name &&
      data.type === state.type &&
      data.port === state.port &&
      data.hostname === state.hostname
    )
  }

  useEffect(() => {
    if (same()) {
      if (!data.port) data.port = type.defaultPort || 0
      setState(data)
    }
  }, [same, data, type])

  return (
    <tr className={css.service + (changed ? ' ' + css.serviceEdited : '')}>
      <td>
        <TextField
          autoFocus={init}
          value={state.name}
          disabled={disabled}
          onChange={event => update('name', event.target.value)}
          helperText={addNameExt(device.name, state.name)}
        />
      </td>
      <td>
        <FormControl>
          <Select
            value={state.type}
            disabled={disabled}
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
          </Select>
        </FormControl>
      </td>
      <td>
        <TextField value={state.port} disabled={disabled} onChange={event => update('port', +event.target.value)} />
      </td>
      <td>
        <TextField
          value={state.hostname || ''}
          disabled={disabled}
          onChange={event => update('hostname', event.target.value)}
        />
      </td>

      <td>
        {changed && !loading && (
          <Tooltip title="Save">
            <IconButton color="primary" onClick={save}>
              <Icon name="check" size="md" />
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
              <Icon name="times" size="md" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Delete">
            <IconButton
              onClick={() => {
                onDelete()
                setLoading(true)
              }}
            >
              <Icon name="trash-alt" size="md" />
            </IconButton>
          </Tooltip>
        )}
      </td>
    </tr>
  )
}

export default Target

const useStyles = makeStyles({
  button: { marginTop: styles.spacing.lg },
  loading: { color: styles.colors.gray, margin: styles.spacing.md },
  service: {
    '& .MuiFormControl-root': { width: '100%', paddingRight: 10, paddingTop: 10 },
    '& td': { verticalAlign: 'top', height: 80 },
  },
  serviceEdited: {
    '& .MuiInputBase-input': { color: styles.colors.primary },
  },
})
