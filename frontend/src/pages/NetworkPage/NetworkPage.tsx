import React from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { makeStyles } from '@material-ui/styles'
import OutOfBand from '../../components/jump/OutOfBand'
import Network from '../../components/jump/Network'
import BackendAdaptor from '../../services/BackendAdapter'
import styles from '../../styling'

export const NetworkPage: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const { backend } = useDispatch<Dispatch>()
  const { interfaces, targets, scanData, privateIP } = useSelector((state: ApplicationState) => ({
    interfaces: state.backend.interfaces,
    targets: state.backend.targets,
    scanData: state.backend.scanData,
    privateIP: state.backend.privateIP,
  }))

  const scan = (interfaceName: string) => BackendAdaptor.emit('scan', interfaceName)

  return (
    <>
      <span className={css.oob}>
        <OutOfBand active={interfaces.length > 1} />
      </span>
      <Network
        data={scanData}
        targets={targets}
        interfaces={interfaces}
        onScan={scan}
        privateIP={privateIP}
        onAdd={target => {
          history.push('/setup')
          backend.set({ key: 'added', value: target })
        }}
      />
    </>
  )
}

const useStyles = makeStyles({
  oob: {
    top: styles.spacing.lg,
    right: styles.spacing.lg,
    position: 'absolute',
  },
})
