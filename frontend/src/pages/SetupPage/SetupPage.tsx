import React from 'react'
import { Container } from '../../components/Container'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Tooltip } from '@material-ui/core'
import { spacing } from '../../styling'
import { findType } from '../../services/serviceTypes'
import { makeStyles } from '@material-ui/styles'
import { Columns } from '../../components/Columns'
import { Icon } from '../../components/Icon'
import Controller from '../../services/Controller'
import Device from '../../components/jump/Device'

export const SetupPage: React.FC = () => {
  const css = useStyles()
  const { backend } = useDispatch<Dispatch>()
  const setAdded = (value: any) => backend.set({ key: 'added', value })
  const { device, targets, added, admin, user } = useSelector((state: ApplicationState) => ({
    device: state.backend.device,
    targets: state.backend.targets,
    added: state.backend.added,
    admin: state.backend.admin,
    user: state.auth.user,
  }))

  const updateTargets = (t: ITarget[]) => Controller.emit('targets', t)
  const updateDevice = (d: IDevice) => Controller.emit('device', d)
  const deleteDevice = () => {
    Controller.emit('device', 'DELETE')
    Controller.emit('init')
  }

  return user && user.username === admin ? (
    <Device
      device={device}
      targets={targets}
      added={added}
      onDevice={updateDevice}
      onUpdate={updateTargets}
      onDelete={deleteDevice}
      onCancel={() => setAdded(undefined)}
    />
  ) : (
    <Container
      header={
        <Typography variant="h1">
          Hosted Device
          <Tooltip title={`Only ${admin} can edit this device`}>
            <Icon name="lock-alt" weight="regular" inline />
          </Tooltip>
        </Typography>
      }
    >
      <Columns count={1} inset>
        <p>
          <Typography variant="caption">Device Name</Typography>
          <Typography variant="h2">{device.name}</Typography>
        </p>
        <p>
          <Typography variant="caption">Registered by</Typography>
          <Typography variant="h2">{admin}</Typography>
        </p>
      </Columns>

      <Typography variant="h1">Hosted Services</Typography>
      <Columns count={1} inset>
        <table className={css.table}>
          <tbody>
            <tr>
              <th>
                <Typography variant="caption">Name</Typography>
              </th>
              <th>
                <Typography variant="caption">Type</Typography>
              </th>
              <th>
                <Typography variant="caption">Port</Typography>
              </th>
              <th>
                <Typography variant="caption">Jump IP Address</Typography>
              </th>
            </tr>
            {targets.map(target => (
              <tr>
                <td>
                  <Typography variant="h2">{target.name}</Typography>
                </td>
                <td>
                  <Typography variant="h2">{findType(target.type).name}</Typography>
                </td>
                <td>
                  <Typography variant="h2">{target.port}</Typography>
                </td>
                <td>
                  <Typography variant="h2">{target.hostname}</Typography>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Columns>
    </Container>
  )
}

const useStyles = makeStyles({
  table: {
    '& th, td': { textAlign: 'left', padding: 0 },
    '& td': { minWidth: 50, paddingRight: spacing.lg },
    '& tr + tr': { height: 22, verticalAlign: 'bottom' },
  },
})
