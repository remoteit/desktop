import React, { useState, useCallback } from 'react'
import { DEFAULT_TARGET, REGEX_NAME_SAFE } from '../../shared/constants'
import { List, ListItem, ListItemIcon, ListItemText, Chip, Checkbox, Typography } from '@material-ui/core'
import { getTypeId, findType, serviceTypes } from '../../services/serviceTypes'
import { LoadingMessage } from '../LoadingMessage'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import { spacing } from '../../styling'

type Props = {
  setSelected: (targets: ITarget[]) => void
  loading?: boolean
}

export const LocalhostScanForm: React.FC<Props> = ({ setSelected, loading }) => {
  const [state, setState] = useState<boolean[]>([])
  const css = useStyles()
  const scanData = useSelector((state: ApplicationState) => {
    const {localhost} =  state.backend.scanData

    return localhost?.data[0] && localhost?.data[0][1].map(row => ({
        ...DEFAULT_TARGET,
        type: getTypeId(row[0]),
        port: row[0],
        name: row[1].replace(REGEX_NAME_SAFE, ''),
      }))
  })

  const updateTargets = useCallback(
    checked => {
      const selected = scanData.filter((_, key) => checked[key])
      setSelected(selected)
    },
    [scanData, setSelected]
  )

  if (scanData && scanData.length !== state.length) {
    const checked = scanData.map(row => !!serviceTypes.find(st => st.defaultPort === row.port || 29999 === row.port)) // 29999 temp hack to have remoteit admin checked
    setState(checked)
    updateTargets(checked)
  }

  if (loading) return <LoadingMessage message="Scanning local services" />

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
