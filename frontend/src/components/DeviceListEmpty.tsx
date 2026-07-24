import React from 'react'
import brand from '@common/brand/config'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const isFiltered = useSelector(selectIsFiltered)
  const deviceModel = useSelector(selectDeviceModelAttributes)
  const userAccount = useSelector(isUserAccount)
  const claiming = useSelector((state: State) => state.ui.claiming)
  const noResults = deviceModel.searched || isFiltered

  return (
    <Body center>
      {noResults ? (
        <Box>
          <Notice>
            {deviceModel.searched
              ? t('deviceList.searchNoResults', 'Your search returned no results')
              : t('deviceList.filterNoResults', 'Your filter returned no results')}
          </Notice>
        </Box>
      ) : userAccount ? (
        brand.name === 'remoteit' ? (
          <>
            <GuideStep
              step={1}
              showStart
              guide="aws"
              instructions={t('deviceList.demoInstructions1', 'Click the button below to have our device shared with you.')}
              autoStart
            >
              <GuideStep
                guide="aws"
                step={2}
                instructions={t('deviceList.demoInstructions2', 'Please wait while the device is being shared...')}
                hideArrow
              >
                <Button
                  onClick={() => devices.claimDevice({ code: DEMO_DEVICE_CLAIM_CODE })}
                  variant="contained"
                  color="primary"
                  size="medium"
                  sx={{ marginBottom: 2.25 }}
                  disabled={claiming}
                >
                  <Icon name={claiming ? 'spinner-third' : 'plus'} spin={claiming} type="solid" inlineLeft />{' '}
                  {t('deviceList.demoDevice', 'Demo Device')}
                </Button>
              </GuideStep>
            </GuideStep>
            <Typography variant="body2" align="center" color="textSecondary" sx={{ maxWidth: 500, padding: 3 }}>
              {t(
                'deviceList.demoHelp',
                'See how simple it is to connect with our AWS demo device, or add your own device from the plus menu in the top left of the screen.'
              )}
            </Typography>
          </>
        ) : (
          <Stack>
            <Typography variant="body1" align="center">
              {t('deviceList.cachengoWelcome', 'Welcome to Telepath by Cachengo')}
            </Typography>
            <Typography variant="body2" align="center" color="textSecondary" sx={{ paddingTop: 1, paddingBottom: 4 }}>
              {t('deviceList.cachengoStart', 'Get started by renting a Symbiote Node from our distributed cloud.')}{' '}
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
                <Icon name="cart-shopping" inlineLeft /> {t('deviceList.cachengoRent', 'Rent-A-Node')}
              </Button>
            </Stack>
          </Stack>
        )
      ) : (
        <Box>
          <Notice>{t('deviceList.noDevices', 'This account has no devices')}</Notice>
        </Box>
      )}
    </Body>
  )
}