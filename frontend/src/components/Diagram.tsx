import React, { useContext } from 'react'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { DiagramIcon } from './DiagramIcon'
import { DiagramPath } from './DiagramPath'
import { useLocation } from 'react-router-dom'
import { isRelay, connectionState } from '../helpers/connectionHelper'
import { IP_LATCH, REGEX_LAST_PATH, CLI_REACHABLE_ERROR_CODE } from '../shared/constants'
import { DeviceContext, DiagramContext } from '../services/Context'
import { DiagramIndicator, IndicatorProps } from './DiagramIndicator'
import { DiagramLabel } from './DiagramLabel'
import { lanShared } from '../helpers/lanSharing'
import { Pre } from './Pre'

type Props = {
  to?: { [key in DiagramGroupType]?: string }
  relay?: boolean
  highlightTypes?: DiagramGroupType[]
}

export const Diagram: React.FC<Props> = ({ to: toTypes, relay, highlightTypes = [] }) => {
  const { service, connection } = useContext(DeviceContext)
  const location = useLocation()
  const state = connectionState(service, connection)
  const lan = lanShared(connection)
  const css = useStyles()

  const proxy = connection.proxyOnly
  const publik = connection.connectLink || connection.public
  const protekted = connection.connectLink ? !!connection.password : connection.publicRestriction === IP_LATCH
  const page = location.pathname.match(REGEX_LAST_PATH)?.[0]

  relay = relay || isRelay(service)
  let activeTypes: DiagramGroupType[] = []
  let errorTypes: DiagramGroupType[] = []
  let indicator: IndicatorProps = { color: 'grayDarkest' }

  switch (page) {
    case '/connect':
    case '/users':
      indicator.hide = true
      break
    case '/advanced':
    case '/defaults':
    case '/lan':
      indicator.placement = 'left'
      break
    case '/edit':
    case '/add':
      indicator.placement = 'right'
      break
  }

  switch (state) {
    case 'ready':
    case 'starting':
    case 'connecting':
      activeTypes = ['lan', 'initiator', 'target', 'relay']
      indicator.color = 'primary'
      break
    case 'connected':
    case 'disconnecting':
      activeTypes = ['public', 'lan', 'initiator', 'target', 'proxy', 'agent', 'tunnel', 'relay']
      indicator.color = 'primary'
      break
    case 'online':
    case 'stopping':
      activeTypes = ['target', 'relay']
      if (indicator.placement === 'right') indicator.color = 'primary'
      break
    case 'offline':
  }

  if (publik && connection.enabled) {
    // todo public and connected should appear the same, so maybe pass connected state and also add public to it
    activeTypes = ['public', 'lan', 'initiator', 'target', 'proxy', 'agent', 'tunnel', 'relay']
  }

  if (connection.error) {
    console.log('DIAGRAM ERROR', connection.error)
    errorTypes = ['initiator', 'agent']
    if (connection.error.code === CLI_REACHABLE_ERROR_CODE) {
      errorTypes = ['relay', 'target']
    }
  }

  return (
    <DiagramContext.Provider value={{ state, relay, toTypes, activeTypes, highlightTypes, errorTypes }}>
      {/* <Pre {...{ connection }} /> */}
      <Box className={css.diagram}>
        {lan && (
          <>
            <DiagramLabel type="lan" />
            <DiagramIcon type="lan" />
            <DiagramPath type="lan" />
          </>
        )}
        {/* end node */}
        {publik && protekted ? (
          <>
            <DiagramLabel type="initiator" />
            <DiagramIcon type="initiator" />
            <DiagramPath type="public" />
          </>
        ) : publik ? (
          <>
            <DiagramLabel type="public" />
            <DiagramIcon type="public" />
            <DiagramPath type="public" />
          </>
        ) : (
          <>
            <DiagramLabel type="initiator" />
            <DiagramIcon type="initiator" />
            <DiagramPath type="initiator" />
          </>
        )}
        {/* cloud and agent */}
        {publik && proxy ? (
          <>
            <DiagramIcon type="agent" />
            <DiagramPath type="proxy" />
            <DiagramLabel type="proxy" />
            <DiagramIcon type="proxy" />
          </>
        ) : proxy ? (
          <>
            <DiagramIcon type="agent" />
            <DiagramPath type="proxy" />
            <DiagramLabel type="proxy" />
            <DiagramIcon type="proxy" />
          </>
        ) : publik ? (
          <>
            <DiagramLabel type="proxy" />
            <DiagramIcon type="proxy" />
          </>
        ) : (
          <>
            <DiagramIcon type="agent" />
            <DiagramLabel type="tunnel" />
          </>
        )}
        {/* tunnel */}
        <DiagramPath type="tunnel" />
        {/* jump and target */}
        <DiagramIcon type="relay" />
        {relay ? <DiagramPath type="relay" /> : <DiagramPath type="target" />}
        <DiagramIcon type="target" />
        <DiagramLabel type="target" right />
        {/* selection indicator */}
        <DiagramIndicator {...indicator} />
      </Box>
    </DiagramContext.Provider>
  )
}

const useStyles = makeStyles({
  diagram: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'stretch',
    position: 'relative',
    paddingTop: 24,
    paddingBottom: 6,
  },
})
