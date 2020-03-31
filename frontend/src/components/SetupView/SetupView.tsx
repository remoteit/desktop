import React from 'react'
import { Container } from '../Container'
import { Typography, Tooltip } from '@material-ui/core'
import { Breadcrumbs } from '../Breadcrumbs'
import { findType } from '../../services/serviceTypes'
import { makeStyles } from '@material-ui/styles'
import { spacing, colors, fontSizes } from '../../styling'
import { Columns } from '../Columns'
import { Icon } from '../Icon'

export const SetupView: React.FC<{
  adminUser?: string
  notElevated?: boolean
  device: IDevice
  targets: ITarget[]
}> = ({ adminUser, notElevated, device, targets }) => {
  const css = useStyles()

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            Hosted Device
            <Tooltip title={`Only ${adminUser} can edit this device`}>
              <Icon name="lock-alt" weight="regular" inline />
            </Tooltip>
          </Typography>
        </>
      }
    >
      <Typography className={css.banner} variant="body2">
        <h2>View Only</h2>
        {notElevated && <>remote.it must be running as admin in order to remotely manage services</>}
      </Typography>

      <Columns count={1} inset>
        <p>
          <Typography variant="caption">Device Name</Typography>
          <Typography variant="h2">{device.name}</Typography>
        </p>
        <p>
          <Typography variant="caption">Registered To</Typography>
          <Typography variant="h2">{adminUser}</Typography>
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
                <Typography variant="caption">Host Address</Typography>
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
  banner: {
    color: colors.white,
    padding: spacing.md,
    backgroundColor: colors.secondary,
    textAlign: 'center',
    '& h2': {
      fontSize: fontSizes.md,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontWeight: 400,
      margin: 0,
    },
  },
})
