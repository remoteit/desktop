import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { platformText } from '../platforms/text'
import { Link as RouterLink, useHistory } from 'react-router-dom'
import { selectDevice, selectDeviceModelAttributes } from '../selectors/devices'
import { DEMO_DEVICE_CLAIM_CODE, DEMO_DEVICE_ID } from '../constants'
import { Box, Button, ButtonBase, Collapse, List, ListSubheader, Stack, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { AndroidSetup } from '../components/AndroidSetup'
import { DeviceSetupItem } from '../components/DeviceSetupItem'
import { ClaimDevice } from '../components/ClaimDevice'
import { RentANodeAdd } from '../components/RentANodeAdd'
import { Container } from '../components/Container'
import { platforms } from '../platforms'
import { DEVICE_PACKAGE_PLATFORMS } from '../platforms/devicePackage'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { useVirtualDevices } from '../hooks/useVirtualDevices'
import { virtualDeviceAddPath } from '../components/HostedDevices'
import { spacing } from '../styling'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { ConveyorBeltBoxes } from '../assets/ConveyorBeltBoxes'
import { AddDeviceAheadDialog } from '../components/AddDeviceAheadDialog'
import { useDeviceIdentity } from '../hooks/useDeviceIdentity'
import { selectCanRegister } from '../selectors/organizations'
import browser, { getOs } from '../services/browser'
import { installPath, recommendedChoices } from '../helpers/addChoices'

export const AddPage: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const allApplicationTypes = useSelector((state: State) => state.applicationTypes.all)
  const claiming = useSelector((state: State) => state.ui.claiming)
  const hasDemo = useSelector((state: State) => selectDevice(state, state.user.id, DEMO_DEVICE_ID) !== undefined)
  const deviceModel = useSelector(selectDeviceModelAttributes)
  const registered = useSelector((state: State) => !!state.backend.thisId)
  const history = useHistory()
  const devicePackage = useDeviceSessions()
  const virtualDevices = useVirtualDevices()
  // A device added ahead of its first boot: a Control Link device, where the API serves addDevice.
  const identity = useDeviceIdentity()
  const canRegister = useSelector(selectCanRegister)
  const addAhead = !!identity?.addDevice && devicePackage && canRegister
  const [addingAhead, setAddingAhead] = useState(false)
  const [more, setMore] = useState(false)
  const [showOlder, setShowOlder] = useState(false)
  const empty = deviceModel.initialized && !deviceModel.total

  useEffect(() => {
    if (!allApplicationTypes.length) dispatch.applicationTypes.fetchAll()
  }, [])

  const os = getOs()
  const choices = recommendedChoices({ os, app: browser.hasBackend, registered, devicePackage, empty }, t)
  const recommendedIds = choices.map(choice => (choice.id === 'this' ? os : choice.id))
  const otherPlatforms = devicePackage
    ? DEVICE_PACKAGE_PLATFORMS.filter(id => !recommendedIds.includes(id))
    : ['raspberrypi', 'mac', 'windows', 'android', 'nas', 'openwrt'].filter(id => !recommendedIds.includes(id))

  const demo = () => {
    if (hasDemo) history.push(`/devices/${DEMO_DEVICE_ID}`)
    else dispatch.devices.claimDevice({ code: DEMO_DEVICE_CLAIM_CODE, redirect: true })
  }

  // The classic agent's installs, every platform: behind "Older agent installs" where the stage has the agent.
  const legacyInstalls = (
    <Box
      sx={theme => ({
        '& .addList': {
          display: 'flex',
          flexWrap: 'wrap',
          paddingLeft: `${spacing.md}px`,
          marginTop: `${spacing.sm}px`,
          '& .MuiListSubheader-root': { width: '100%', borderBottom: `1px solid ${theme.palette.grayLighter.main}` },
          '& .MuiListItemButton-root': {
            display: 'block',
            width: 130,
            minWidth: 130,
            minHeight: 96,
            textAlign: 'center',
            paddingTop: `${spacing.md}px`,
            flexGrow: 'initial',
            [theme.breakpoints.down('sm')]: { width: 104, minWidth: 104 },
          },
          '& .MuiListItemIcon-root': { display: 'flex' },
        },
      })}
    >
      <List className="addList" dense disablePadding>
        <ListSubheader disableGutters>{t('addPage.olderInstances', 'Cloud and jump box')}</ListSubheader>
        {['docker-jumpbox', 'aws', 'azure', 'gcp', 'arm'].map(p => {
          const platform = platforms.get(p)
          return (
            <ListItemLocation
              key={p}
              iconPlatform
              iconSize="xxl"
              icon={platform.id}
              to={`/add/${platform.id}`}
              title={platformText(t, platform).name}
              subtitle={platform.subtitle}
              disableGutters
            />
          )
        })}
      </List>
      <List className="addList" dense disablePadding>
        <ListSubheader disableGutters>{t('addPage.olderDevices', 'Devices')}</ListSubheader>
        {[
          'raspberrypi',
          'linux',
          'docker',
          'android',
          'nas',
          'openwrt',
          'firewalla',
          'tinkerboard',
          'ubiquiti',
          'nvidia',
          'alpine',
          'axis',
          'advantech',
          'idy',
          'teltonika',
          'ubuntu',
          'windows',
          'mac',
        ].map(p => {
          const platform = platforms.get(p)
          return (
            <ListItemLocation
              key={p}
              iconPlatform
              iconSize="xxl"
              icon={platform.id}
              to={platform.route || `/add/${platform.id}`}
              title={<>{platform.listItemTitle || platformText(t, platform).name}</>}
              subtitle={platform.subtitle}
              disableGutters
            />
          )
        })}
      </List>
    </Box>
  )

  const row = (key: string, icon: React.ReactNode, title: string, line: string, onClick: () => void) => (
    <ButtonBase
      key={key}
      onClick={onClick}
      data-way={key}
      sx={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        gap: 2,
        paddingX: { xs: 2, sm: 3 },
        paddingY: 1.25,
        borderRadius: 1,
        textAlign: 'left',
        '&:hover, &.Mui-focusVisible': { bgcolor: 'primaryHighlight.main' },
      }}
    >
      <Box sx={{ width: 40, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" component="span" sx={{ display: 'block', fontWeight: 500 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary" component="span" sx={{ display: 'block' }}>
          {line}
        </Typography>
      </Box>
      <Icon name="angle-right" color="grayDark" />
    </ButtonBase>
  )

  return (
    <Container
      integrated
      bodyProps={{ verticalOverflow: true }}
      gutterBottom
      header={
        <Box sx={{ paddingRight: 4 }}>
          <Typography variant="h1">
            <Title>{t('addPage.addDeviceTitle', 'Add a device')}</Title>
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ paddingX: 4.5, marginTop: 0.5, maxWidth: 640, textWrap: 'pretty' }}
          >
            {t(
              'addPage.intro',
              'Install the Remote.It agent on the device you want to reach. It shows up in Devices once it is online.'
            )}
          </Typography>
        </Box>
      }
    >
      <Box sx={{ paddingX: 4.5, paddingTop: 3, maxWidth: 1080 }}>
        <Box
          component="nav"
          aria-label={t('addPage.recommended', 'Recommended')}
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(220px, 1fr))' },
          }}
        >
          {choices.map(choice => (
            <ButtonBase
              key={choice.id}
              data-choice={choice.id}
              {...(choice.to ? { component: RouterLink, to: choice.to } : { onClick: demo, disabled: claiming })}
              sx={theme => ({
                display: 'flex',
                flexDirection: { xs: 'row', sm: 'column' },
                alignItems: { xs: 'center', sm: 'flex-start' },
                justifyContent: 'flex-start',
                gap: 2,
                textAlign: 'left',
                padding: { xs: 2, sm: 3 },
                borderRadius: 2,
                border: `1px solid ${theme.palette.grayLighter.main}`,
                bgcolor: 'white.main',
                transition: 'border-color 120ms, background-color 120ms',
                '&:hover, &.Mui-focusVisible': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: 'primaryHighlight.main',
                },
              })}
            >
              <Box
                sx={{ width: 48, flexShrink: 0, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}
              >
                <Icon name={choice.icon} platformIcon size="xxl" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h3" component="span" sx={{ display: 'block', fontWeight: 500, marginBottom: 0.5 }}>
                  {choice.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" component="span" sx={{ display: 'block' }}>
                  {choice.id === 'demo' && hasDemo
                    ? t('addPage.demoShared', 'Already shared with you. Open it.')
                    : choice.line}
                </Typography>
              </Box>
            </ButtonBase>
          ))}
        </Box>

        <Box sx={{ marginTop: 4 }}>
          <Button
            variant="text"
            color="primary"
            onClick={() => setMore(!more)}
            aria-expanded={more}
            data-testid="more-ways"
            sx={{ marginLeft: -2.25 }}
            endIcon={<Icon name={more ? 'chevron-up' : 'chevron-down'} size="sm" />}
          >
            {t('addPage.moreWays', 'More ways to add a device')}
          </Button>
          <Collapse in={more}>
            <Stack spacing={1} sx={{ marginTop: 1, maxWidth: 760 }}>
              <RentANodeAdd />
              <AndroidSetup />
              <DeviceSetupItem />
              {otherPlatforms.length > 0 && (
                <Box sx={{ paddingX: { xs: 2, sm: 3 }, paddingY: 1 }}>
                  <Typography variant="subtitle2" component="h3" sx={{ marginBottom: 1 }}>
                    {t('addPage.otherPlatforms', 'Other computers and phones')}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {otherPlatforms.map(id => {
                      const platform = platforms.get(id)
                      return (
                        <Button
                          key={id}
                          component={RouterLink}
                          to={installPath(id, devicePackage)}
                          variant="outlined"
                          color="inherit"
                          startIcon={<Icon name={id} platformIcon size="lg" />}
                          sx={{
                            textTransform: 'none',
                            letterSpacing: 0,
                            fontWeight: 400,
                            color: 'grayDarkest.main',
                            borderColor: 'grayLighter.main',
                          }}
                        >
                          {platformText(t, platform).name}
                        </Button>
                      )
                    })}
                  </Stack>
                </Box>
              )}
              <Box>
                {virtualDevices &&
                  row(
                    'gateway',
                    <Icon name="plc" size="xl" platformIcon fixedWidth />,
                    t('addPage.gatewayTitle', 'A device with no agent'),
                    t('addPage.gatewayLine', 'Reach a NAS, printer or PLC through one of your devices, its gateway.'),
                    () => history.push(virtualDeviceAddPath())
                  )}
                {addAhead &&
                  row(
                    'ahead',
                    <Icon name="calendar-plus" size="xl" fixedWidth />,
                    t('addPage.aheadTitle', 'Add a device before it boots'),
                    t('addPage.aheadLine', 'Get its key now, for a device that starts fresh at every boot.'),
                    () => setAddingAhead(true)
                  )}
                {row(
                  'products',
                  <ConveyorBeltBoxes style={{ height: '1.75rem', width: 'auto' }} />,
                  t('addPage.manyTitle', 'Add many devices with a product'),
                  t('addPage.manyLine', 'Set up a product once, then add each device with its key.'),
                  () => history.push('/products')
                )}
                {!empty &&
                  row(
                    'demo',
                    <Icon name="remoteit" size="xl" platformIcon fixedWidth />,
                    t('addPage.tryDemo', 'Try a demo device'),
                    hasDemo
                      ? t('addPage.demoShared', 'Already shared with you. Open it.')
                      : t('addPage.demoLine', 'See how Remote.It works with a device we share with you.'),
                    demo
                  )}
                {row(
                  'wifi',
                  <Icon name="bluetooth" size="xl" color="calm" fixedWidth />,
                  t('addPage.wifiTitle', 'Set up Wi-Fi on a Raspberry Pi'),
                  t('addPage.wifiLine', 'Connect a new Pi to Wi-Fi and Remote.It over Bluetooth.'),
                  () => history.push('/onboard/raspberrypi')
                )}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { sm: 'center' },
                  gap: { xs: 1, sm: 2 },
                  paddingX: { xs: 2, sm: 3 },
                  paddingY: 1.25,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <Box sx={{ width: 40, flexShrink: 0, marginRight: 2, display: 'flex', justifyContent: 'center' }}>
                    <Icon name="qrcode" size="xl" fixedWidth />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {t('addPage.claimTitle', 'Claim a device with a code')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('addPage.claimLine', 'Enter the code that came with your device.')}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ paddingLeft: { xs: 7, sm: 0 } }}>
                  <ClaimDevice compact />
                </Box>
              </Box>
              <Box>
                {row(
                  'older',
                  <Icon name={showOlder ? 'chevron-up' : 'clock-rotate-left'} size="xl" fixedWidth />,
                  devicePackage
                    ? t('addPage.olderTitle', 'Older agent installs')
                    : t('addPage.allPlatformsTitle', 'Every platform'),
                  devicePackage
                    ? t('addPage.olderAgentLine', "The previous agent, for devices that can't run the current one.")
                    : t('addPage.allPlatformsLine', 'Installs for routers, cameras, cloud machines and more.'),
                  () => setShowOlder(!showOlder)
                )}
              </Box>
              <Collapse in={showOlder}>{legacyInstalls}</Collapse>
            </Stack>
          </Collapse>
        </Box>
      </Box>
      {addingAhead && <AddDeviceAheadDialog onClose={() => setAddingAhead(false)} />}
    </Container>
  )
}
