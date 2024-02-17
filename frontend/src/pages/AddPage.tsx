import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { selectDevice } from '../selectors/devices'
import { DEMO_DEVICE_CLAIM_CODE, DEMO_DEVICE_ID } from '../constants'
import {
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListSubheader,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { ScreenViewSetup } from '../components/ScreenViewSetup'
import { DeviceSetupItem } from '../components/DeviceSetupItem'
import { AndroidSetup } from '../components/AndroidSetup'
import { ClaimDevice } from '../components/ClaimDevice'
import { Container } from '../components/Container'
import { platforms } from '../platforms'
import { spacing } from '../styling'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const AddPage: React.FC = () => {
  const css = useStyles()
  const { devices } = useDispatch<Dispatch>()
  const claiming = useSelector((state: State) => state.ui.claiming)
  const hasDemo = useSelector((state: State) => selectDevice(state, state.user.id, DEMO_DEVICE_ID) !== undefined)

  return (
    <Container
      integrated
      bodyProps={{ verticalOverflow: true }}
      gutterBottom
      header={
        <Typography variant="h1" gutterBottom sx={{ marginRight: 4 }}>
          <Title>What do you want to connect&nbsp;to?</Title>
        </Typography>
      }
    >
      <Stack flexWrap="wrap" alignItems="flex-start" flexDirection="row" paddingX={{ xs: 1, sm: 4 }}>
        <List className={classnames(css.list, css.smallList)} dense disablePadding>
          <ListSubheader disableGutters>Try a device</ListSubheader>
          <ListItemButton
            disableGutters
            disabled={hasDemo || claiming}
            className={css.smallItem}
            onClick={() => {
              devices.claimDevice({ code: DEMO_DEVICE_CLAIM_CODE, redirect: true })
            }}
          >
            <ListItemIcon>
              <Icon name="remoteit" size="xxl" platformIcon fixedWidth />
            </ListItemIcon>
            <ListItemText primary="Demo device" secondary={hasDemo && 'Already shared'} />
          </ListItemButton>
        </List>
        <AndroidSetup className={classnames(css.list, css.smallList)} />
        <DeviceSetupItem className={classnames(css.list, css.smallList)} />
        <ScreenViewSetup className={classnames(css.list, css.smallList)} />
        <List className={classnames(css.list, css.smallList)} dense disablePadding>
          <ListSubheader disableGutters>Claim a device</ListSubheader>
          <ListItem sx={{ paddingTop: 3 }} disablePadding>
            <ClaimDevice />
          </ListItem>
        </List>
        <List className={css.list} dense disablePadding>
          <ListSubheader disableGutters>Add an instance</ListSubheader>
          {['docker-jumpbox', 'aws', 'azure', 'gcp', 'arm'].map(p => {
            const platform = platforms.get(p)
            return (
              <ListItemLocation
                key={p}
                iconPlatform
                iconSize="xxl"
                className={css.smallItem}
                icon={platform.id}
                to={`/add/${platform.id}`}
                title={platform.name}
                subtitle={platform.subtitle}
                disableGutters
              />
            )
          })}
        </List>
        <List className={css.list} dense disablePadding>
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
            'windows',
            'mac',
          ].map(p => {
            const platform = platforms.get(p)
            const platformIcon = platform.hasScreenView ? (
              <>
                &nbsp;&nbsp;
                <Tooltip title="Remote.It ScreenView Enabled" placement="top" arrow>
                  <span>
                    <Icon name="android-screenview" size="sm" platformIcon currentColor />
                  </span>
                </Tooltip>
              </>
            ) : null

            return (
              <ListItemLocation
                key={p}
                iconPlatform
                iconSize="xxl"
                className={css.smallItem}
                icon={platform.id}
                to={`/add/${platform.id}`}
                title={
                  <>
                    {platform.name}
                    {platformIcon}
                  </>
                }
                subtitle={platform.subtitle}
                disableGutters
              />
            )
          })}
        </List>
      </Stack>
    </Container>
  )
}

const useStyles = makeStyles(({ palette, breakpoints }) => ({
  list: {
    minWidth: 175,
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    paddingRight: spacing.xs,
    paddingLeft: spacing.md,
    '& .MuiListItemButton-root, & .MuiListItem-root': {
      display: 'block',
      minWidth: 140,
      minHeight: 100,
      margin: 1,
    },
    '& .MuiListItemButton-root': {
      paddingLeft: spacing.md,
      paddingTop: spacing.lg,
      paddingRight: spacing.md,
      flexGrow: 'initial',
    },
    '& .MuiListItemText-root': { marginTop: spacing.sm, marginBottom: spacing.sm },
    '& .MuiListItemSecondaryAction-root': { right: spacing.xs, top: 45 },
    '& .MuiListSubheader-root': {
      width: '100%',
      borderBottom: `1px solid ${palette.grayLight.main}`,
      marginBottom: spacing.xs,
    },
  },
  smallItem: {
    width: 140,
  },
  smallList: {
    width: '50%',
    [breakpoints.up('sm')]: { width: '33%' },
    [breakpoints.up('md')]: { width: '25%' },
  },
}))
