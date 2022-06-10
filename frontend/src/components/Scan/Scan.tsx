import React, { useEffect, useCallback, useMemo } from 'react'
import { DEFAULT_INTERFACE } from '../../models/ui'
import { makeStyles, Button, TextField, MenuItem } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { spacing, fontSizes } from '../../styling'
import { ScanNetwork } from '../ScanNetwork'
import { Container } from '../Container'
import { Gutters } from '../Gutters'
import { Icon } from '../Icon'
import { emit } from '../../services/Controller'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  data: IScanData
  interfaces: IInterface[]
  services: IService[]
  privateIP: string
}

export const Scan: React.FC<Props> = ({ data, interfaces, services, privateIP }) => {
  const css = useStyles()
  const { ui } = useDispatch<Dispatch>()
  const { scanLoading, scanTimestamp, scanInterface } = useSelector((state: ApplicationState) => state.ui)

  const selected = useMemo(() => data[scanInterface] || {}, [data, scanInterface])

  const selectedTimestamp = scanTimestamp[scanInterface]
  const selectedLoading = scanLoading[scanInterface]
  const noResults = selected.data && !selected.data.length

  const scan = useCallback(
    (i: string) => {
      emit('scan', i)
      ui.set({
        scanLoading: { [i]: true },
        scanTimestamp: { [i]: selected.timestamp },
      })
      analyticsHelper.track('networkScan')
    },
    [selected, ui]
  )

  useEffect(() => {
    if (interfaces.length && scanInterface === DEFAULT_INTERFACE) {
      let name = interfaces[0].name
      interfaces.forEach(i => i.active && (name = i.name))
      ui.set({ scanInterface: name })
      if (!selected.data) scan(name) // auto scan
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
    <Container
      gutterBottom
      header={
        <Gutters className={css.controls}>
          <div>
            <TextField
              select
              hiddenLabel
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
          <Button color="primary" variant="contained" onClick={() => scan(scanInterface)} disabled={selectedLoading}>
            {selectedLoading ? (
              <>
                Scanning
                <Icon name="spinner-third" type="solid" spin inline />
              </>
            ) : (
              'Scan'
            )}
          </Button>
        </Gutters>
      }
    >
      <ScanNetwork
        data={selected.data || []}
        services={services}
        interfaceType={interfaceType()}
        privateIP={privateIP}
      />
      <section className={css.loading}>{noResults && 'No results'}</section>
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  loading: {
    alignItems: 'center',
    flexDirection: 'column',
    color: palette.grayLighter.main,
    fontSize: fontSizes.xl,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
    '& > div': { flexGrow: 1 },
    '& .MuiCircularProgress-root': { marginLeft: spacing.md },
    '& .MuiButton-contained': { marginRight: 0 },
    '& .MuiFormControl-root': { width: 250 },
    '& .MuiTypography-root': { textAlign: 'right', marginRight: spacing.md, marginLeft: spacing.md, maxWidth: 150 },
    '& samp': {
      fontSize: fontSizes.sm,
      fontFamily: 'Roboto Mono',
      color: palette.grayDark.main,
    },
  },
}))
