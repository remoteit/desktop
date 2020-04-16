import React from 'react'
import { Target } from '../Target'
import { NewTarget } from '../NewTarget'
import { TARGET_SERVICES_LIMIT } from '../../constants'
import { InputLabel, Tooltip, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../Icon'
import styles from '../../styling'

type Props = {
  targets: ITarget[]
  device: IDevice
  added?: ITarget
  cliError?: string
  onUpdate: (targets: ITarget[]) => void
  onCancel: () => void
}

export const Targets: React.FC<Props> = ({ targets, device, added, cliError, onUpdate, onCancel }) => {
  const css = useStyles()
  const maxReached = targets.length + 1 > TARGET_SERVICES_LIMIT

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
                Host Address <em>Optional</em>
                <Tooltip
                  title={
                    <span>
                      Local network IP address or FQDN to host this service.
                      <br />
                      Leave blank for this system to host.
                    </span>
                  }
                >
                  <Icon name="question-circle" weight="light" size="sm" inline />
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
              cliError={cliError}
              onSave={(t: ITarget) => update(index, t)}
              onDelete={() => remove(index)}
            />
          ))}
          {maxReached ? (
            <tr>
              <td className={css.note} colSpan={4}>
                <Typography variant="body2" color="textSecondary">
                  Desktop currently supports a maximum of {TARGET_SERVICES_LIMIT} services.
                </Typography>
              </td>
            </tr>
          ) : (
            <NewTarget
              added={added}
              count={targets.length}
              device={device}
              cliError={cliError}
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
  note: { paddingTop: styles.spacing.xl },
})
