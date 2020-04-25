import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { makeStyles } from '@material-ui/styles'
import { OutOfBand } from '../../components/OutOfBand'
import { Network } from '../../components/Network'
import { emit } from '../../services/Controller'
import styles from '../../styling'
import analytics from '../../helpers/Analytics'

export const NetworkPage: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const { backend } = useDispatch<Dispatch>()
  const { interfaces, targets, scanData, privateIP, oobAvailable, oobActive } = useSelector(
    (state: ApplicationState) => ({
      interfaces: state.backend.interfaces,
      targets: state.backend.targets,
      scanData: state.backend.scanData,
      privateIP: state.backend.environment.privateIP,
      oobAvailable: state.backend.lan.oobAvailable,
      oobActive: state.backend.lan.oobActive,
    })
  )
  const scan = (interfaceName: string) => {
    emit('scan', interfaceName)
    emit('lan')
  }

  useEffect(() => {
    if (oobAvailable) {
      emit('lan')
      let timer = setInterval(() => emit('lan'), 30000)

      return () => {
        clearInterval(timer)
      }
    }
  }, [])

  useEffect(() => {
    analytics.page('NetworkPage')
  }, [])
  return (
    <>
      <span className={css.oob}>{oobAvailable ? <OutOfBand active={oobActive} /> : ''}</span>
      <Network
        data={scanData}
        targets={targets}
        interfaces={interfaces}
        onScan={scan}
        privateIP={privateIP}
        onAdd={target => {
          history.push('/settings/setupServices')
          backend.set({ key: 'added', value: target })
        }}
      />
    </>
  )
}

const useStyles = makeStyles({
  oob: {
    top: styles.spacing.sm,
    right: styles.spacing.lg,
    position: 'absolute',
  },
})
