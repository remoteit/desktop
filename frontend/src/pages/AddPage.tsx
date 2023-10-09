import React, { useState, useEffect } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { selectDevice } from '../selectors/devices'
import { DEMO_DEVICE_CLAIM_CODE, DEMO_DEVICE_ID } from '../shared/constants'
import { ListItem, ListSubheader, ListItemIcon, ListItemText, TextField, Typography, Divider } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { OrganizationIndicator } from '../components/OrganizationIndicator'
import { ListItemLocation } from '../components/ListItemLocation'
import { DeviceSetupItem } from '../components/DeviceSetupItem'
import { ListHorizontal } from '../components/ListHorizontal'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { platforms } from '../platforms'
import { Gutters } from '../components/Gutters'
import { spacing } from '../styling'
import { TestUI } from '../components/TestUI'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

const CLAIM_CODE_LENGTH = 8

export const AddPage: React.FC = () => {
  const css = useStyles()
  const { devices } = useDispatch<Dispatch>()
  const [code, setCode] = useState<string>('')
  const [valid, setValid] = useState<boolean>(false)
  const { claiming, hasDemo, testUI } = useSelector((state: ApplicationState) => ({
    claiming: state.ui.claiming,
    hasDemo: selectDevice(state, state.user.id, DEMO_DEVICE_ID) !== undefined,
    testUI: state.ui.testUI,
  }))

  const handleClose = () => {
    setValid(false)
    setCode('')
  }

  useEffect(() => {
    if (!claiming) handleClose()
  }, [claiming])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let { value } = event.target
    if (value.length >= CLAIM_CODE_LENGTH) {
      value = value.substring(0, CLAIM_CODE_LENGTH)
      setValid(true)
    } else {
      setValid(false)
    }
    setCode(value.toUpperCase())
  }

  return (
    <Container
      integrated
      bodyProps={{ verticalOverflow: true }}
      gutterBottom
      header={
        <Typography variant="h1" gutterBottom>
          <Title>What do you want to connect to?</Title>
        </Typography>
      }
    >
      <Gutters className={css.container}>
        <ListHorizontal className={classnames(css.list, css.quarter)} dense disablePadding>
          <ListSubheader disableGutters>Try a device</ListSubheader>
          <Divider />
          <ListItem
            button
            disableGutters
            disabled={hasDemo || claiming}
            onClick={() => {
              setCode(DEMO_DEVICE_CLAIM_CODE)
              devices.claimDevice({ code: DEMO_DEVICE_CLAIM_CODE, redirect: true })
            }}
          >
            <ListItemIcon>
              <Icon name="remoteit" size="xxl" platformIcon fixedWidth />
            </ListItemIcon>
            <ListItemText primary="Demo device" secondary={hasDemo && 'Already shared'} />
          </ListItem>
        </ListHorizontal>
        <ListHorizontal className={css.list} dense disablePadding>
          <ListSubheader disableGutters>Add an instance</ListSubheader>
          <Divider />
          {['docker-jumpbox', 'aws', 'azure', 'gcp', 'arm'].map(p => {
            const platform = platforms.get(p)
            return (
              <ListItemLocation
                key={p}
                iconPlatform
                iconSize="xxl"
                icon={platform.id}
                pathname={`/add/${platform.id}`}
                title={platform.name}
                subtitle={platform.subtitle}
                disableGutters
              />
            )
          })}
        </ListHorizontal>
        <ListHorizontal className={css.list} dense disablePadding>
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
                icon={platform.id}
                pathname={`/add/${platform.id}`}
                title={platform.name}
                subtitle={platform.subtitle}
                disableGutters
              />
            )
            return isTestPlatform ? <TestUI key={p}>{platformIcon}</TestUI> : platformIcon
          })}
        </ListHorizontal>
        <DeviceSetupItem className={classnames(css.list, css.quarter)} onClick={handleClose} />
        <ListHorizontal className={classnames(css.quarter)} dense disablePadding>
          <ListSubheader disableGutters>Claim a device</ListSubheader>
          <Divider />
          <ListItem>
            <form
              className={css.form}
              onSubmit={e => {
                e.preventDefault()
                devices.claimDevice({ code, redirect: true })
              }}
            >
              <TextField
                label="Claim Code"
                value={code}
                variant="filled"
                disabled={claiming}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      submit
                      title="Claim"
                      icon="check"
                      size="base"
                      type="solid"
                      color={claiming || !valid ? 'grayDark' : 'success'}
                      loading={claiming}
                      disabled={claiming || !valid}
                    />
                  ),
                }}
              />
            </form>
            <OrganizationIndicator alignItems="center" marginTop={1} />
          </ListItem>
        </ListHorizontal>
      </Gutters>
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  list: {
    '& .MuiListItemText-root': { marginTop: spacing.sm, marginBottom: spacing.sm },
    '& .MuiListItemSecondaryAction-root': { right: spacing.xs, top: 45 },
  },
  quarter: {
    width: '33%',
    minWidth: 200,
  },
  form: {
    width: 160,
    display: 'flex',
    '& .MuiIconButton-root': { marginRight: spacing.xs },
    '& .MuiFilledInput-root': { fontSize: 14 },
  },
}))
