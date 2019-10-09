import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import Network from '../../jump/components/Network'
import BackendAdaptor from '../../services/BackendAdapter'

const mapState = (state: ApplicationState) => ({
  scanData: state.jump.scanData,
  targets: state.jump.targets,
  interfaces: state.jump.interfaces,
})

const mapDispatch = (dispatch: any) => ({
  setAdded: dispatch.jump.setAdded,
  setPage: dispatch.navigation.setPage,
})

export type NetworkPageProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

export const NetworkPage = connect(
  mapState,
  mapDispatch
)(({ scanData, targets, interfaces, setAdded, setPage }: NetworkPageProps) => {
  const scan = (interfaceName: string) => BackendAdaptor.emit('jump/scan', interfaceName)

  useEffect(() => {
    BackendAdaptor.emit('jump/interfaces')
  }, [])

  return (
    <Network
      data={scanData}
      targets={targets}
      interfaces={interfaces}
      onScan={scan}
      onAdd={target => {
        setAdded(target)
        setPage('setup')
      }}
    />
  )
})
