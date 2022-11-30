import React from 'react'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { DiagramIcon } from './DiagramIcon'
import { DiagramPath } from './DiagramPath'
import { DiagramDivider } from './DiagramDivider'
import { isRelay, connectionState } from '../helpers/connectionHelper'
import { DeviceContext, DiagramContext } from '../services/Context'
import { DiagramGroup, DiagramGroupType } from './DiagramGroup'
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
      activeTypes = ['lan', 'initiator']
      break
    case 'connected':
      activeTypes = ['target', 'proxy', 'initiator', 'tunnel', 'relay']
      break
    case 'online':
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
              <DiagramLabel name="LAN" />
              <DiagramIcon type="lan" />
              <DiagramPath type="lan" />
            </>
          )}
          <DiagramLabel name="Local" />
          <DiagramIcon type="initiator" />
          <DiagramPath type="initiator" />
          {proxy && (
            <>
              <DiagramIcon type="proxy" />
              <DiagramPath type="proxy" />
            </>
          )}
          <DiagramIcon type="relay" />
          <DiagramDivider start />
          <DiagramLabel name="Tunnel" />
          <DiagramPath type="tunnel" />
        </DiagramGroup>
        <DiagramGuide type="target">
          <DiagramGroup type="target" indicator={{ placement: 'right' }}>
            <DiagramDivider end />
            {relay && <DiagramLabel name="Relay" />}
            <DiagramIcon type="relay" end />
            {relay && <DiagramPath type="relay" />}
            <DiagramPath type="target" />
            <DiagramIcon type="target" />
            <DiagramLabel name="Service" right />
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
