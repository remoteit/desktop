import React, { useEffect, useState } from 'react'
import { Button, CircularProgress, FormControl, Select, MenuItem } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { ITarget, IScanData, IInterface, IInterfaceType } from '../common/types'
import ScanNetwork from './ScanNetwork'
import styles from '../styling/styling'

type Props = {
  data: IScanData
  onAdd: (target: ITarget) => void
  onScan: (network: string) => void
  interfaces: IInterface[]
  targets: ITarget[]
}

const Scan: React.FC<Props> = ({ data, onAdd, onScan, interfaces, targets }) => {
  const css = useStyles()
  const [loading, setLoading] = useState<{ [interfaceName: string]: boolean }>({})
  const [interfaceName, setInterfaceName] = useState<string>('')
  const selectedData = data[interfaceName]
  const selectedLoading = loading[interfaceName]
  const noResults = selectedData && !selectedData.length

  useEffect(() => {
    if (interfaces.length && !interfaceName) setInterfaceName(interfaces[0].name)
  }, [interfaces, interfaceName])

  useEffect(() => {
    if (selectedData && selectedLoading) setLoading({ [interfaceName]: false })
  }, [selectedData, selectedLoading, interfaceName])

  function interfaceType() {
    const i = interfaces.find(i => i.name === interfaceName)
    return (i ? i.type : '') as IInterfaceType
  }

  return (
    <>
      <h2>Network Scan</h2>
      <section className={css.controls}>
        <FormControl>
          <Select value={interfaceName} onChange={event => setInterfaceName(event.target.value as string)}>
            {interfaces.map((i: IInterface) => (
              <MenuItem key={i.name} value={i.name}>
                {i.type} &nbsp; <samp>{i.name}</samp>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            onScan(interfaceName)
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
      <ScanNetwork onAdd={onAdd} data={selectedData || []} targets={targets} interfaceType={interfaceType()} />
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
