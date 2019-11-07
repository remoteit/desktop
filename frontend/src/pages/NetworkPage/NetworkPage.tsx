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
  const { jump } = useDispatch<Dispatch>()
  const { interfaces, targets, scanData } = useSelector((state: ApplicationState) => ({
    interfaces: state.jump.interfaces,
    targets: state.jump.targets,
    scanData: state.jump.scanData,
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
        onAdd={target => {
          history.push('/setup')
          jump.setAdded(target)
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
