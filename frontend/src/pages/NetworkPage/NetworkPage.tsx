import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { makeStyles } from '@material-ui/core/styles'
import { OutOfBand } from '../../components/OutOfBand'
import { Network } from '../../components/Network'
import { emit } from '../../services/Controller'
import styles from '../../styling'
import analytics from '../../helpers/Analytics'

export const NetworkPage: React.FC = () => {
  const css = useStyles()
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
    analytics.track('networkScan')
    emit('scan', interfaceName)
  }

  useEffect(() => {
    emit('interfaces')
  }, [])

  useEffect(() => {
    analytics.page('NetworkPage')
  }, [])
  return (
    <>
      {oobAvailable && (
        <span className={css.oob}>
          <OutOfBand active={oobActive} />
        </span>
      )}
      <Network data={scanData} targets={targets} interfaces={interfaces} onScan={scan} privateIP={privateIP} />
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
