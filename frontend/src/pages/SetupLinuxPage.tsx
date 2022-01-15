import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Typography } from '@material-ui/core'
import { DataCopy } from '../components/DataCopy'
import { Body } from '../components/Body'

// const defaultServices = [28, 4]

export const SetupLinuxPage: React.FC = () => {
  const { registrationCode } = useSelector((state: ApplicationState) => state.devices)
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    dispatch.devices.createRegistration([28]) // ssh
    return () => {
      // remove registration code so we don't redirect to new device page
      dispatch.devices.set({ registrationCode: undefined })
    }
  }, [])

  return (
    <Body center>
      <Typography variant="h3" align="center" gutterBottom>
        Run this command on your Linux / Raspberry Pi system to register your device.
      </Typography>
      <Typography variant="body2" align="center" color="textSecondary">
        This page will update automatically when registration is complete.
      </Typography>
      <section>
        <DataCopy
          showBackground
          label="Registration command"
          value={`R3_REGISTRATION_CODE="${
            registrationCode || '...generating code...'
          }" \\\nsh -c "$(curl -L https://downloads.remote.it/remoteit/install_agent.sh)"`}
        />
      </section>
      {/* <Typography variant="body2" color="textSecondary">
        Services
      </Typography>
      <List className="collapseList">
        <ListItemCheckbox
          label="ssh"
          // checked={ state[key] }
          onClick={() => {
            // state[key] = !state[key]
            // setState([...state])
          }}
        >
          <Chip label="ssh" size="small" />
        </ListItemCheckbox>
      </List> */}
    </Body>
  )
}
