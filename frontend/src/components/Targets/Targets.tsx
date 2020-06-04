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
import analytics from '../../helpers/Analytics'

type Props = {
  targets: ITarget[]
  device: ITargetDevice
  onUpdate: (targets: ITarget[]) => void
  onCancel: () => void
}

export const Targets: React.FC<Props> = ({ targets, device, onUpdate, onCancel }) => {
  const { setupBusy, setupDeletingService } = useSelector((state: ApplicationState) => state.ui)
  const { ui } = useDispatch<Dispatch>()
  const css = useStyles()
  const maxReached = targets.length + 1 > TARGET_SERVICES_LIMIT

  function add(target: ITarget) {
    analytics.track('serviceCreated', {
      serviceId: target.uid,
      serviceName: target.name,
      serviceType: target.type,
    })
    ui.set({ setupBusy: true, setupAddingService: true })
    onUpdate([...targets, target])
  }

  function remove(key: number) {
    const target = targets[key]
    analytics.track('serviceRemoved', {
      serviceId: target.uid,
      serviceName: target.name,
      serviceType: target.type,
    })
    let copy = [...targets]
    copy.splice(key, 1)
    ui.set({ setupBusy: true, setupDeletingService: key })
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
                  <Icon name="question-circle" weight="light" size="sm" inline />
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
              deleting={setupDeletingService === index}
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
            <NewTarget device={device} onSave={(t: ITarget) => add(t)} onCancel={onCancel} />
          )}
        </tbody>
      </table>
    </form>
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
