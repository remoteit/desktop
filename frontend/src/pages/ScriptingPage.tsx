import React, { useEffect, useState } from 'react'
import { State } from '../store'
import { useHistory } from 'react-router-dom'
import { removeObject } from '../helpers/utilHelper'
import { useSelector } from 'react-redux'
import { selectScripts } from '../selectors/scripts'
import { scriptAttributes } from '../components/ScriptAttributes'
import { selectDeviceListAttributes } from '../selectors/devices'
import { selectPermissions } from '../selectors/organizations'
import { restoreAttributes } from '../components/Attributes'
import { ScriptsHeader } from '../components/ScriptsHeader'
import { DeviceListEmpty } from '../components/DeviceListEmpty'
import { LoadingMessage } from '../components/LoadingMessage'
import { ScriptList } from '../components/ScriptList'

type Props = { restore?: boolean; select?: boolean }

export const ScriptingPage: React.FC<Props> = ({ restore, select }) => {
  const scripts = useSelector(selectScripts)
  const [required, attributes] = removeObject(scriptAttributes, a => a.required === true)

  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const selected = useSelector((state: State) => state.ui.selected)
  const fetching = useSelector((state: State) => state.ui.fetching || state.scripts.fetching)

  return (
    <ScriptsHeader selected={selected} select={select}>
      {fetching ? (
        <LoadingMessage message="Loading..." spinner={false} />
      ) : !scripts.length ? (
        <DeviceListEmpty />
      ) : (
        <ScriptList
          attributes={restore ? restoreAttributes : attributes}
          {...{ required, scripts, columnWidths, fetching, restore, select, selected }}
        />
      )}
    </ScriptsHeader>
  )
}
