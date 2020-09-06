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

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
}

export const Targets: React.FC<Props> = ({ targets, targetDevice }) => {
  const { setupBusy, setupServiceBusy, setupServicesLimit } = useSelector((state: ApplicationState) => state.ui)
  const { backend } = useDispatch<Dispatch>()
  const css = useStyles()
  const maxReached = targets.length + 1 > setupServicesLimit

  return (
    <form className={css.targets}>
      <table>
        <tbody>
          <tr>
            <th>
              <InputLabel shrink>Name</InputLabel>
            </th>
            <th>
              <InputLabel shrink>Type</InputLabel>
            </th>
            <th>
              <InputLabel shrink>Port</InputLabel>
            </th>
            <th colSpan={3}>
              <InputLabel shrink>
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
              onSave={(t: ITarget) => backend.addTargetService(t)}
              onDelete={() => backend.removeTargetService(index)}
            />
          ))}
          {maxReached ? (
            <tr>
              <td className={css.note} colSpan={4}>
                <Typography variant="body2" color="textSecondary">
                  Desktop currently supports a maximum of {setupServicesLimit} services.
                </Typography>
              </td>
            </tr>
          ) : (
            <NewTarget targetDevice={targetDevice} onSave={(t: ITarget) => backend.addTargetService(t)} />
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
  },
  note: { paddingTop: styles.spacing.xl },
})
