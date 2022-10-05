import React, { useState, useEffect } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { DEMO_DEVICE_CLAIM_CODE, DEMO_DEVICE_ID } from '../shared/constants'
import { ListItem, ListSubheader, ListItemIcon, ListItemText, TextField, Divider } from '@mui/material'
import { selectDeviceByAccount } from '../models/devices'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { DeviceSetupItem } from '../components/DeviceSetupItem'
import { ListHorizontal } from '../components/ListHorizontal'
import { IconButton } from '../buttons/IconButton'
import { platforms } from '../platforms'
import { Gutters } from '../components/Gutters'
import { spacing } from '../styling'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

const CLAIM_CODE_LENGTH = 8

export const AddPage: React.FC = () => {
  const css = useStyles()
  const { devices } = useDispatch<Dispatch>()
  const [code, setCode] = useState<string>('')
  const [valid, setValid] = useState<boolean>(false)
  const { claiming, hasDemo } = useSelector((state: ApplicationState) => ({
    claiming: state.ui.claiming,
    hasDemo: selectDeviceByAccount(state, DEMO_DEVICE_ID, state.user.id) !== undefined,
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
    <Body verticalOverflow>
      <Gutters className={css.container}>
        <DeviceSetupItem className={classnames(css.list, css.third)} onClick={handleClose} />
        <ListHorizontal className={classnames(css.list, css.third)} dense disablePadding>
          <ListSubheader disableGutters>Try a device</ListSubheader>
          <Divider />
          <ListItem
            button
            disableGutters
            disabled={hasDemo || claiming}
            onClick={() => {
              setCode(DEMO_DEVICE_CLAIM_CODE)
              devices.claimDevice({ code: DEMO_DEVICE_CLAIM_CODE })
            }}
          >
            <ListItemIcon>
              <Icon name="remoteit" size="xxl" platformIcon fixedWidth />
            </ListItemIcon>
            <ListItemText primary="Demo device" secondary={hasDemo && 'Already shared'} />
          </ListItem>
        </ListHorizontal>
        <ListHorizontal className={classnames(css.list, css.third)} dense disablePadding>
          <ListSubheader disableGutters>Claim a device</ListSubheader>
          <Divider />
          <ListItem>
            <form
              className={css.form}
              onSubmit={e => {
                e.preventDefault()
                devices.claimDevice({ code })
              }}
            >
              <TextField
                autoFocus
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
          </ListItem>
        </ListHorizontal>
        <ListHorizontal className={css.list} dense disablePadding>
          <ListSubheader disableGutters>Add an instance</ListSubheader>
          <Divider />
          {['docker', 'aws', 'azure', 'gcp', 'arm'].map(p => {
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
          {['raspberrypi', 'linux', 'nas', 'firewalla', 'tinkerboard', 'windows', 'mac'].map(p => {
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
      </Gutters>
    </Body>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  list: {
    '& .MuiListItem-root': { width: 140 },
    '& .MuiListItemText-root': { marginTop: spacing.sm, marginBottom: spacing.sm, color: palette.grayDark.main },
    '& .MuiListItemSecondaryAction-root': { right: spacing.xs, top: 45 },
  },
  third: {
    width: '33%',
    minWidth: 220,
  },
  form: {
    width: 160,
    display: 'flex',
    '& .MuiIconButton-root': { marginRight: spacing.xs },
    '& .MuiFilledInput-root': { fontSize: 14 },
  },
}))
