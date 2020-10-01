import React from 'react'
import clsx from 'clsx'
import { useSelector } from 'react-redux'
import { DeviceListItem } from '../DeviceListItem'
import { getAccountId, getOwnDevices } from '../../models/accounts'
import { DeviceSetupItem } from '../DeviceSetupItem'
import { ApplicationState } from '../../store'
import { ServiceContextualMenu } from '../ServiceContextualMenu'
import { Notice } from '../Notice'
import { List, Divider, ListItem, makeStyles, createStyles, Theme, Typography } from '@material-ui/core'
import { LoadMore } from '../LoadMore'
import { FilterDrawerContent } from '../FilterDrawerContent'
import { Body } from '../Body'
export interface DeviceListProps {
  devices?: IDevice[]
  connections: { [deviceID: string]: IConnection[] }
  handleDrawer: (state: boolean) => void
  open: boolean
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices = [], connections = {}, handleDrawer, open }) => {
  const [contextMenu, setContextMenu] = React.useState<IContextMenu>({})
  const { myDevice, loggedInUser, registeredId } = useSelector((state: ApplicationState) => ({
    registeredId: state.backend.device.uid,
    loggedInUser: getAccountId(state) === state.auth.user?.id,
    myDevice: getOwnDevices(state).find(device => device.id === state.backend.device.uid),
  }))

  const css = useStyles()

  return (
    <div className={css.root}>
      <List
        className={clsx(css.content, {
          [css.contentShift]: open,
        })}
      >
        {registeredId ? (
          loggedInUser &&
          (myDevice ? (
            <>
              <DeviceListItem
                key={registeredId}
                device={myDevice}
                connections={connections[registeredId]}
                thisDevice={true}
                setContextMenu={setContextMenu}
              />
              <Divider />
            </>
          ) : (
            <>
              <ListItem>
                <Notice>This device is not registered to you.</Notice>
              </ListItem>
              <Divider />
            </>
          ))
        ) : (
          <>
            <DeviceSetupItem />
            <Divider />
          </>
        )}
        {devices.length ? (
          devices.map(
            device =>
              device.id !== myDevice?.id && (
                <DeviceListItem
                  key={device.id}
                  device={device}
                  connections={connections[device.id]}
                  setContextMenu={setContextMenu}
                />
              )
          )
        ) : (
          <Body center>
            <Typography variant="body1" color="textSecondary">
              Not devices found
            </Typography>
          </Body>
        )}
      </List>
      <LoadMore />
      <ServiceContextualMenu
        el={contextMenu.el}
        serviceID={contextMenu.serviceID}
        setEl={el => setContextMenu({ ...contextMenu, el })}
      />
      <FilterDrawerContent open={open} close={handleDrawer} />
    </div>
  )
}

const drawerWidth = 240
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginRight: -drawerWidth,
    },
    contentShift: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: 0,
    },
  })
)
