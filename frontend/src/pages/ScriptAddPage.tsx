import React, { useState } from 'react'
import { State } from '../store'
import { Typography, Box } from '@mui/material'
import { TargetPlatform } from '../components/TargetPlatform'
import { selectDevice } from '../selectors/devices'
import { initialForm } from '../models/files'
import { selectRole } from '../selectors/organizations'
import { ScriptForm } from '../components/ScriptForm'
import { useSelector } from 'react-redux'
import { Body } from '../components/Body'

type Props = { center?: boolean }

export const ScriptAddPage: React.FC<Props> = ({ center }) => {
  const role = useSelector(selectRole)
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const device = useSelector((state: State) =>
    selectedIds.length === 1 ? selectDevice(state, undefined, selectedIds[0]) : undefined
  )
  const defaultForm: IFileForm = {
    ...role,
    ...initialForm,
    access: selectedIds.length ? 'SELECTED' : 'ALL',
  }
  const [form, setForm] = useState<IFileForm>(defaultForm)

  return (
    <Body center={center} inset gutterTop gutterBottom>
      <Box>
        {device && form.access === 'SELECTED' ? (
          <>
            <Typography variant="body2" color="grayDark.main" component="p" marginBottom={1}>
              Add and run a script on
            </Typography>
            <Typography variant="h1" gutterBottom>
              <TargetPlatform id={device?.targetPlatform} size="xl" inlineLeft />
              {device.name}
            </Typography>
          </>
        ) : (
          <Typography variant="h1" gutterBottom>
            Add and run a script
          </Typography>
        )}

        <ScriptForm form={form} onChange={setForm} selectedIds={selectedIds} defaultForm={defaultForm} />
      </Box>
    </Body>
  )
}
