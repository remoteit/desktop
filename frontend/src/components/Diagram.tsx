import React from 'react'
import { Paper } from '@mui/material'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { DiagramIcon } from './DiagramIcon'
import { DiagramPath } from './DiagramPath'
import { DeviceContext } from '../services/Context'
import { connectionState } from '../helpers/connectionHelper'
import { DiagramGroup, DiagramGroupType } from './DiagramGroup'

// import { useSelector } from 'react-redux'
// import { selectConnection } from '../helpers/connectionHelper'
// import { ApplicationState } from '../store'

// type DiagramState = IConnectionState | 'setup' | 'unknown'

type Props = {
  active?: DiagramGroupType[]
}

export const Diagram: React.FC<Props> = ({ active = [], ...props }) => {
  const { connections, device } = React.useContext(DeviceContext)
  const { serviceID } = useParams<{ serviceID: string }>()
  const css = useStyles()

  const service = device?.services?.find(s => s.id === serviceID)
  const connection = connections?.find(c => c.id === serviceID)

  const state = connectionState(service, connection)

  // const { connection } = useSelector((state: ApplicationState) => ({
  //   connection: selectConnection(state, service),
  // }))

  return (
    <Paper elevation={0} className={css.diagram}>
      <DiagramGroup type="initiator" active={active.includes('initiator')}>
        <DiagramIcon state={state} type="listener" />
        <DiagramPath state={state} />
      </DiagramGroup>
      <DiagramGroup type="tunnel" active={active.includes('tunnel')}>
        <DiagramIcon state={state} type="entrance" />
        <DiagramPath state={state} />
        <DiagramIcon state={state} type="exit" />
      </DiagramGroup>
      <DiagramGroup type="target" active={active.includes('target')}>
        <DiagramPath state={state} />
        <DiagramIcon state={state} type="service" />
      </DiagramGroup>
    </Paper>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  diagram: () => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'stretch',
  }),
}))
