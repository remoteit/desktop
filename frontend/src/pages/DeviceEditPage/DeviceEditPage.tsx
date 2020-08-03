import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, Divider, ListItemIcon, ListItemText, List } from '@material-ui/core';
import {  useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { ApplicationState, Dispatch } from '../../store'
import { Container } from '../../components/Container'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import { ListItemLocation } from '../../components/ListItemLocation/ListItemLocation';
import { SettingsListItem } from '../../components/SettingsListItem/SettingsListItem';
import { Targets } from '../../components/Targets/Targets';

type Props = {
  os?: Ios
  targets: ITarget[]
  device: ITargetDevice
}
export const DeviceEditPage: React.FC<Props> = ({ device, os, targets, ...props }) => {
  const css = useStyles()
  const { ui } = useDispatch<Dispatch>()
  
  const onUpdate = (t: ITarget[]) => emit('targets', t)
  const onCancel = () => ui.set({ setupAdded: undefined })

  useEffect(() => {
    analytics.page('DevicesDetailPage')
  }, [])

  if (device) {
    return (
      <Container
        header={
          <>
            <OutOfBand />
            <Breadcrumbs />
            <div className={css.header}>
              <Icon className={css.iconStyle} name={'pen'} size="md" fixedWidth />
              <Typography className={css.title} variant="h2">Edit device</Typography>
            </div>
            <Divider />
          </>
        }
      >
        <Typography variant="subtitle1">Device Name</Typography>
        <List>
          <DeviceEditItem device={device} />
        </List>
        <Typography variant="subtitle1">Connection settings</Typography>
        <List>
          <SettingsListItem
            label="Allow shared access"
            subLabel="Allows users with shared access to connect to this service"
            icon="user-friends"
            toggle={true}
            onClick={() => { }}
          />
        </List>
        <Divider />
        <Typography variant="subtitle1">Services</Typography>
        <section>
          <Targets device={device} targets={targets} onUpdate={onUpdate} onCancel={onCancel} {...props} />
        </section>
      </Container>
    )
  } else {
    return (
      <Container
        header={<>
        </>}
      >
      </Container>

    )
  }
}

type ItemProps = {
  device: ITargetDevice
}

const DeviceEditItem: React.FC<ItemProps> = ({ device }) => {
  return (
    <ListItemLocation pathname="">
      <ListItemIcon>
        <Icon name="hdd" size="md" type="light" />
      </ListItemIcon>
      <ListItemText secondary="Device name" primary={device.name} />
    </ListItemLocation>
  )
}


const useStyles = makeStyles({
  iconStyle: {
    padding: 12,
  },
  title: {
    paddingLeft: 22,
    paddingTop: 12,
    paddingBottom: 12
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    paddingLeft: 30,
    paddingBottom: 10
  },
})
