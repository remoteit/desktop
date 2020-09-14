import React, { useState, useCallback } from 'react'
import { DEFAULT_TARGET, REGEX_NAME_SAFE } from '../../shared/constants'
import { List, Chip, Typography } from '@material-ui/core'
import { getTypeId, findType } from '../../models/applicationTypes'
import { LoadingMessage } from '../LoadingMessage'
import { ListItemCheckbox } from '../ListItemCheckbox'
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
  const { applicationTypes, scanData } = useSelector((state: ApplicationState) => {
    const { localhost } = state.backend.scanData
    const applicationTypes = state.applicationTypes.all
    return {
      applicationTypes,
      scanData:
        localhost?.data[0] &&
        localhost?.data[0][1].map(row => ({
          ...DEFAULT_TARGET,
          type: getTypeId(applicationTypes, row[0]),
          port: row[0],
          name: row[1].replace(REGEX_NAME_SAFE, ''),
        })),
    }
  })

  const updateTargets = useCallback(
    checked => {
      const selected = scanData.filter((_, key) => checked[key])
      setSelected(selected)
    },
    [scanData, setSelected]
  )

  if (scanData && scanData.length !== state.length) {
    const checked = scanData.map(row => !!applicationTypes.find(t => t.port === row.port))
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
      <List className="collapseList">
        {scanData.map((row, key) => (
          <ListItemCheckbox
            key={key}
            label={row.name}
            checked={state[key]}
            onClick={() => {
              state[key] = !state[key]
              setState([...state])
              updateTargets([...state])
            }}
          >
            <Chip
              className={css.chip}
              label={findType(applicationTypes, row.type).name + ' - ' + row.port}
              size="small"
            />
          </ListItemCheckbox>
        ))}
      </List>
    </>
  )
}

const useStyles = makeStyles({
  chip: { marginRight: spacing.md },
})
