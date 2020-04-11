import React, { useState, useEffect } from 'react'
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
  const { scanData } = useSelector((state: ApplicationState) => state.backend)
  const [state, setState] = useState<boolean[]>([])
  const css = useStyles()
  let data: ITarget[] = scanData.localhost?.data[0][1].map(row => ({
    ...DEFAULT_TARGET,
    type: getTypeId(row[0]),
    port: row[0],
    name: row[1].replace(REGEX_NAME_SAFE, ''),
  }))

  useEffect(() => {
    emit('scan', 'localhost')
  }, [])

  useEffect(() => {
    if (scanData && data.length) {
      state.length = data.length
      state.fill(true)
      updateTargets()
    }
  }, [scanData])

  function updateTargets() {
    const selected = data.filter((_, key) => state[key])
    setSelected(selected)
    console.log('SELECTED', selected)
  }

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
          <ListItemText className={css.name} primary={data[key].name} />
          <Chip label={findType(data[key].type).name + ' - ' + data[key].port} size="small" />
        </ListItem>
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  item: { padding: 0, paddingRight: spacing.md },
  name: { width: '60%', flex: 'none' },
})
