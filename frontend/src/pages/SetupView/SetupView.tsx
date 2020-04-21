import React from 'react'
import { Container } from '../../components/Container'
import { Typography, Tooltip, Divider } from '@material-ui/core'
import { usePermissions } from '../../hooks/usePermissions'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { findType } from '../../services/serviceTypes'
import { makeStyles } from '@material-ui/styles'
import { spacing, colors, fontSizes } from '../../styling'
import { Columns } from '../../components/Columns'
import { Icon } from '../../components/Icon'

export const SetupView: React.FC<{
  device: IDevice
  targets: ITarget[]
}> = ({ device, targets }) => {
  const { adminUsername, notElevated } = usePermissions()
  const css = useStyles()

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            This Device
            <Tooltip title={`Only ${adminUsername} can edit this device`}>
              <Icon name="lock-alt" weight="regular" inline />
            </Tooltip>
          </Typography>
        </>
      }
    >
      <Typography className={css.banner} variant="body2">
        <span>View Only</span>
        {notElevated && <>remote.it must be running as admin in order to remotely manage services</>}
      </Typography>

      <Columns count={1} inset>
        <p>
          <Typography variant="caption">Device Name</Typography>
          <Typography variant="h2">{device.name}</Typography>
        </p>
        <p>
          <Typography variant="caption">Registered To</Typography>
          <Typography variant="h2">{adminUsername}</Typography>
        </p>
      </Columns>
      <Divider />
      <Typography variant="subtitle1">Hosted Services</Typography>
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
    '& span': {
      display: 'block',
      fontSize: fontSizes.md,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontWeight: 400,
      margin: 0,
    },
  },
})
