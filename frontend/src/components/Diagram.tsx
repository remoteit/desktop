import React from 'react'
import { Box } from '@mui/material'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { DeviceContext } from '../services/Context'
import { DiagramIcon } from './DiagramIcon'
import { DiagramPath } from './DiagramPath'
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

  const service = device?.services.find(s => s.id === serviceID)
  const connection = connections?.find(c => c.id === serviceID)

  // const { connection } = useSelector((state: ApplicationState) => ({
  //   connection: selectConnection(state, service),
  // }))

  return (
    <Box className={css.diagram}>
      <DiagramGroup type="initiator" active={active.includes('initiator')}>
        <DiagramIcon type="listener" />
        <DiagramPath state="connected" />
      </DiagramGroup>
      <DiagramGroup type="tunnel" active={active.includes('tunnel')}>
        <DiagramIcon type="entrance" />
        <DiagramPath />
        <DiagramIcon type="exit" />
      </DiagramGroup>
      <DiagramGroup type="target" active={active.includes('target')}>
        <DiagramPath state="connected" />
        <DiagramIcon type="service" />
      </DiagramGroup>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  diagram: () => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'stretch',
  }),
}))
