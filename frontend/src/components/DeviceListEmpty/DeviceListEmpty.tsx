import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Button } from '@material-ui/core'
import { osName } from '../../shared/nameHelper'
import { spacing } from '../../styling'
import { Icon } from '../Icon'
import { Body } from '../Body'

export const DeviceListEmpty: React.FC = () => {
  const css = useStyles()
  const { devices } = useDispatch<Dispatch>()
  const { noResults, targetDevice, claiming } = useSelector((state: ApplicationState) => ({
    noResults: state.devices.searched && !state.devices.results,
    targetDevice: state.backend.device,
    os: state.backend.environment.os,
    claiming: state.ui.claiming,
  }))

  return (
    <Body center>
      {noResults ? (
        <Typography variant="body1" color="textSecondary" align="center">
          Your search returned no results
        </Typography>
      ) : !targetDevice.uid ? (
        <>
          <Button
            onClick={() => devices.claimDevice('SHAREAWS')}
            variant="contained"
            color="primary"
            size="medium"
            className={css.button}
            disabled={claiming}
          >
            <Icon name={claiming ? 'spinner-third' : 'plus'} spin={claiming} type="solid" inlineLeft /> AWS DEVICE
          </Button>
          <Typography variant="body2" align="center" color="textSecondary">
            Try our AWS example VPC and services. <br />
            Our device will be shared to you and appear in your device list.
          </Typography>
        </>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          You have no devices.
        </Typography>
      )}
    </Body>
  )
}

const useStyles = makeStyles({
  block: { marginBottom: spacing.xl },
  button: { marginBottom: spacing.md },
})
