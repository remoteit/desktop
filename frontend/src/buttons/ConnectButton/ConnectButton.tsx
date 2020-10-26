import React, { useEffect, useState } from 'react'
import { Dispatch } from '../../store'
import { useDispatch } from 'react-redux'
import { newConnection } from '../../helpers/connectionHelper'
import { DynamicButton } from '../DynamicButton'
import { Color } from '../../styling'
import { Fade } from '@material-ui/core'
import { emit } from '../../services/Controller'
import heartbeat from '../../services/Heartbeat'
import analyticsHelper from '../../helpers/analyticsHelper'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
  size?: 'icon' | 'medium' | 'small'
  color?: Color
  autoConnect?: boolean
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  connection,
  service,
  size = 'medium',
  color = 'secondary',
  autoConnect,
}) => {
  const [autoStart, setAutoStart] = useState<boolean>(!!autoConnect)
  const [started, setStarted] = useState<boolean>(false)
  const { devices } = useDispatch<Dispatch>()
  const hidden = connection?.active || !service || service.state !== 'active'
  const connecting = !!connection?.connecting
  const clickHandler = () => {
    heartbeat.caffeinate()

    if (connecting) {
      analyticsHelper.trackConnect('connectionClosed', service)
      emit('service/disconnect', connection)
    } else {
      analyticsHelper.trackConnect('connectionInitiated', service)
      emit('service/connect', connection || newConnection(service))
    }
  }

  useEffect(() => {
    if (autoStart && service) {
      setAutoStart(false)
      clickHandler()
    }
    setStarted(!!connection?.active)
  })

  useEffect(() => {
    if (started && connection && !connection?.active) devices.fetchSingle({ deviceId: connection.deviceID })
  }, [started, connection])

  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton
          title={connecting ? 'Connecting' : 'Connect'}
          icon="exchange"
          loading={connecting}
          color={connecting ? undefined : color}
          size={size}
          onClick={clickHandler}
        />
      </div>
    </Fade>
  )
}
