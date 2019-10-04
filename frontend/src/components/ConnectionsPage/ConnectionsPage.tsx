import React from 'react'
import { ConnectionsList } from '../ConnectionsList'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'

const mapState = (state: ApplicationState, props: any) => ({
  connections: state.devices.connections,
})

const mapDispatch = (dispatch: any) => ({})

export type ConnectionsPageProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>

export const ConnectionsPage = connect(
  mapState,
  mapDispatch
)(({ connections }: ConnectionsPageProps) => {
  return <ConnectionsList connections={connections} />
})
