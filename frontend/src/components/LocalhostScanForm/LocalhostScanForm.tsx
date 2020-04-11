import { DEFAULT_TARGET, REGEX_NAME_SAFE } from '../../constants'
import { List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Checkbox } from '@material-ui/core'
import React, { useState, useEffect } from 'react'
import { getTypeId, findType } from '../../services/serviceTypes'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { makeStyles } from '@material-ui/styles'
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
    if (scanData) {
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
          dense
          button
          onClick={() => {
            state[key] = !state[key]
            setState([...state])
            updateTargets()
          }}
        >
          <ListItemIcon>
            <Checkbox checked={checked} color="primary" />
          </ListItemIcon>
          <ListItemText primary={data[key].name} secondary={findType(data[key].type).name} id={data[key].name} />
          <ListItemSecondaryAction>Port {data[key].port}</ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  indent: {},
})
