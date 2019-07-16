import React from 'react'
import { ConnectionsList } from '../ConnectionsList'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'

export type ConnectionsPageProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState, props: any) => ({
  connections: state.devices.connections,
})

const mapDispatch = (dispatch: any) => ({})

export const ConnectionsPage = connect(
  mapState,
  mapDispatch
)(({ connections }: ConnectionsPageProps) => {
  return <ConnectionsList connections={connections} />
})
