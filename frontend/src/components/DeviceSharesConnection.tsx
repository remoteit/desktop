import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { Box, Button } from '@mui/material'
import { useDeviceCarries, setDeviceCarries } from '../hooks/useDeviceCarries'
import { ListItemSetting } from './ListItemSetting'
import { MakeRunDialog } from './MakeRunDialog'
import { StateWord } from './DeviceSettingRow'

export const DeviceSharesConnection: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const carries = useDeviceCarries(device)
  const [making, setMaking] = useState<'exit' | 'proxy'>()
  const manage = device.permissions.includes('MANAGE') && !device.shared

  if (carries === undefined || device.virtual) return null

  if (carries)
    return (
      <ListItemSetting
        icon="door-open"
        label={t('deviceShares.label', 'Shares its connection')}
        subLabel={t('deviceShares.onNote', 'This device carries an exit or a proxy server.')}
        secondaryContent={<StateWord on />}
        secondaryContentWidth="130px"
        button={t('deviceShares.open', 'Open')}
        onButtonClick={() => history.push(`/devices/${device.id}/exit`)}
      />
    )

  return (
    <>
      <ListItemSetting
        icon="door-open"
        label={t('deviceShares.label', 'Shares its connection')}
        subLabel={
          <>
            {t('deviceShares.offNote', 'Other devices could send traffic out through this one.')}
            {manage && (
              <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginTop: 1 }}>
                <Button size="small" variant="outlined" onClick={() => setMaking('exit')} data-make="exit">
                  {t('deviceRuns.setUpExit', 'Set up exit')}
                </Button>
                <Button size="small" variant="outlined" onClick={() => setMaking('proxy')} data-make="proxy">
                  {t('deviceRuns.setUpProxy', 'Set up proxy server')}
                </Button>
              </Box>
            )}
          </>
        }
        secondaryContent={<StateWord on={false} />}
        secondaryContentWidth="60px"
      />
      {making && device.owner && (
        <MakeRunDialog
          kind={making}
          device={{ id: device.id, name: device.name, ownerId: device.owner.id }}
          onClose={() => setMaking(undefined)}
          onDone={runs => {
            setMaking(undefined)
            setDeviceCarries(device.id, runs)
            history.push(`/devices/${device.id}/exit`)
          }}
        />
      )}
    </>
  )
}
