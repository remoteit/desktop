import React from 'react'
import isEqual from 'lodash/isEqual'
import { defaultState } from '../models/devices'
import { selectApplicationTypesGrouped } from '../selectors/applications'
import { Stack, Divider, Tabs, Tab, TabProps } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { getDeviceModel } from '../selectors/devices'
import { Icon } from './Icon'

const SCREEN_VIEW_ID = 48

export const DevicesApplicationsBar: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { allTypes, activeTypes } = useSelector((state: ApplicationState) => ({
    allTypes: [...selectApplicationTypesGrouped(state)],
    activeTypes: getDeviceModel(state).applicationTypes,
  }))

  if (!allTypes.length) return null

  const hasScreenView = allTypes.findIndex(t => t.ids.includes(SCREEN_VIEW_ID))

  if (hasScreenView > -1) {
    allTypes.unshift(allTypes.splice(hasScreenView, 1)[0])
  }

  let selection = allTypes.findIndex(t => isEqual(activeTypes, t.ids))

  const update = async (applicationTypes?: number[]) => {
    await dispatch.devices.setPersistent({ applicationTypes, from: defaultState.from })
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
                <Icon name="android-screenview" size="sm" platformIcon currentColor />
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

const MasterTab = (props: TabProps) => (
  <>
    <Tab {...props} />
    <Divider
      orientation="vertical"
      sx={{
        height: '1.3em',
        alignSelf: 'center',
        bgcolor: 'grayLight.main',
        marginRight: 1.5,
        marginLeft: 1.5,
      }}
    />
  </>
)
