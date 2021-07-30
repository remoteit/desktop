import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Button } from '@material-ui/core'
import { GuideStep } from '../GuideStep'
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
      ) : (
        <>
          <GuideStep
            step={1}
            guide="guideAWS"
            instructions="Click the button below to have our device shared with you."
            autoStart
          >
            <GuideStep
              guide="guideAWS"
              step={2}
              instructions="Please wait while the device is being shared..."
              hideArrow
            >
              <Button
                onClick={() => devices.claimDevice('GUESTVPC')}
                variant="contained"
                color="primary"
                size="medium"
                className={css.button}
                disabled={claiming}
              >
                <Icon name={claiming ? 'spinner-third' : 'plus'} spin={claiming} type="solid" inlineLeft /> GUEST VPC
              </Button>
            </GuideStep>
          </GuideStep>
          <Typography variant="body2" align="center" color="textSecondary">
            Try our AWS example system. <br />
            Our device will be shared to you and appear in your device list.
          </Typography>
        </>
      )}
    </Body>
  )
}

const useStyles = makeStyles({
  block: { marginBottom: spacing.xl },
  button: { marginBottom: spacing.md },
})
