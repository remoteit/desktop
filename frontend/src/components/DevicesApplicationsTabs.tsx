import React from 'react'
import isEqual from 'lodash/isEqual'
import { Dispatch } from '../store'
import { defaultState } from '../models/devices'
import { useSelector, useDispatch } from 'react-redux'
import { selectApplicationTypesGrouped } from '../selectors/applications'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { Stack, Tabs, Tab } from '@mui/material'
import { MasterTab } from './MasterTab'
import { Icon } from './Icon'

const SCREEN_VIEW_ID = 48

export const DevicesApplicationsTabs: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const allTypes = [...useSelector(selectApplicationTypesGrouped)]
  const { applicationTypes } = useSelector(selectDeviceModelAttributes)

  if (!allTypes.length) return null

  let selection = allTypes.findIndex(t => isEqual(applicationTypes, t.ids))

  const update = async (updated?: number[]) => {
    await dispatch.devices.set({ applicationTypes: updated, from: defaultState.from })
    await dispatch.devices.fetchList()
  }

  return (
    <Tabs
      value={selection + 1}
      variant="scrollable"
      TabIndicatorProps={{ sx: { display: 'none' } }}
      sx={{ marginX: 3, marginY: 1 }}
    >
      <MasterTab label="All Services" onClick={() => update(undefined)} />
      {allTypes.map(app => {
        return app.ids.includes(SCREEN_VIEW_ID) ? (
          <Tab
            key={app.ids.toString()}
            label={
              <Stack flexDirection="row" alignItems="center">
                <Icon name="android-screenview" size="xxs" platformIcon currentColor />
                &nbsp; ScreenView
              </Stack>
            }
            onClick={() => update([SCREEN_VIEW_ID])}
          />
        ) : (
          <Tab key={app.ids.toString()} label={app.name} onClick={() => update(app.ids)} />
        )
      })}
    </Tabs>
  )
}
