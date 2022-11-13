import React from 'react'
import { IP_PRIVATE } from '../shared/constants'
import { Paper } from '@mui/material'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { DiagramIcon } from './DiagramIcon'
import { DiagramPath } from './DiagramPath'
import { connectionState } from '../helpers/connectionHelper'
import { DeviceContext, DiagramContext } from '../services/Context'
import { DiagramGroup, DiagramGroupType } from './DiagramGroup'
import { Pre } from './Pre'

// import { useSelector } from 'react-redux'
// import { selectConnection } from '../helpers/connectionHelper'
// import { ApplicationState } from '../store'

// type DiagramState = IConnectionState | 'setup' | 'unknown'

type Props = {
  activeTypes?: DiagramGroupType[]
}

export const Diagram: React.FC<Props> = ({ activeTypes = [] }) => {
  const { connections, device } = React.useContext(DeviceContext)
  const { serviceID } = useParams<{ serviceID: string }>()
  const css = useStyles()

  const service = device?.services?.find(s => s.id === serviceID)
  const connection = connections?.find(c => c.id === serviceID)

  const state = connectionState(service, connection)
  const forward = isForward(service)

  switch (state) {
    case 'ready':
      activeTypes = ['initiator']
      break
    case 'connected':
      activeTypes = ['target', 'initiator', 'tunnel', 'forward']
      break
    case 'online':
      activeTypes = ['target', 'forward']
      break
    case 'offline':
  }

  // const { connection } = useSelector((state: ApplicationState) => ({
  //   connection: selectConnection(state, service),
  // }))

  return (
    <DiagramContext.Provider value={{ state, activeTypes }}>
      {/* <Pre {...{ state, activeTypes }} /> */}
      <Paper elevation={0} className={css.diagram}>
        <DiagramGroup type="initiator">
          <DiagramIcon type="initiator" icon="listener" />
          <DiagramPath type="initiator" />
        </DiagramGroup>
        <DiagramGroup type="tunnel">
          <DiagramIcon type="tunnel" icon="entrance" />
          <DiagramPath type="tunnel" />
          <DiagramIcon type="tunnel" icon="exit" />
        </DiagramGroup>
        <DiagramGroup type={forward ? 'forward' : 'target'}>
          <DiagramPath type={forward ? 'forward' : 'target'} />
          <DiagramIcon type={forward ? 'forward' : 'target'} icon={forward ? 'forward' : 'service'} />
          {forward && <DiagramPath type="forward" />}
        </DiagramGroup>
        {forward && (
          <DiagramGroup type="target">
            <DiagramPath type="target" />
            <DiagramIcon type="target" icon="service" />
          </DiagramGroup>
        )}
      </Paper>
    </DiagramContext.Provider>
  )
}

function isForward(service?: IService) {
  return service && service.host !== IP_PRIVATE && service.host !== 'localhost'
}

const useStyles = makeStyles(({ palette }) => ({
  diagram: () => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'stretch',
  }),
}))
