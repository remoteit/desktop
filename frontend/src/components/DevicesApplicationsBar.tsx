import React from 'react'
import { defaultState } from '../models/devices'
import { selectApplicationTypes } from '../selectors/applications'
import { Divider, Tabs, Tab, TabProps } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { getDeviceModel } from '../selectors/devices'

export const DevicesApplicationsBar: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { applications, active } = useSelector((state: ApplicationState) => ({
    applications: selectApplicationTypes(state),
    active: getDeviceModel(state).applicationType,
  }))

  if (!applications.length) return null

  let value = applications.findIndex(app => app.id === active)
  value = value === -1 ? 0 : value + 1

  const update = async applicationType => {
    await dispatch.devices.setPersistent({ applicationType, from: defaultState.from })
    await dispatch.devices.fetchList()
  }

  return (
    <Tabs
      value={value}
      variant="scrollable"
      TabIndicatorProps={{ sx: { display: 'none' } }}
      sx={{ marginX: 3, marginY: 1 }}
    >
      <MasterTab label="All Services" onClick={() => update(undefined)} />
      {applications.map(app => (
        <Tab key={app.id} label={app.name} onClick={() => update(app.id)} />
      ))}
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
