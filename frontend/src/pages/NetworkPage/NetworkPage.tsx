import React from 'react'
import { useHistory } from 'react-router-dom'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import Network from '../../components/jump/Network'
import BackendAdaptor from '../../services/BackendAdapter'

const mapState = (state: ApplicationState) => ({
  scanData: state.jump.scanData,
  targets: state.jump.targets,
  interfaces: state.jump.interfaces,
})

const mapDispatch = (dispatch: any) => ({
  setAdded: dispatch.jump.setAdded,
})

export type NetworkPageProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

export const NetworkPage = connect(
  mapState,
  mapDispatch
)(({ scanData, targets, interfaces, setAdded }: NetworkPageProps) => {
  const history = useHistory()
  const scan = (interfaceName: string) => BackendAdaptor.emit('jump/scan', interfaceName)

  return (
    <Network
      data={scanData}
      targets={targets}
      interfaces={interfaces}
      onScan={scan}
      onAdd={target => {
        history.push('/setup')
        setAdded(target)
      }}
    />
  )
})
