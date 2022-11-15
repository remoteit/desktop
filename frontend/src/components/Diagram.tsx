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
import { TestUI } from './TestUI'
import { Pre } from './Pre'

type Props = {
  activeTypes?: DiagramGroupType[]
  selectedTypes?: DiagramGroupType[]
}

export const Diagram: React.FC<Props> = ({ activeTypes = [], selectedTypes = [] }) => {
  const { connections, device } = React.useContext(DeviceContext)
  const { serviceID } = useParams<{ serviceID: string }>()
  const css = useStyles()

  const service = device?.services?.find(s => s.id === serviceID)
  const connection = connections?.find(c => c.id === serviceID)

  const state = connectionState(service, connection)
  const forward = isForward(service)
  const proxy = connection && ((connection.isP2P !== undefined && !connection.isP2P) || connection.public)

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
    <TestUI>
      <DiagramContext.Provider value={{ state, activeTypes, selectedTypes }}>
        {/* <Pre {...{ connection }} /> */}
        <Paper elevation={0} className={css.diagram}>
          <DiagramGroup type="initiator">
            <DiagramIcon type="initiator" icon="listener" />
            <DiagramPath type="initiator" />
          </DiagramGroup>
          {proxy && (
            <DiagramGroup type="proxy">
              <DiagramPath type="proxy" />
              <DiagramIcon type="proxy" icon="proxy" />
              <DiagramPath type="proxy" />
            </DiagramGroup>
          )}
          <DiagramGroup type="tunnel">
            <DiagramIcon type="tunnel" icon="entrance" />
            <DiagramPath type="tunnel" />
            <DiagramIcon type="tunnel" icon="exit" />
          </DiagramGroup>
          {forward && (
            <DiagramGroup type="forward">
              <DiagramPath type="forward" />
              <DiagramIcon type="forward" icon="forward" />
              <DiagramPath type="forward" />
            </DiagramGroup>
          )}
          <DiagramGroup type="target">
            <DiagramPath type="target" />
            <DiagramIcon type="target" icon="service" />
          </DiagramGroup>
        </Paper>
      </DiagramContext.Provider>
    </TestUI>
  )
}

function isForward(service?: IService) {
  return service && service.host && service.host !== IP_PRIVATE && service.host !== 'localhost'
}

const useStyles = makeStyles(({ palette }) => ({
  diagram: () => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'stretch',
    '& .MuiPaper-root + .MuiPaper-root': { marginLeft: 1 },
  }),
}))
