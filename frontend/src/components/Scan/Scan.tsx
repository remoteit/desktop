import React, { useEffect, useCallback } from 'react'
import { DEFAULT_INTERFACE } from '../../models/ui'
import { Button, CircularProgress, TextField, MenuItem, Typography } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import { ScanNetwork } from '../ScanNetwork'
import styles from '../../styling'

type Props = {
  data: IScanData
  onScan: (network: string) => void
  interfaces: IInterface[]
  targets: ITarget[]
  privateIP: string
}

export const Scan: React.FC<Props> = ({ data, onScan, interfaces, targets, privateIP }) => {
  const css = useStyles()
  const { ui } = useDispatch<Dispatch>()
  const { scanLoading, scanTimestamp, scanInterface } = useSelector((state: ApplicationState) => state.ui)
  const selected = data[scanInterface] || {}
  const selectedTimestamp = scanTimestamp[scanInterface]
  const selectedLoading = scanLoading[scanInterface]
  const noResults = selected.data && !selected.data.length

  const scan = useCallback(
    (i: string) => {
      onScan(i)
      ui.set({
        scanLoading: { [i]: true },
        scanTimestamp: { [i]: selected.timestamp },
      })
    },
    [selected, onScan, ui]
  )

  useEffect(() => {
    if (interfaces.length && scanInterface === DEFAULT_INTERFACE) {
      let name = interfaces[0].name
      interfaces.forEach(i => i.active && (name = i.name))
      ui.set({ scanInterface: name })
      // scan(name) // don't auto scan
    }
  }, [interfaces, scanInterface, scan, ui])

  useEffect(() => {
    if (selected.timestamp !== selectedTimestamp && selectedLoading) {
      ui.set({
        scanLoading: { [scanInterface]: false },
        scanTimestamp: { [scanInterface]: selected.timestamp },
      })
    }
  }, [selected.timestamp, selectedTimestamp, selectedLoading, scanInterface, ui])

  function interfaceType() {
    const i = interfaces.find(i => i.name === scanInterface)
    return (i ? i.type : '') as IInterfaceType
  }

  return (
    <>
      <section className={css.controls}>
        <div>
          <TextField
            select
            margin="dense"
            value={scanInterface}
            variant="filled"
            onChange={event => ui.set({ scanInterface: event.target.value as string })}
          >
            {interfaces.length ? (
              interfaces.map((i: IInterface) => (
                <MenuItem key={i.name} value={i.name}>
                  {i.type}
                </MenuItem>
              ))
            ) : (
              <MenuItem key={0} value={DEFAULT_INTERFACE}>
                Finding Network...
              </MenuItem>
            )}
          </TextField>
        </div>
        <Typography variant="caption">
          Scan your system and network <br />
          for open ports to host
        </Typography>
        <Button color="primary" variant="contained" onClick={() => scan(scanInterface)} disabled={selectedLoading}>
          {selectedLoading ? (
            <>
              Scanning
              <CircularProgress size={styles.fontSizes.lg} color="inherit" />
            </>
          ) : (
            'Scan'
          )}
        </Button>
      </section>
      <ScanNetwork data={selected.data || []} targets={targets} interfaceType={interfaceType()} privateIP={privateIP} />
      <section className={css.loading}>{noResults && 'No results'}</section>
    </>
  )
}

const useStyles = makeStyles({
  loading: {
    alignItems: 'center',
    flexDirection: 'column',
    color: styles.colors.grayLighter,
    fontSize: styles.fontSizes.xl,
  },
  controls: {
    paddingBottom: styles.spacing.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '& > div': { flexGrow: 1 },
    '& .MuiCircularProgress-root': { marginLeft: styles.spacing.md },
    '& .MuiButton-contained': { marginRight: 0 },
    '& .MuiFormControl-root': { width: 250 },
    '& .MuiTypography-root': { textAlign: 'right', marginRight: styles.spacing.md },
    '& samp': {
      fontSize: styles.fontSizes.sm,
      fontFamily: 'Roboto Mono',
      color: styles.colors.grayDark,
    },
  },
})
