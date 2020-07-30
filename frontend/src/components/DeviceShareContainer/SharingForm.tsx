import {
    Checkbox,
    FormControlLabel,
    List,
    ListItem,
    ListItemText,
    Switch,
    Typography,
    ListItemIcon,
    ListItemSecondaryAction,
  } from '@material-ui/core'
  import React from 'react'
  import { Icon } from '../Icon'
  import { makeStyles } from '@material-ui/core/styles'
  import { ShareSaveActions } from './ContactCardActions'
  import { useHistory, useParams } from 'react-router-dom'
  
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
    saving,
    scripting,
    selectedServices,
    update,
    share,
  }: {
    onChange: (access: SharingAccess) => void
    device: IDevice
    saving: boolean
    scripting: boolean
    selectedServices: string[]
    update: () => void
    share: () => void
  }): JSX.Element {
  
    const history = useHistory()
    const { userName = '' } = useParams()
  
    const handleChangeServices = (services: string[]) => {
      onChange({ scripting, services })
    }
  
    const handleChangeScripting = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        scripting: e.target.checked,
        services: selectedServices,
      })
    }
    const action = () => {userName === '' ? share() :  update() }
    const css = useStyles()
  
    return (
      <>
        <List>
          <ListItem style={{ opacity: 1, padding: 0 }}>
            <ListItemIcon className={css.icon}>
              <Icon name="fa fa-scroll" size="md" type="light" />
            </ListItemIcon>
            <ListItemText
              primary={'Allow script excecution'}
              secondary={'Allowing script excecution gives the user th ability tu run scripts on this device'}
            />
            <ListItemSecondaryAction>
              <Switch
                color="primary"
                className="ml-lg"
                onChange={handleChangeScripting}
                checked={scripting}
                disabled={saving}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
  
        <Typography variant="subtitle1" className={css.typogrpy}>
          SERVICES
        </Typography>
        <ListItem>
          <div>
            <ServiceCheckboxes
              onChange={handleChangeServices}
              services={device.services.map(s => ({ label: s.name, value: s.id }))}
              saving={saving}
              selectedServices={selectedServices}
            />
          </div>
        </ListItem>
        <div className="left">
          <ShareSaveActions
            onCancel={() => history.push(`/devices/${device.id}/users`)}
            onSave={action}
            saving={saving}
          />
        </div>
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
    const css = useStyles()
  
    function update(checked: boolean, id: string): void {
      const all = checked ? [...selectedServices, id] : selectedServices.filter(v => v != id)
      onChange(all)
    }
    return (
      <>
        {services.map((service, key) => (
          <div key={key} className={css.checkService}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedServices.includes(service.value)}
                  disabled={saving}
                  onChange={e => update(e.currentTarget.checked, service.value)}
                  value={service.value}
                  color="primary"
                />
              }
              label={service.label}
            />
          </div>
        ))}
      </>
    )
  }
  
  const useStyles = makeStyles({
    typogrpy: {
      padding: '0px',
      minHeight: '30px',
    },
    checkService: {
      height: '30px',
    },
    button: {
      marginTop: '40px',
      marginRight: '10px',
      padding: '5px 10px 5px 10px',
      borderRadius: '3px',
      minWidth: '45px',
    },
    icon: {
      minWidth: '20px',
      marginRight: '20px',
    },
  })
  