import React from 'react'
import { Target } from '../Target'
import { NewTarget } from '../NewTarget'
import { TARGET_SERVICES_LIMIT } from '../../shared/constants'
import { InputLabel, Tooltip, Typography } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from '../Icon'
import styles from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
  onUpdate: (targets: ITarget[]) => void
  onCancel: () => void
}

export const Targets: React.FC<Props> = ({ targets, targetDevice, onUpdate, onCancel }) => {
  const { setupBusy, setupServiceBusy, setupServicesLimit } = useSelector((state: ApplicationState) => state.ui)
  const { ui } = useDispatch<Dispatch>()
  const css = useStyles()
  const maxReached = targets.length + 1 > setupServicesLimit

  function add(target: ITarget) {
    analyticsHelper.track('serviceCreated', { ...target, id: target.uid })
    ui.set({ setupBusy: true, setupAddingService: true })
    onUpdate([...targets, target])
  }

  function remove(key: number) {
    const target = targets[key]
    analyticsHelper.track('serviceRemoved', { ...target, id: target.uid })
    let copy = [...targets]
    copy.splice(key, 1)
    ui.set({ setupBusy: true, setupServiceBusy: target.uid })
    onUpdate(copy)
  }

  return (
    <form className={css.targets}>
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
                  <Icon name="question-circle" type="light" size="sm" inline />
                </Tooltip>
              </InputLabel>
            </th>
          </tr>
          {targets.map((target, index) => (
            <Target
              key={target.uid}
              data={target}
              disable={true}
              busy={setupBusy}
              deleting={setupServiceBusy === target.uid}
              onSave={(t: ITarget) => add(t)}
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
            <NewTarget targetDevice={targetDevice} onSave={(t: ITarget) => add(t)} onCancel={onCancel} />
          )}
        </tbody>
      </table>
    </form>
  )
}

const useStyles = makeStyles({
  targets: {
    '&, & table': { width: '100%' },
    '& th:nth-child(3)': { width: 80 },
    '& td:nth-child(5),& td:nth-child(6)': { width: 50 },
    '& th': { textAlign: 'left' },
    '& .MuiInputLabel-root': { fontSize: 12 },
  },
  note: { paddingTop: styles.spacing.xl },
})
