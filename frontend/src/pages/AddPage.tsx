import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { selectDevice } from '../selectors/devices'
import { DEMO_DEVICE_CLAIM_CODE, DEMO_DEVICE_ID } from '../constants'
import { Stack, List, ListItemButton, ListSubheader, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { DeviceSetupItem } from '../components/DeviceSetupItem'
import { BluetoothScan } from '../components/BluetoothScan'
import { AndroidSetup } from '../components/AndroidSetup'
import { ClaimDevice } from '../components/ClaimDevice'
import { RentANodeAdd } from '../components/RentANodeAdd'
import { Container } from '../components/Container'
import { platforms } from '../platforms'
import { spacing } from '../styling'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { ConveyorBeltBoxes } from '../assets/ConveyorBeltBoxes'

export const AddPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const allApplicationTypes = useSelector((state: State) => state.applicationTypes.all)
  const claiming = useSelector((state: State) => state.ui.claiming)
  const hasDemo = useSelector((state: State) => selectDevice(state, state.user.id, DEMO_DEVICE_ID) !== undefined)
  const history = useHistory()

  useEffect(() => {
    if (!allApplicationTypes.length) dispatch.applicationTypes.fetchAll()
  }, [])

  return (
    <Container
      integrated
      bodyProps={{ verticalOverflow: true }}
      gutterBottom
      header={
        <Typography variant="h1" sx={{ marginRight: 4 }}>
          <Title>What do you want to connect&nbsp;to?</Title>
        </Typography>
      }
    >
      <Stack
        flexWrap="wrap"
        alignItems="flex-start"
        flexDirection="row"
        width="100%"
        paddingX={{ xs: 1, sm: 4 }}
        sx={theme => ({
          '& .addList': {
            minWidth: 175,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            marginTop: `${spacing.md}px`,
            paddingRight: `${spacing.xs}px`,
            paddingLeft: `${spacing.md}px`,
            '& .MuiListItemButton-root': {
              display: 'block',
              paddingLeft: `${spacing.md}px`,
              paddingTop: `${spacing.lg}px`,
              paddingRight: `${spacing.md}px`,
              flexGrow: 'initial',
            },
            '& .MuiListItemText-root': { marginTop: `${spacing.sm}px`, marginBottom: `${spacing.sm}px` },
            '& .MuiListItemSecondaryAction-root': { right: `${spacing.xs}px`, top: 45 },
            '& .MuiListSubheader-root': {
              width: '100%',
              borderBottom: `1px solid ${theme.palette.grayLight.main}`,
              marginBottom: `${spacing.xs}px`,
            },
          },
          '& .addSmall': {
            width: '50%',
            [theme.breakpoints.up('sm')]: { width: 200 },
          },
          '& .addIcons': {
            '& .MuiListItemButton-root, & .MuiListItem-root': { width: 140, minWidth: 140, minHeight: 100, margin: '1px' },
            [theme.breakpoints.down('sm')]: {
              '& .MuiListItemButton-root, & .MuiListItem-root': { width: 110, minWidth: 110 },
            },
          },
        })}
      >
        <RentANodeAdd className="addList addSmall" />
        <List className="addList addSmall" dense disablePadding>
          <ListSubheader disableGutters>Try a device</ListSubheader>
          <ListItemButton
            disableGutters
            disabled={claiming}
            onClick={() => {
              if (hasDemo) history.push(`/devices/${DEMO_DEVICE_ID}`)
              else dispatch.devices.claimDevice({ code: DEMO_DEVICE_CLAIM_CODE, redirect: true })
            }}
          >
            <ListItemIcon>
              <Icon name="remoteit" size="xxl" platformIcon fixedWidth />
            </ListItemIcon>
            <ListItemText primary="Demo device" secondary={hasDemo && 'Already shared'} />
          </ListItemButton>
        </List>
        <AndroidSetup className="addList addSmall" />
        <DeviceSetupItem className="addList addSmall" />
        <BluetoothScan className="addList addSmall" />
        <List className="addList addIcons" dense disablePadding>
          <ListSubheader disableGutters>Add an instance</ListSubheader>
          {['docker-jumpbox', 'aws', 'azure', 'gcp', 'arm'].map(p => {
            const platform = platforms.get(p)
            return (
              <ListItemLocation
                key={p}
                iconPlatform
                iconSize="xxl"
                icon={platform.id}
                to={`/add/${platform.id}`}
                title={platform.name}
                subtitle={platform.subtitle}
                disableGutters
              />
            )
          })}
        </List>
        <List className="addList addIcons" dense disablePadding>
          <ListSubheader disableGutters>Add a device</ListSubheader>
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
                title={<>{platform.listItemTitle || platform.name}</>}
                subtitle={platform.subtitle}
                disableGutters
              />
            )
          })}
        </List>
        <ClaimDevice className="addList addSmall" />
        <List className="addList addSmall" dense disablePadding>
          <ListSubheader disableGutters>Add many</ListSubheader>
          <ListItemButton disableGutters onClick={() => history.push('/products')}>
            <ListItemIcon>
              <ConveyorBeltBoxes style={{ height: '2.25rem', width: 'auto' }} />
            </ListItemIcon>
            <ListItemText primary="Products" secondary="Provision in bulk" />
          </ListItemButton>
        </List>
      </Stack>
    </Container>
  )
}

