import React, { useCallback, useMemo } from 'react'
import { useContainerWidth } from '../hooks/useContainerWidth'
import { MOBILE_WIDTH } from '../constants'
import { useTranslation } from 'react-i18next'
import browser from '../services/browser'
import { useLocation } from 'react-router-dom'
import { GUIDE_START_DATE } from '../constants'
import { DeviceListContext } from '../services/Context'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { DeviceListHeaderCheckbox } from './DeviceListHeaderCheckbox'
import { Box, Typography } from '@mui/material'
import { DeviceListItem } from './DeviceListItem'
import { Attribute } from './Attributes'
import { isOffline } from '../models/devices'
import { GuideBubble } from './GuideBubble'
import { DeviceLoadMore } from './LoadMore'
import { GridList } from './GridList'

export interface DeviceListProps {
  attributes: Attribute[]
  required: Attribute
  connections: { [deviceID: string]: IConnection[] }
  columnWidths: ILookup<number>
  fetching?: boolean
  devices?: IDevice[]
  restore?: boolean
  select?: boolean
  selected?: string[]
}

type RowProps = {
  device: IDevice
  deviceConnections?: IConnection[]
  attributes: Attribute[]
  required: Attribute
  restore?: boolean
  canRestore: boolean
  select?: boolean
  mobile: boolean
  disabled?: boolean
  showGuide: boolean
  onClick?: () => void
}

// Only the first row shows the guide, so it owns the translation subscription
// rather than every row in the list paying for one.
const DeviceListGuide: React.FC = () => {
  const { t } = useTranslation()
  return (
    <GuideBubble
      enterDelay={400}
      guide="deviceList"
      placement="bottom"
      startDate={GUIDE_START_DATE}
      added={GUIDE_START_DATE}
      queueAfter={browser.hasBackend ? 'registerMenu' : 'addDevice'}
      instructions={
        <>
          <Typography variant="h3" gutterBottom>
            <b>{t('deviceList.guideTitle', 'Access a device')}</b>
          </Typography>
          <Typography variant="body2" gutterBottom>
            {t(
              'deviceList.guideHosting',
              'A device can host its own applications (services), or it can host another service on its local network.'
            )}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {t('deviceList.guideSelect', 'Select a device to connect to a service, or configure it.')}
          </Typography>
        </>
      }
    />
  )
}

const DeviceListRow: React.FC<RowProps> = React.memo(
  ({
    device,
    deviceConnections,
    attributes,
    required,
    restore,
    canRestore,
    select,
    mobile,
    disabled,
    showGuide,
    onClick,
  }) => {
    const value = useMemo(
      () => ({ device, connections: deviceConnections, required, attributes }),
      [device, deviceConnections, required, attributes]
    )
    return (
      <DeviceListContext.Provider value={value}>
        <DeviceListItem
          restore={restore && canRestore}
          select={select}
          mobile={mobile}
          onClick={onClick}
          disabled={disabled}
        />
        {showGuide && <DeviceListGuide />}
      </DeviceListContext.Provider>
    )
  }
)

export const DeviceList: React.FC<DeviceListProps> = ({
  attributes,
  required,
  devices = [],
  connections = {},
  columnWidths,
  fetching,
  restore,
  select,
}) => {
  const location = useLocation()
  const { containerRef, containerWidth } = useContainerWidth()
  // The panel this list sits in, not the whole app: a list squeezed into a narrow panel
  // is cramped even when the app overall is nowhere near mobile.
  const mobile = containerWidth < MOBILE_WIDTH
  const dispatch = useDispatch<Dispatch>()
  const onFirstClick = useCallback(() => dispatch.ui.pop('deviceList'), [dispatch])
  const isScriptsPath = location.pathname.includes('scripts')

  /* Measured wrapper: `width: 100%` resolves against the scroll container, so it reports
     the space this list ACTUALLY has. The GridList inside is deliberately wider than the
     container when columns overflow — that IS the horizontal scroll — so measuring the
     list itself would report content width instead. Overflow still reaches the scroll
     container, and Body's first-child rule now applies to this box just the same. */
  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      <GridList
        {...{ attributes, required, fetching, columnWidths, mobile }}
        headerIcon={<DeviceListHeaderCheckbox select={select} devices={devices} />}
        headerContextData={{ device: devices[0] }}
        headerContextProvider={DeviceListContext.Provider}
      >
        {devices?.map((device, index) => {
          const canRestore = isOffline(device) && !device.shared
          if (restore && !canRestore) return null
          const disabled = select && !device.scriptable && isScriptsPath
          return (
            <DeviceListRow
              key={device.id}
              device={device}
              deviceConnections={connections[device.id]}
              attributes={attributes}
              required={required}
              restore={restore}
              canRestore={canRestore}
              select={select}
              mobile={mobile}
              disabled={disabled}
              showGuide={!index}
              onClick={index ? undefined : onFirstClick}
            />
          )
        })}
        <DeviceLoadMore />
      </GridList>
    </Box>
  )
}
