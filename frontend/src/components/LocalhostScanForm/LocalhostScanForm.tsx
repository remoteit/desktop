import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_TARGET, REGEX_NAME_SAFE } from '../../shared/constants'
import { List, Chip, Typography } from '@material-ui/core'
import { getTypeId, findType } from '../../models/applicationTypes'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { IconButton } from '../../buttons/IconButton'
import { makeStyles } from '@material-ui/core/styles'
import { spacing } from '../../styling'
import { Title } from '../Title'
import { emit } from '../../services/Controller'

type Props = {
  onSelect: (targets: ITarget[]) => void
}

export const LocalhostScanForm: React.FC<Props> = ({ onSelect }) => {
  const css = useStyles()
  const { ui } = useDispatch<Dispatch>()
  const [state, setState] = useState<boolean[]>([])
  const { applicationTypes, timestamp, loading, scanTimestamp, scanData } = useSelector((state: ApplicationState) => {
    const { localhost } = state.backend.scanData
    const applicationTypes = state.applicationTypes.all
    return {
      applicationTypes,
      timestamp: state.ui.scanTimestamp.localhost,
      loading: state.ui.scanLoading.localhost,
      scanTimestamp: localhost?.timestamp,
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
      onSelect(selected)
    },
    [scanData, onSelect]
  )

  const scan = () => {
    ui.set({ scanLoading: { localhost: true } })
    emit('scan', 'localhost')
  }

  useEffect(() => {
    scan()
  }, [])

  useEffect(() => {
    if (scanTimestamp !== timestamp && loading) {
      ui.set({
        scanLoading: { localhost: false },
        scanTimestamp: { localhost: scanTimestamp },
      })
    }
  }, [scanTimestamp, timestamp, loading])

  useEffect(() => {
    if (scanData && scanData.length !== state.length) {
      const checked = scanData.map(row => !!applicationTypes.find(t => t.port === row.port))
      setState(checked)
      updateTargets(checked)
    }
  }, [applicationTypes, scanData])

  if (!scanData) return null

  return (
    <>
      <Typography className={css.body} variant="body2" color="textSecondary">
        <Title>Services</Title>
        <IconButton icon="radar" color="gray" loading={loading} onClick={scan} title="re-scan" />
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
  body: { display: 'flex', alignItems: 'center' },
})
