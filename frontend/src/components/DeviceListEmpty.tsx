import React from 'react'
import brand from '@common/brand/config'
import { Link } from 'react-router-dom'
import { selectDeviceModelAttributes, selectIsFiltered } from '../selectors/devices'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { DEMO_DEVICE_CLAIM_CODE } from '../constants'
import { Typography, Stack, Button, Box } from '@mui/material'
import { isUserAccount } from '../selectors/accounts'
import { GuideStep } from './GuideStep'
import { Notice } from './Notice'
import { Icon } from './Icon'
import { Body } from './Body'

export const DeviceListEmpty: React.FC = () => {
  const { devices } = useDispatch<Dispatch>()
  const isFiltered = useSelector(selectIsFiltered)
  const deviceModel = useSelector(selectDeviceModelAttributes)
  const userAccount = useSelector(isUserAccount)
  const claiming = useSelector((state: State) => state.ui.claiming)
  const noResults = deviceModel.searched || isFiltered

  return (
    <Body center>
      {noResults ? (
        <Box>
          <Notice>Your {deviceModel.searched ? 'search' : 'filter'} returned no results</Notice>
        </Box>
      ) : userAccount ? (
        brand.name === 'remoteit' ? (
          <>
            <GuideStep
              step={1}
              showStart
              guide="aws"
              instructions="Click the button below to have our device shared with you."
              autoStart
            >
              <GuideStep guide="aws" step={2} instructions="Please wait while the device is being shared..." hideArrow>
                <Button
                  onClick={() => devices.claimDevice({ code: DEMO_DEVICE_CLAIM_CODE })}
                  variant="contained"
                  color="primary"
                  size="medium"
                  sx={{ marginBottom: 2.25 }}
                  disabled={claiming}
                >
                  <Icon name={claiming ? 'spinner-third' : 'plus'} spin={claiming} type="solid" inlineLeft /> Demo
                  Device
                </Button>
              </GuideStep>
            </GuideStep>
            <Typography variant="body2" align="center" color="textSecondary" sx={{ maxWidth: 500, padding: 3 }}>
              See how simple it is to connect with our AWS demo device, or add your own device from the plus menu in the
              top left of the screen.
            </Typography>
          </>
        ) : (
          <Stack>
            <Typography variant="body1" align="center">
              Welcome to Telepath by Cachengo
            </Typography>
            <Typography variant="body2" align="center" color="textSecondary" sx={{ paddingTop: 1, paddingBottom: 4 }}>
              Get started by renting a Symbiote Node from our distributed cloud.{' '}
            </Typography>
            <Stack direction="row" justifyContent="center" marginBottom={4}>
              <Icon name="cachengo" size="xxxl" platformIcon fixedWidth />
              <Button
                component={Link}
                to="/add/cachengo"
                variant="contained"
                color="primary"
                size="large"
                sx={{ marginLeft: 2, minWidth: 200, borderRadius: 2 }}
              >
                <Icon name="cart-shopping" inlineLeft /> Rent-A-Node
              </Button>
            </Stack>
          </Stack>
        )
      ) : (
        <Box>
          <Notice>This account has no devices</Notice>
        </Box>
      )}
    </Body>
  )
}