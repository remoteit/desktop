import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_SERVICE, REGEX_NAME_SAFE } from '@common/constants'
import { List, Chip, Typography } from '@mui/material'
import { getType, findType } from '../../models/applicationTypes'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../../store'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { LoadingMessage } from '../LoadingMessage'
import { IconButton } from '../../buttons/IconButton'
import { spacing } from '../../styling'
import { Title } from '../Title'
import { emit } from '../../services/Controller'

type Props = {
  onSelect: (services: IService[]) => void
}

export const LocalhostScanForm: React.FC<Props> = ({ onSelect }) => {
  const { t } = useTranslation()
  const { ui } = useDispatch<Dispatch>()
  const [state, setState] = useState<boolean[]>([])
  const { applicationTypes, timestamp, loading, scanTimestamp, scanData } = useSelector((state: State) => {
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
          ...DEFAULT_SERVICE,
          typeID: getType(applicationTypes, row[0]),
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

  if (!scanData) return <LoadingMessage message={t('localhostScanForm.scanning', 'Scanning...')} />

  return (
    <>
      <Typography sx={{ display: 'flex', alignItems: 'center' }} variant="body2" color="textSecondary">
        <Title>{t('localhostScanForm.title', 'Select any found services to auto setup')}</Title>
        <IconButton
          icon="radar"
          color="gray"
          loading={loading}
          onClick={scan}
          title={t('localhostScanForm.rescan', 'Rescan')}
          size="lg"
        />
      </Typography>
      <List>
        {scanData.map((row, key) => (
          <ListItemCheckbox
            dense
            key={key}
            label={row.name}
            height={30}
            checked={state[key]}
            onClick={() => {
              state[key] = !state[key]
              setState([...state])
              updateTargets([...state])
            }}
          >
            <Chip
              sx={{ marginRight: `${spacing.md}px` }}
              label={t('localhostScanForm.typeAndPort', {
                type: findType(applicationTypes, row.typeID).name,
                port: row.port,
                defaultValue: '{{type}} - {{port}}',
              })}
              size="small"
            />
          </ListItemCheckbox>
        ))}
      </List>
      <br />
      <Typography variant="caption">
        {t('localhostScanForm.footerNote', 'You can always add additional services after registration.')}
      </Typography>
    </>
  )
}

