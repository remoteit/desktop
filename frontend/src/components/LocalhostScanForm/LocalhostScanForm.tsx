import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_TARGET, REGEX_NAME_SAFE } from '../../constants'
import { List, ListItem, ListItemIcon, ListItemText, Chip, Checkbox, Typography } from '@material-ui/core'
import { getTypeId, findType, serviceTypes } from '../../services/serviceTypes'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'
import { emit } from '../../services/Controller'

type Props = {
  setSelected: (targets: ITarget[]) => void
  disabled: boolean
}

export const LocalhostScanForm: React.FC<Props> = ({ setSelected, disabled }) => {
  const scanData = useSelector((state: ApplicationState) =>
    state.backend.scanData.localhost?.data[0][1].map(row => ({
      ...DEFAULT_TARGET,
      type: getTypeId(row[0]),
      port: row[0],
      name: row[1].replace(REGEX_NAME_SAFE, ''),
    }))
  )
  const [state, setState] = useState<boolean[]>([])
  const css = useStyles()

  useEffect(() => {
    emit('scan', 'localhost')
  }, [])

  const updateTargets = useCallback(
    checked => {
      const selected = scanData.filter((_, key) => checked[key])
      console.log('selected', selected)
      setSelected(selected)
    },
    [scanData, setSelected]
  )

  // useEffect(() => {
  if (scanData && scanData.length !== state.length) {
    const checked = scanData.map(row => !!serviceTypes.find(st => st.defaultPort === row.port || 29999 === row.port)) // 29999 temp hack to have remoteit admin checked
    console.log('CHECKED', checked)
    setState(checked)
    updateTargets(checked)
  }
  // }, [scanData, setState, updateTargets])

  if (!scanData) return null

  return (
    <>
      <Typography variant="body2" color="textSecondary">
        Services
      </Typography>
      <List>
        {scanData.map((row, key) => (
          <ListItem
            key={key}
            button
            onClick={() => {
              state[key] = !state[key]
              setState([...state])
              updateTargets([...state])
            }}
            disabled={disabled}
            className={css.item}
          >
            <ListItemIcon>
              <Checkbox checked={state[key]} color="primary" />
            </ListItemIcon>
            <ListItemText className={css.name} primary={row.name} />
            <Chip label={findType(row.type).name + ' - ' + row.port} size="small" />
          </ListItem>
        ))}
      </List>
    </>
  )
}

const useStyles = makeStyles({
  item: { padding: 0, paddingRight: spacing.md },
  name: { width: '60%', flex: 'none' },
})
