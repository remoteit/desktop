import React, { useEffect, useState } from 'react'
import { NetworkCheckRounded, DeveloperBoardRounded, MeetingRoomRounded } from '@material-ui/icons'
import { BottomNavigation, BottomNavigationAction, Snackbar } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { ITarget, IDevice, IScanData, IInterface } from '../common/types'
import defaults from '../common/defaults'
import styles from '../styling/styling'
import SignIn from './SignIn'
import Device from './Device'
import Page from './Page'
import Network from './Network'

const App: React.FC<{ socket: SocketIOClient.Socket }> = ({ socket }) => {
  const css = useStyles()

  const [device, setDevice] = useState<IDevice>(defaults)
  const [targets, setTargets] = useState<ITarget[]>([])
  const [scanData, setScanData] = useState<IScanData>({ wlan0: [] })
  const [interfaces, setInterfaces] = useState<IInterface[]>([])
  const [added, setAdded] = useState<ITarget | undefined>()
  const [error, setError] = useState<boolean>(false)
  const [tab, setTab] = useState(0)

  const updateTargets = (t: ITarget[]) => socket.emit('targets', t)
  const updateDevice = (d: IDevice) => socket.emit('device', d)
  const deleteDevice = () => {
    socket.emit('device', 'DELETE')
    socket.emit('auth')
  }
  const signOut = () => socket.emit('user', {})
  const scan = (interfaceName: string) => socket.emit('scan', interfaceName)

  useEffect(() => {
    socket.on('connect', () => setError(false))
    socket.on('connect_error', () => setError(true))
    socket.on('targets', (result: ITarget[]) => {
      console.log('socket targets', result)
      if (result) {
        setAdded(undefined)
        setTargets(result)
      }
    })
    socket.on('device', (result: IDevice) => {
      console.log('socket device', result)
      if (result) setDevice(result)
    })
    socket.on('scan', (result: IScanData) => {
      console.log('socket scan', result)
      if (result) setScanData(result)
    })
    socket.on('interfaces', (result: IInterface[]) => {
      console.log('socket interfaces', result)
      if (result) setInterfaces(result)
    })

    return function cleanup() {
      socket.removeAllListeners()
    }
  }, [socket])

  useEffect(() => {
    socket.emit('auth')
  }, [socket])

  return (
    <div className={css.body}>
      {/* <SignIn user={user} interfaces={interfaces} onSignIn={signIn}>
        <Page show={tab === 1} user={user} interfaces={interfaces}>
          <Network
            data={scanData}
            targets={targets}
            interfaces={interfaces}
            onScan={scan}
            onAdd={target => {
              setAdded(target)
              setTab(0)
            }}
          />
        </Page>
        <Page show={tab !== 1} user={user} interfaces={interfaces}>
          <Device
            device={device}
            targets={targets}
            added={added}
            onDevice={updateDevice}
            onUpdate={updateTargets}
            onDelete={deleteDevice}
            onCancel={() => setAdded(undefined)}
          />
        </Page>
        <BottomNavigation value={tab} onChange={(event, newValue: number) => setTab(newValue)} showLabels>
          <BottomNavigationAction label="Config" icon={<DeveloperBoardRounded />} />
          <BottomNavigationAction label="Network" icon={<NetworkCheckRounded />} />
          <BottomNavigationAction label="Sign Out" icon={<MeetingRoomRounded />} onClick={signOut} />
        </BottomNavigation>
      </SignIn> */}
      <Snackbar open={!!error} message="Webserver connection lost. Retrying..." />
    </div>
  )
}

export default App

const useStyles = makeStyles({
  body: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    '& .MuiBottomNavigation-root': {
      width: '100%',
      height: 80,
      boxShadow: '0 0 5px rgba(0,0,0,0.2)',
      '& button': { maxWidth: '50%' },
    },
    '& h2': {
      textTransform: 'uppercase',
      fontSize: 12,
      letterSpacing: '0.6em',
      fontWeight: 500,
      color: styles.colors.gray,
      marginTop: styles.spacing.lg,
    },
    '& section': {
      display: 'flex',
      justifyContent: 'space-between',
      padding: `${styles.spacing.xl}px 0`,
      borderTop: `1px solid ${styles.colors.grayLighter}`,
    },
  },
})
