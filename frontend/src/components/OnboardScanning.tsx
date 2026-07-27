import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, Stack, Box, Button, CircularProgress, Collapse } from '@mui/material'
import { OnboardMessage } from './OnboardMessage'
import { IconButton } from '../buttons/IconButton'
import { Notice } from './Notice'
import { Link } from './Link'

type Props = {
  next: () => void
}

export const OnboardScanning: React.FC<Props> = ({ next }) => {
  const { t } = useTranslation()
  const { connected, searching, wlan, message, severity } = useSelector((state: State) => state.bluetooth)
  const dispatch = useDispatch<Dispatch>()
  const [ready, setReady] = useState<boolean>(false)
  const [help, setHelp] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      await dispatch.bluetooth.stop()
      setReady(true)
    })()
  }, [])

  useEffect(() => {
    if (ready && connected) next()
  }, [connected, wlan, ready])

  const onScan = async () => {
    await dispatch.bluetooth.start()
  }

  const onCancel = async () => {
    await dispatch.bluetooth.cancel()
  }

  return (
    <>
      <Box marginX={2} marginTop={4}>
        <Stack flexDirection="row" alignItems="center" marginY={2}>
          <Typography variant="h2">{t('onboardScanning.title', 'Bluetooth Onboarding')}</Typography>
        </Stack>
        <Typography variant="caption" color="grayDarker.main">
          <b>{t('onboardScanning.noteLabel', 'Note:')}</b>{' '}
          {t(
            'onboardScanning.noteBody',
            'This setup is only for Raspberry Pis that are enabled with Remote.It. If you already have a Pi online'
          )}
          <Link to="/add/raspberrypi">{t('onboardScanning.addRemoteAccess', 'add remote access.')}</Link>
        </Typography>
        <OnboardMessage message={message} severity={severity} />
        <Stack flexDirection="row" alignItems="center" marginTop={5} marginBottom={3}>
          {searching ? (
            <>
              <CircularProgress size={22} thickness={5} sx={{ marginRight: 3 }} />
              <Button onClick={onCancel}>{t('onboardScanning.cancel', 'cancel')}</Button>
            </>
          ) : (
            <>
              <Button variant="contained" onClick={onScan}>
                {t('onboardScanning.scan', 'scan')}
              </Button>
              <IconButton
                name="circle-question"
                size="lg"
                color="grayDark"
                title={t('onboardScanning.help', 'Help')}
                onClick={() => setHelp(!help)}
                inline
              />
            </>
          )}
        </Stack>
        <Collapse in={help}>
          <Notice fullWidth>
            <strong>{t('onboardScanning.turnOnPi', 'Turn on your Pi with Remote.It Bluetooth Onboarding now.')}</strong>
            <em>
              {t(
                'onboardScanning.discoverableNote',
                'On first startup, the device could take up to 2 minutes to appear, and it will be discoverable for 10 minutes after.'
              )}
            </em>
          </Notice>
        </Collapse>
      </Box>
    </>
  )
}
