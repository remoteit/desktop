import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_TARGET, REGEX_NAME_SAFE } from '../../constants'
import { List, ListItem, ListItemIcon, ListItemText, Chip, Checkbox } from '@material-ui/core'
import { getTypeId, findType } from '../../services/serviceTypes'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'
import { emit } from '../../services/Controller'

type Props = {
  setSelected: (targets: ITarget[]) => void
}

export const LocalhostScanForm: React.FC<Props> = ({ setSelected }) => {
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

  const updateTargets = useCallback(() => {
    const selected = scanData.filter((_, key) => state[key])
    setSelected(selected)
  }, [scanData, setSelected, state])

  useEffect(() => {
    if (scanData && scanData.length !== state.length) {
      state.length = scanData.length
      state.fill(true)
      updateTargets()
    }
  }, [scanData, state, updateTargets])

  if (!scanData) return null

  return (
    <List>
      {state.map((checked, key) => (
        <ListItem
          key={key}
          button
          onClick={() => {
            state[key] = !state[key]
            setState([...state])
            updateTargets()
          }}
          className={css.item}
        >
          <ListItemIcon>
            <Checkbox checked={checked} color="primary" />
          </ListItemIcon>
          <ListItemText className={css.name} primary={scanData[key].name} />
          <Chip label={findType(scanData[key].type).name + ' - ' + scanData[key].port} size="small" />
        </ListItem>
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  item: { padding: 0, paddingRight: spacing.md },
  name: { width: '60%', flex: 'none' },
})
