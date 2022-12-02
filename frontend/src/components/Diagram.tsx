import React from 'react'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { DiagramIcon } from './DiagramIcon'
import { DiagramPath } from './DiagramPath'
import { DiagramDivider } from './DiagramDivider'
import { isRelay, connectionState } from '../helpers/connectionHelper'
import { DeviceContext, DiagramContext } from '../services/Context'
import { DiagramGroup } from './DiagramGroup'
import { DiagramLabel } from './DiagramLabel'
import { DiagramGuide } from './DiagramGuide'
import { lanShared } from '../helpers/lanSharing'
import { Pre } from './Pre'

type Props = {
  to?: { [key in DiagramGroupType]?: string }
  relay?: boolean
  highlightTypes?: DiagramGroupType[]
}

export const Diagram: React.FC<Props> = ({ to: toTypes, relay, highlightTypes = [] }) => {
  const { service, connection } = React.useContext(DeviceContext)
  const state = connectionState(service, connection)
  const lan = lanShared(connection)
  const css = useStyles()
  const proxy = connection && ((!connection.isP2P && connection.connected) || connection.proxyOnly || connection.public)

  relay = relay || isRelay(service)
  let activeTypes: DiagramGroupType[] = []

  switch (state) {
    case 'ready':
    case 'starting':
    case 'connecting':
      activeTypes = ['lan', 'initiator', 'target', 'relay']
      break
    case 'connected':
    case 'disconnecting':
      activeTypes = ['lan', 'initiator', 'target', 'proxy', 'agent', 'tunnel', 'relay']
      break
    case 'online':
    case 'stopping':
      activeTypes = ['target', 'relay']
      break
    case 'offline':
  }

  return (
    <DiagramContext.Provider value={{ state, proxy, relay, toTypes, activeTypes, highlightTypes }}>
      {/* <Pre {...{ connection }} /> */}
      <Box className={css.diagram}>
        <DiagramGroup type="initiator" flexGrow={1}>
          {lan && (
            <>
              <DiagramLabel type="lan" />
              <DiagramIcon type="lan" />
              <DiagramPath type="lan" />
            </>
          )}
          <DiagramLabel type="initiator" />
          <DiagramIcon type="initiator" />
          <DiagramPath type="initiator" />
          {proxy && (
            <>
              <DiagramIcon type="proxy" />
              <DiagramPath type="proxy" />
            </>
          )}
          <DiagramIcon type="agent" />
          <DiagramDivider start />
          <DiagramLabel type="tunnel" />
          <DiagramPath type="tunnel" />
        </DiagramGroup>
        <DiagramGuide type="target">
          <DiagramGroup type="target" indicator={{ placement: 'right' }}>
            <DiagramDivider end />
            {relay && <DiagramLabel type="relay" />}
            <DiagramIcon type="relay" />
            {relay && <DiagramPath type="relay" />}
            <DiagramPath type="target" />
            <DiagramIcon type="target" />
            <DiagramLabel type="target" right />
          </DiagramGroup>
        </DiagramGuide>
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
