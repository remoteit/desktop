import { Divider, List, Typography } from '@material-ui/core'
import React, { useEffect } from 'react'
import { ListItemSetting } from '../ListItemSetting'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { ShareSaveActions } from './ContactCardActions'
import { useHistory, useParams, useLocation } from 'react-router-dom'
import { useSelector } from '../../hooks/reactReduxHooks'
import { ApplicationState } from '../../store'

export interface SharingDetails {
  access: SharingAccess
  contacts: string[]
  deviceID?: string
}

export interface SharingAccess {
  scripting: boolean
  services: string[]
}

export function SharingForm({
  onChange,
  device,
  scripting,
  selectedServices,
  update,
  share,
}: {
  onChange: (access: SharingAccess) => void
  device: IDevice
  scripting: boolean
  selectedServices: string[]
  update: () => void
  share: () => void
}): JSX.Element {
  const history = useHistory()
  const location = useLocation()
  const { email = '' } = useParams()
  const { saving } = useSelector((state: ApplicationState) => state.shares)

  const handleChangeServices = (services: string[]) => {
    onChange({ scripting, services })
  }

  useEffect(() => {
    const crumbs = location.pathname.substr(1).split('/')
    crumbs[2] !== 'users' && handleChangeServices([crumbs[2]])
  }, [])

  const handleChangeScripting = () => {
    onChange({
      scripting: !scripting,
      services: selectedServices,
    })
  }
  const action = () => {
    email === '' ? share() : update()
  }

  return (
    <>
      <Typography variant="subtitle1">Services</Typography>
      <ServiceCheckboxes
        onChange={handleChangeServices}
        services={device.services.map(s => ({ label: s.name, value: s.id }))}
        saving={saving}
        selectedServices={selectedServices}
      />
      <List>
        <ListItemSetting
          label="Allow script execution"
          subLabel="Give the user the ability to run scripts on this device."
          icon="scroll"
          disabled={saving}
          toggle={scripting}
          onClick={handleChangeScripting}
        />
      </List>
      <ShareSaveActions
        onCancel={() => history.push(location.pathname.replace(email ? `/${email}` : '/share', ''))}
        onSave={action}
      />
    </>
  )
}

interface CheckboxItem {
  label: string
  value: string
}

function ServiceCheckboxes({
  onChange,
  services = [],
  saving,
  selectedServices = [],
}: {
  onChange: (services: string[]) => void
  services: CheckboxItem[]
  saving: boolean
  selectedServices: string[]
}): JSX.Element {
  const update = (checked: boolean, id: string): void => {
    const all = checked ? [...selectedServices, id] : selectedServices.filter(v => v !== id)
    onChange(all)
  }

  const selectAll = (checked: boolean, services: CheckboxItem[]): void => {
    const ids = services.map(service => service.value).filter(id => [...selectedServices, id])
    const all = checked ? ids : selectedServices.filter(v => '')
    onChange(all)
  }

  return (
    <>
      <List>
        <ListItemCheckbox disabled={saving} label="Select all" onClick={checked => selectAll(checked, services)} />
      </List>
      <Divider />
      <List>
        {services.map((service, key) => (
          <ListItemCheckbox
            key={key}
            disabled={saving}
            label={service.label}
            checked={selectedServices.includes(service.value)}
            onClick={checked => update(checked, service.value)}
          />
        ))}
      </List>
    </>
  )
}
