import React, { useEffect, useState } from 'react'
import { selectActiveAttributes, getVisibleDevices, getDeviceModel } from '../../selectors/devices'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { removeObject } from '../../helpers/utilHelper'
import { restoreAttributes } from '../../components/Attributes'
import { selectPermissions } from '../../selectors/organizations'
import { getConnectionsLookup } from '../../selectors/connections'
import { DialogNewFeatures } from '../../components/DialogNewFeatures'
import { ApplicationState } from '../../store'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { LoadingMessage } from '../../components/LoadingMessage'
import { DevicesDrawers } from '../../components/DevicesDrawers'
import { DeviceList } from '../../components/DeviceList'
import { ServiceList } from '../../components/ServiceList'
import { DevicesHeader } from '../../components/DevicesHeader'

type Props = { restore?: boolean; select?: boolean }

export const DevicesPage: React.FC<Props> = ({ restore, select }) => {
  const history = useHistory()
  const [initLoad, setInitLoad] = useState<boolean>(false)
  const {
    selected,
    devices,
    connections,
    attributes,
    required,
    fetching,
    initialized,
    permissions,
    columnWidths,
    applicationTypes,
  } = useSelector((state: ApplicationState) => {
    const deviceModel = getDeviceModel(state)
    const all = selectActiveAttributes(state)
    const [required, rest] = removeObject(all, a => a.required === true)
    return {
      attributes: restore ? restoreAttributes : rest,
      required: required || all[0],
      selected: state.ui.selected,
      fetching: deviceModel.fetching || state.ui.fetching,
      initialized: deviceModel.initialized,
      permissions: selectPermissions(state),
      columnWidths: state.ui.columnWidths,
      devices: getVisibleDevices(state),
      connections: getConnectionsLookup(state),
      applicationTypes: deviceModel.applicationTypes,
    }
  })

  const shouldRedirect = initLoad && permissions?.includes('MANAGE')

  useEffect(() => {
    if (!initialized) setInitLoad(true)
    if (shouldRedirect && !devices.length) {
      history.push('/add')
    }
  }, [initialized])

  return (
    <DevicesDrawers>
      <DevicesHeader selected={selected} select={select} devices={devices}>
        {(fetching || shouldRedirect) && !devices.length ? (
          <LoadingMessage message={'Loading... ' + fetching + ' ' + shouldRedirect} spinner={false} />
        ) : !devices.length ? (
          <DeviceListEmpty />
        ) : applicationTypes?.length ? (
          <ServiceList {...{ applicationTypes, attributes, required, devices, connections, columnWidths, fetching }} />
        ) : (
          <DeviceList
            {...{ attributes, required, devices, connections, columnWidths, fetching, restore, select, selected }}
          />
        )}
      </DevicesHeader>
      <DialogNewFeatures />
    </DevicesDrawers>
  )
}
