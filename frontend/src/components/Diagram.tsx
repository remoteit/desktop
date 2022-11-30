import React from 'react'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { DiagramIcon } from './DiagramIcon'
import { DiagramPath } from './DiagramPath'
import { DiagramDivider } from './DiagramDivider'
import { isForward, connectionState } from '../helpers/connectionHelper'
import { DeviceContext, DiagramContext } from '../services/Context'
import { DiagramGroup, DiagramGroupType } from './DiagramGroup'
import { DiagramLabel } from './DiagramLabel'
import { DiagramGuide } from './DiagramGuide'
import { lanShared } from '../helpers/lanSharing'
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
      activeTypes = ['target', 'initiator', 'tunnel', 'relay']
      break
    case 'online':
      activeTypes = ['target', 'relay']
      break
    case 'offline':
  }

  return (
    <DiagramContext.Provider value={{ state, proxy, forward, toTypes, activeTypes, highlightTypes }}>
      {/* <Pre {...{ connection }} /> */}
      <Box className={css.diagram}>
        <DiagramGroup type="initiator" flexGrow={1}>
          {lan && (
            <>
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
            <DiagramLabel name="Relay" />
            <DiagramIcon type="relay" rotate={180} />
            <DiagramPath type="relay" />
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
