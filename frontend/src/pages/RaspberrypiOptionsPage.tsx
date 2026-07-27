import React from 'react'
import { Typography, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { MegaButton } from '../components/MegaButton'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

export const RaspberrypiOptionsPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Body center>
      <Typography variant="h2" align="center" color="greyDark.main" marginBottom={3}>
        {t('raspberrypiOptionsPage.heading', 'Set Up Your Raspberry Pi for Remote Access')}
      </Typography>
      <Stack
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent={{ xs: 'center', md: 'left' }}
        alignItems={{ xs: 'left', md: 'center' }}
        paddingX={{ xs: 3, md: 0 }}
        paddingBottom={4}
        flexWrap="wrap"
      >
        <MegaButton
          icon={<Icon name="raspberrypi" fontSize={70} platformIcon />}
          to="/add/raspberrypi"
          title={t('raspberrypiOptionsPage.addAccessTitle', 'Add Remote Access')}
          description={
            <>
              <b>{t('raspberrypiOptionsPage.addAccessQuestion', 'Already have a Raspberry Pi set up?')}</b> <br />
              {t('raspberrypiOptionsPage.addAccessDescription', 'Get remote access with a single line of code.')}
            </>
          }
        />
        <MegaButton
          icon={
            <Stack flexDirection="row" alignItems="center" height={70} gap={1}>
              <Icon name="raspberrypi" fontSize={50} platformIcon styles={{ marginRight: 2 }} />
              <Icon name="plus" fontSize={20} type="solid" styles={{}} />
              <Icon name="bluetooth" fontSize={50} type="brands" color="primary" />
            </Stack>
          }
          to="/onboard/raspberrypi"
          title={t('raspberrypiOptionsPage.onboardTitle', 'Onboard via Bluetooth')}
          description={
            <>
              <b>{t('raspberrypiOptionsPage.onboardQuestion', 'Have our custom Pi image?')}</b>{' '}
              {t('raspberrypiOptionsPage.onboardDescription', 'Set up WiFi via Bluetooth and register your device for remote access.')}
            </>
          }
        />
        <MegaButton
          icon={
            <Stack flexDirection="row" alignItems="center" height={70} gap={1.5}>
              <Icon name="raspberrypi" fontSize={50} platformIcon />
              <Icon name="plus" fontSize={20} type="solid" styles={{}} />
              <Icon name="sd-card" fontSize={50} type="solid" color="gray" />
            </Stack>
          }
          href="https://link.remote.it/getting-started/rpi-ble-image"
          title={t('raspberrypiOptionsPage.downloadTitle', 'Download Pi Image')}
          description={
            <>
              <b>{t('raspberrypiOptionsPage.downloadQuestion', 'New to Pi?')}</b>{' '}
              {t(
                'raspberrypiOptionsPage.downloadDescription',
                'Download our disk image for easy, headless setup with Bluetooth WiFi onboarding.'
              )}
            </>
          }
        />
      </Stack>
    </Body>
  )
}
