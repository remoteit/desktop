import React from 'react'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { DiagramIcon } from './DiagramIcon'
import { DiagramPath } from './DiagramPath'
import { isForward, connectionState } from '../helpers/connectionHelper'
import { DeviceContext, DiagramContext } from '../services/Context'
import { DiagramGroup, DiagramGroupType } from './DiagramGroup'
import { lanShared } from '../helpers/lanSharing'
import { DiagramDivider } from './DiagramDivider'
import { Pre } from './Pre'

type Props = {
  to?: { [key in DiagramGroupType]?: string }
  forward?: boolean
  highlightTypes?: DiagramGroupType[]
}

export const Diagram: React.FC<Props> = ({ to: toTypes, forward, highlightTypes = [] }) => {
  const { service, connection } = React.useContext(DeviceContext)
  const state = connectionState(service, connection)
  const lan = lanShared(connection)
  const css = useStyles()
  const proxy = connection && ((!connection.isP2P && connection.connected) || connection.proxyOnly || connection.public)

  forward = forward || isForward(service)
  let activeTypes: DiagramGroupType[] = []

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

  return (
    <DiagramContext.Provider value={{ state, toTypes, activeTypes, highlightTypes }}>
      {/* <Pre {...{ connection }} /> */}
      <Box className={css.diagram}>
        {lan && (
          <DiagramGroup type="lan">
            <DiagramIcon type="lan" />
            <DiagramPath type="lan" />
          </DiagramGroup>
        )}
        <DiagramGroup type="initiator">
          <DiagramIcon type="initiator" />
          <DiagramPath type="initiator" />
        </DiagramGroup>
        {proxy && (
          <DiagramGroup type="proxy">
            <DiagramPath type="proxy" />
            <DiagramIcon type="proxy" />
            <DiagramPath type="proxy" flexGrow={2} />
          </DiagramGroup>
        )}
        <DiagramDivider start />
        <DiagramGroup type="tunnel">
          <DiagramPath type="tunnel" />
        </DiagramGroup>
        <DiagramDivider end />
        {forward && (
          <DiagramGroup type="forward">
            <DiagramPath type="forward" flexGrow={2} />
            <DiagramIcon type="forward" />
            <DiagramPath type="forward" />
          </DiagramGroup>
        )}
        <DiagramGroup type="target" indicator={{ placement: 'right' }}>
          <DiagramPath type="target" />
          <DiagramIcon type="target" />
        </DiagramGroup>
      </Box>
    </DiagramContext.Provider>
  )
}

const useStyles = makeStyles({
  diagram: {
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'stretch',
    position: 'relative',
    overflow: 'visible',
  },
})
