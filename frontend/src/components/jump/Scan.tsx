import React, { useEffect, useState } from 'react'
import { Button, CircularProgress, TextField, MenuItem, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import ScanNetwork from './ScanNetwork'
import styles from '../../styling'

type Props = {
  data: IScanData
  onAdd: (target: ITarget) => void
  onScan: (network: string) => void
  interfaces: IInterface[]
  targets: ITarget[]
  privateIP: string
}

const Scan: React.FC<Props> = ({ data, onAdd, onScan, interfaces, targets, privateIP }) => {
  const css = useStyles()
  const [timestamp, setTimestamp] = useState<{ [interfaceName: string]: number }>({})
  const [loading, setLoading] = useState<{ [interfaceName: string]: boolean }>({})
  const [interfaceName, setInterfaceName] = useState<string>('')
  const selected = data[interfaceName] || {}
  const selectedTimestamp = timestamp[interfaceName]
  const selectedLoading = loading[interfaceName]
  const noResults = selected.data && !selected.data.length

  useEffect(() => {
    if (interfaces.length && !interfaceName) setInterfaceName(interfaces[0].name)
  }, [interfaces, interfaceName])

  useEffect(() => {
    if (selected.timestamp !== selectedTimestamp && selectedLoading) {
      setLoading({ [interfaceName]: false })
      setTimestamp({ [interfaceName]: selected.timestamp })
    }
  }, [selected.timestamp, selectedTimestamp, selectedLoading, interfaceName])

  function interfaceType() {
    const i = interfaces.find(i => i.name === interfaceName)
    return (i ? i.type : '') as IInterfaceType
  }

  return (
    <>
      <Typography variant="subtitle1">Network Scan</Typography>
      <section className={css.controls}>
        <TextField
          select
          value={interfaceName}
          variant="filled"
          onChange={event => setInterfaceName(event.target.value as string)}
        >
          {interfaces.map((i: IInterface) => (
            <MenuItem key={i.name} value={i.name}>
              {i.type} &nbsp; <samp>{i.name}</samp>
            </MenuItem>
          ))}
        </TextField>
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            onScan(interfaceName)
            setTimestamp({ [interfaceName]: selected.timestamp })
            setLoading({ [interfaceName]: true })
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
    </>
  )
}

export default Scan

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
    justifyContent: 'space-between',
    '& .MuiCircularProgress-root': {
      marginLeft: styles.spacing.md,
    },
    '& .MuiButton-contained': {
      marginRight: 0,
    },
    '& .MuiFormControl-root': {
      width: 250,
    },
  },
})
