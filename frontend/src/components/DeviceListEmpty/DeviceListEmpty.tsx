import React from 'react'
import { makeStyles } from '@mui/styles'
import { getDeviceModel } from '../../models/accounts'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { DEMO_DEVICE_CLAIM_CODE } from '../../shared/constants'
import { Typography, Button } from '@mui/material'
import { selectIsFiltered } from '../../models/devices'
import { isUserAccount } from '../../models/accounts'
import { GuideStep } from '../GuideStep'
import { spacing } from '../../styling'
import { Icon } from '../Icon'
import { Body } from '../Body'

export const DeviceListEmpty: React.FC = () => {
  const css = useStyles()
  const { devices } = useDispatch<Dispatch>()
  const { noResults, userAccount, claiming } = useSelector((state: ApplicationState) => ({
    noResults: (getDeviceModel(state).searched || selectIsFiltered(state)) && !getDeviceModel(state).results,
    userAccount: isUserAccount(state),
    claiming: state.ui.claiming,
  }))

  return (
    <Body center>
      {noResults ? (
        <Typography variant="body1" color="textSecondary" align="center">
          Your search returned no results
        </Typography>
      ) : userAccount ? (
        <>
          <GuideStep
            step={1}
            showStart
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
                onClick={() => devices.claimDevice({ code: DEMO_DEVICE_CLAIM_CODE })}
                variant="contained"
                color="primary"
                size="medium"
                className={css.button}
                disabled={claiming}
              >
                <Icon name={claiming ? 'spinner-third' : 'plus'} spin={claiming} type="solid" inlineLeft /> Demo Device
              </Button>
            </GuideStep>
          </GuideStep>
          <Typography variant="body2" align="center" color="textSecondary">
            See how simple it is to connect with our AWS demo device, <br />
            or add your own device from the plus menu in the top left of the page.
          </Typography>
        </>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          This account has no devices
        </Typography>
      )}
    </Body>
  )
}

const useStyles = makeStyles({
  block: { marginBottom: spacing.xl },
  button: { marginBottom: spacing.md },
})
