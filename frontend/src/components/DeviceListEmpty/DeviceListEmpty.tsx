import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Typography, Button } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { osName } from '../../shared/nameHelper'
import { spacing } from '../../styling'
import { Body } from '../Body'

export const DeviceListEmpty: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const { noResults, targetDevice, os } = useSelector((state: ApplicationState) => ({
    noResults: state.devices.searched && !state.devices.results,
    targetDevice: state.backend.device,
    os: state.backend.environment.os,
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
            onClick={() => history.push('/devices/setupDevice')}
            variant="contained"
            color="primary"
            size="medium"
            className={css.button}
          >
            Set up
          </Button>
          <Typography variant="body2" align="center" color="textSecondary">
            Set up remote access to this {osName(os)} or any server on the network.
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
