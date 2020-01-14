import React, { useEffect, useState } from 'react'
import { Button, CircularProgress, TextField, MenuItem, Typography } from '@material-ui/core'
import { Container } from '../Container'
import { makeStyles } from '@material-ui/styles'
import { ScanNetwork } from '../ScanNetwork'
import styles from '../../styling'

type Props = {
  data: IScanData
  onAdd: (target: ITarget) => void
  onScan: (network: string) => void
  interfaces: IInterface[]
  targets: ITarget[]
  privateIP: string
}

export const Scan: React.FC<Props> = ({ data, onAdd, onScan, interfaces, targets, privateIP }) => {
  const css = useStyles()
  const [timestamp, setTimestamp] = useState<{ [interfaceName: string]: number }>({})
  const [loading, setLoading] = useState<{ [interfaceName: string]: boolean }>({})
  const [activeInterface, setActiveInterface] = useState<string>('searching')
  const selected = data[activeInterface] || {}
  const selectedTimestamp = timestamp[activeInterface]
  const selectedLoading = loading[activeInterface]
  const noResults = selected.data && !selected.data.length

  useEffect(() => {
    if (interfaces.length && activeInterface === 'searching') setActiveInterface(interfaces[0].name)
  }, [interfaces, activeInterface])

  useEffect(() => {
    if (selected.timestamp !== selectedTimestamp && selectedLoading) {
      setLoading({ [activeInterface]: false })
      setTimestamp({ [activeInterface]: selected.timestamp })
    }
  }, [selected.timestamp, selectedTimestamp, selectedLoading, activeInterface])

  function interfaceType() {
    const i = interfaces.find(i => i.name === activeInterface)
    return (i ? i.type : '') as IInterfaceType
  }

  return (
    <Container header={<Typography variant="h1">Network Scan</Typography>}>
      <section className={css.controls}>
        <div>
          <TextField
            select
            value={activeInterface}
            variant="filled"
            onChange={event => setActiveInterface(event.target.value as string)}
          >
            {interfaces.length ? (
              interfaces.map((i: IInterface) => (
                <MenuItem key={i.name} value={i.name}>
                  {i.type} &nbsp; <samp>{i.name}</samp>
                </MenuItem>
              ))
            ) : (
              <MenuItem key={0} value="searching">
                Finding Network...
              </MenuItem>
            )}
          </TextField>
        </div>
        <Typography variant="caption">
          Scan your systen and network <br />
          for open ports to host
        </Typography>
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            onScan(activeInterface)
            setTimestamp({ [activeInterface]: selected.timestamp })
            setLoading({ [activeInterface]: true })
          }}
          disabled={selectedLoading}
        >
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
      <ScanNetwork
        onAdd={onAdd}
        data={selected.data || []}
        targets={targets}
        interfaceType={interfaceType()}
        privateIP={privateIP}
      />
      <section className={css.loading}>{noResults && 'No results'}</section>
    </Container>
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
