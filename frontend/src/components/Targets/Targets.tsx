import React from 'react'
import { Target } from '../Target'
import { NewTarget } from '../NewTarget'
import { InputLabel, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../Icon'
import styles from '../../styling'

type Props = {
  targets: ITarget[]
  device: IDevice
  added?: ITarget
  onUpdate: (targets: ITarget[]) => void
  onCancel: () => void
}

export const Targets: React.FC<Props> = ({ targets, device, added, onUpdate, onCancel }) => {
  const css = useStyles()
  const disabled = targets.length > 9

  function update(key: number, target: ITarget) {
    onUpdate([...targets, target])
  }

  function remove(key: number) {
    targets.splice(key, 1)
    onUpdate(targets)
  }

  return (
    <div className={css.targets}>
      <table>
        <tbody>
          <tr>
            <th>
              <InputLabel>Name</InputLabel>
            </th>
            <th>
              <InputLabel>Type</InputLabel>
            </th>
            <th>
              <InputLabel>Port</InputLabel>
            </th>
            <th colSpan={3}>
              <InputLabel>
                Host IP Address
                <Tooltip title="IP address to host this service. Leave blank for this system to host, or enter an address on the local network to jump host.">
                  <Icon name="question-circle" weight="regular" size="xs" inline />
                </Tooltip>
              </InputLabel>
            </th>
          </tr>
          {targets.map((target, index) => (
            <Target
              key={target.hostname + target.port}
              data={target}
              device={device}
              disable={true}
              onSave={(t: ITarget) => update(index, t)}
              onDelete={() => remove(index)}
            />
          ))}
          {!disabled && (
            <NewTarget
              added={added}
              count={targets.length}
              device={device}
              onSave={(t: ITarget) => update(targets.length, t)}
              onCancel={onCancel}
            />
          )}
        </tbody>
      </table>
    </div>
  )
}

const useStyles = makeStyles({
  targets: {
    '&, & table': { width: '100%' },
    '& table': { marginBottom: styles.spacing.lg },
    '& th:nth-child(3)': { width: 80 },
    '& td:nth-child(5),& td:nth-child(6)': { width: 50 },
    '& th': { textAlign: 'left' },
    '& .MuiInputLabel-root': { fontSize: 12 },
  },
})
