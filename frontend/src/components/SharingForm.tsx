import React, { useEffect, useState } from 'react'
import { Divider, List, Typography } from '@material-ui/core'
import { ListItemCheckbox } from './ListItemCheckbox'
import { ShareSaveActions } from './ShareSaveActions'
import { useHistory, useParams, useLocation } from 'react-router-dom'
import { useSelector } from '../hooks/reactReduxHooks'
import { ApplicationState } from '../store'

export interface SharingDetails {
  access: SharingAccess
  emails: string[]
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
  indeterminateServices,
  update,
  share,
  changed,
}: {
  onChange: (access: SharingAccess, hasIndetermante: boolean) => void
  device: IDevice
  scripting: boolean
  selectedServices: string[]
  indeterminateServices: string[]
  users: string[]
  update: () => void
  share: () => void
  changed: boolean
}): JSX.Element {
  const history = useHistory()
  const location = useLocation()
  const { email = '' } = useParams<{ email: string }>()
  const saving = useSelector((state: ApplicationState) => state.shares.sharing)
  const [hasIndetermante, setHasIndetermante] = useState<boolean>(false)
  let disabled = !changed || saving

  const handleChangeServices = (services: string[]) => {
    onChange({ scripting, services }, hasIndetermante)
  }

  useEffect(() => {
    const crumbs = location.pathname.substr(1).split('/')
    crumbs[2] !== 'users' && handleChangeServices([crumbs[2]])
  }, [])

  useEffect(() => {
    handleChangeScripting(false)
  }, [hasIndetermante])

  const handleChangeScripting = (revertScripting = true) => {
    onChange(
      {
        scripting: revertScripting ? !scripting : scripting,
        services: selectedServices,
      },
      hasIndetermante
    )
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
        indeterminateServices={indeterminateServices}
        setHasIndetermante={setHasIndetermante}
      />
      <Divider />
      <List>
        <ListItemCheckbox
          label="Allow script execution"
          subLabel="Give the user the ability to run scripts on this device."
          disabled={saving}
          checked={scripting}
          onClick={handleChangeScripting}
        />
      </List>
      <ShareSaveActions
        onCancel={() => history.push(location.pathname.replace(email ? `/${email}` : '/share', ''))}
        onSave={action}
        disabled={disabled}
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
  indeterminateServices,
  setHasIndetermante,
}: {
  onChange: (services: string[]) => void
  services: CheckboxItem[]
  saving: boolean
  selectedServices: string[]
  indeterminateServices: string[]
  setHasIndetermante: (indeternate: boolean) => void
}): JSX.Element {
  const [serviceIndeterminates, setServicesIndeterminates] = useState<string[]>([])
  const [allIndeterminate, setAllIndeterminate] = useState<boolean>(false)
  const [selectAllChecked, setSelectAllChecked] = useState<boolean>(false)

  useEffect(() => {
    setHasIndetermante(serviceIndeterminates.length > 0)
  }, [serviceIndeterminates])

  useEffect(() => {
    setServicesIndeterminates(indeterminateServices)
  }, [indeterminateServices])

  useEffect(() => {
    setAllIndeterminate(services?.length !== selectedServices?.length && selectedServices?.length !== 0)
    setSelectAllChecked(services?.length === selectedServices?.length && selectedServices?.length !== 0)
  }, [services, selectedServices])

  const update = (checked: boolean, id: string): void => {
    const all = checked ? [...selectedServices, id] : selectedServices.filter(v => v !== id)
    setServicesIndeterminates(serviceIndeterminates.filter(sI => sI !== id))
    onChange(all)
  }

  const selectAll = (checked: boolean, services: CheckboxItem[]): void => {
    const ids = services.map(service => service.value).filter(id => [...selectedServices, id])
    const all = checked ? ids : selectedServices.filter(v => '')
    setServicesIndeterminates([])
    onChange(all)
    console.log("test")
  }

  return (
    <>
      <List className="collapseList">
        <ListItemCheckbox
          disabled={saving}
          label={<i>Select all</i>}
          onClick={checked => selectAll(checked, services)}
          checked={selectAllChecked}
          indeterminate={allIndeterminate}
        />
        {services.map((service, key) => (
          <ListItemCheckbox
            key={key}
            disabled={saving}
            label={service.label}
            checked={selectedServices.includes(service.value)}
            onClick={checked => update(checked, service.value)}
            indeterminate={serviceIndeterminates.includes(service.value)}
          />
        ))}
      </List>
    </>
  )
}
