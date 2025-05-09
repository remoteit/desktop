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
  const manager = role.permissions.includes('MANAGE')
  const savedForm = useSelector((state: State) => state.ui.scriptForm)
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const device = useSelector((state: State) =>
    selectedIds.length === 1 ? selectDevice(state, undefined, selectedIds[0]) : undefined
  )
  const defaultForm: IFileForm = { ...role, ...initialForm }
  const [form, setForm] = useState<IFileForm>({
    ...defaultForm,
    ...savedForm,
    access: selectedIds.length ? 'SELECTED' : defaultForm.access,
  })

  return (
    <Body center={center} inset gutterTop gutterBottom>
      <Box width="100%" maxWidth={600}>
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
        <ScriptForm
          form={form}
          onChange={setForm}
          selectedIds={selectedIds}
          defaultForm={defaultForm}
          manager={manager}
        />
      </Box>
    </Body>
  )
}
