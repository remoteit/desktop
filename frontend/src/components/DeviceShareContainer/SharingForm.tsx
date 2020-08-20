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
  import React, { useEffect } from 'react'
  import { Icon } from '../Icon'
  import { makeStyles } from '@material-ui/core/styles'
  import { ShareSaveActions } from './ContactCardActions'
  import { useHistory, useParams, useLocation } from 'react-router-dom'
import { useSelector } from '../../hooks/reactReduxHooks'
import { ApplicationState } from '../../store'
import { spacing } from '../../styling'
  
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
  
    const handleChangeScripting = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        scripting: e.target.checked,
        services: selectedServices,
      })
    }
    const action = () => {email === '' ? share() :  update() }
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
            onCancel={() => 
              history.push(location.pathname.replace(email ? `/${email}` : '/share', ''))
            }
            onSave={action}
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
  
    const update = (checked: boolean, id: string): void => {
      const all = checked ? [...selectedServices, id] : selectedServices.filter(v => v !== id)
      onChange(all)
    }

    const selectAll = (checked: boolean, services: CheckboxItem[]): void => {
      const ids = services.map(service =>  service.value ).filter( id => [...selectedServices, id] )
      const all = checked ? ids : selectedServices.filter(v => '')
      onChange(all)
    }

    return (
      <>
       <FormControlLabel
          control= {<Checkbox
              onChange={e => selectAll(e.currentTarget.checked, services)}
              color="primary"
          />
          }
          label={'Select all'}
        />
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
      padding: `${spacing.xxs}px`,
      minHeight: `${spacing.lg}px`,
    },
    checkService: {
      height: `${spacing.lg}px`,
    },
    button: {
      marginTop: `${spacing.xl}px`,
      marginRight: `${spacing.sm}px`,
      padding: `${spacing.xs}px ${spacing.sm}px ${spacing.xs}px ${spacing.sm}px`,
      borderRadius: `${spacing.xxs}px`,
      minWidth: `${spacing.xxl}px`,
    },
    icon: {
      minWidth: `${spacing.md}px`,
      marginRight: `${spacing.md}px`,
    },
  })
  