import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { selectDevice } from '../selectors/devices'
import { DEMO_DEVICE_CLAIM_CODE, DEMO_DEVICE_ID } from '../constants'
import { Stack, List, ListItem, ListSubheader, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { DeviceSetupItem } from '../components/DeviceSetupItem'
import { ClaimDevice } from '../components/ClaimDevice'
import { Container } from '../components/Container'
import { platforms } from '../platforms'
import { spacing } from '../styling'
import { TestUI } from '../components/TestUI'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const AddPage: React.FC = () => {
  const css = useStyles()
  const { devices } = useDispatch<Dispatch>()
  const { claiming, hasDemo, testUI } = useSelector((state: ApplicationState) => ({
    claiming: state.ui.claiming,
    hasDemo: selectDevice(state, state.user.id, DEMO_DEVICE_ID) !== undefined,
    testUI: state.ui.testUI,
  }))

  return (
    <Container
      integrated
      bodyProps={{ verticalOverflow: true }}
      gutterBottom
      header={
        <Typography variant="h1" gutterBottom sx={{ marginRight: 4 }}>
          <Title>What do you want to connect to?</Title>
        </Typography>
      }
    >
      <Stack flexWrap="wrap" alignItems="flex-start" flexDirection="row" paddingX={{ xs: 1, sm: 4 }}>
        <List className={classnames(css.list, css.smallList)} dense disablePadding>
          <ListSubheader disableGutters>Try a device</ListSubheader>
          <Divider />
          <ListItem
            button
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
          </ListItem>
        </List>
        <List className={classnames(css.list, css.smallList)} dense disablePadding>
          <ListSubheader disableGutters>Claim a device</ListSubheader>
          <Divider />
          <ListItem>
            <ClaimDevice />
          </ListItem>
        </List>
        <DeviceSetupItem className={classnames(css.list, css.smallList)} />
        {/* <List className={classnames(css.list, css.bigList)} dense disablePadding>
          <ListSubheader disableGutters>Quick add Command</ListSubheader>
          <Divider />
          <AddQuickPlatform />
        </List> */}
        <List className={css.list} dense disablePadding>
          <ListSubheader disableGutters>Add an instance</ListSubheader>
          <Divider />
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
          <Divider />
          {[
            'raspberrypi',
            'linux',
            'docker',
            'nas',
            'openwrt',
            'firewalla',
            'android',
            'tinkerboard',
            'ubiquiti',
            'nvidia',
            'alpine',
            'axis',
            'advantech',
            'ubuntu',
            'windows',
            'mac',
          ].map(p => {
            const platform = platforms.get(p)
            const isTestPlatform = ['android'].includes(p)
            if (isTestPlatform && !testUI) return null
            const platformIcon = (
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
            return isTestPlatform ? <TestUI key={p}>{platformIcon}</TestUI> : platformIcon
          })}
        </List>
      </Stack>
    </Container>
  )
}

const useStyles = makeStyles(({ breakpoints }) => ({
  list: {
    minWidth: 200,
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    paddingRight: spacing.xs,
    paddingLeft: spacing.md,
    '& .MuiListItem-root': {
      display: 'block',
      minWidth: 140,
      minHeight: 85,
      paddingLeft: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      paddingRight: spacing.md,
      margin: 1,
    },
    '& .MuiListItemText-root': { marginTop: spacing.sm, marginBottom: spacing.sm },
    '& .MuiListItemSecondaryAction-root': { right: spacing.xs, top: 45 },
    '& .MuiListSubheader-root': { width: '100%' },
    '& .MuiDivider-root': { width: '100%' },
  },
  smallItem: {
    width: 140,
  },
  smallList: {
    width: '100%',
    [breakpoints.up('sm')]: { width: '33%' },
  },
  bigList: {
    width: '100%',
    [breakpoints.up('md')]: { width: '75%' },
  },
}))
