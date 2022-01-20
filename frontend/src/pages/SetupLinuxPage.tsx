import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Box, Typography, Chip } from '@material-ui/core'
import { DataCopy } from '../components/DataCopy'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

// const defaultServices = [28, 4]

export const SetupLinuxPage: React.FC = () => {
  const { registrationCode, organization } = useSelector((state: ApplicationState) => ({
    registrationCode: state.devices.registrationCode,
    organization: state.organization.name,
  }))
  const [type, setType] = useState<'curl' | 'wget'>('wget')
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  useEffect(() => {
    dispatch.devices.createRegistration([28]) // ssh
    return () => {
      // remove registration code so we don't redirect to new device page
      dispatch.devices.set({ registrationCode: undefined })
    }
  }, [])

  return (
    <Body center>
      <Box margin={`-80px 0 -200px 0 `}>
        <Icon name="linux" fontSize={260} color="grayLightest" type="brands" />
      </Box>
      <Typography variant="h3" align="center" gutterBottom>
        Run this command on your Linux / Raspberry Pi system to register your device.
      </Typography>
      <Typography variant="body2" align="center" color="textSecondary">
        This page will update automatically when registration is complete.
        {organization && (
          <>
            <br />
            And will be registered to <b>{organization}.</b>
          </>
        )}
      </Typography>
      <section className={css.section}>
        <DataCopy
          showBackground
          label="Registration command"
          value={`R3_REGISTRATION_CODE="${registrationCode || '...generating code...'}" \\\nsh -c "$(${
            type === 'curl' ? 'curl -L' : 'wget -qO-'
          } https://downloads.remote.it/remoteit/install_agent.sh)"`}
        />
        <Box>
          <Chip label="wget" variant={type === 'wget' ? 'default' : 'outlined'} onClick={() => setType('wget')} />
          <Chip label="curl" variant={type === 'curl' ? 'default' : 'outlined'} onClick={() => setType('curl')} />
        </Box>
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

const useStyles = makeStyles(({ palette }) => ({
  section: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& .MuiBox-root': { display: 'flex', flexDirection: 'column' },
    '& .MuiChip-root': { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
    '& .MuiChip-outlined': { borderWidth: 0, color: palette.gray.main },
  },
}))
