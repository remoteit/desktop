import React, { useEffect } from 'react'
import { getDeviceModel } from '../models/accounts'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { getActiveOrganizationMembership } from '../models/accounts'
import { makeStyles, Box, Typography, Link } from '@material-ui/core'
import { DataCopy } from '../components/DataCopy'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import { Help } from '../components/Help'

// const defaultServices = [28, 4]

export const SetupLinuxPage: React.FC = () => {
  const { user, organization, activeMembership, registrationCommand } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
    organization: state.organization,
    activeMembership: getActiveOrganizationMembership(state),
    registrationCommand: getDeviceModel(state).registrationCommand,
  }))
  // const [type, setType] = useState<'curl' | 'wget'>('wget')
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  let accountId = user?.id || ''
  let accountName = organization.name
  if (activeMembership?.role === 'ADMIN') {
    accountId = activeMembership.organization.id
    accountName = activeMembership.organization.name
  }

  useEffect(() => {
    dispatch.devices.createRegistration({ services: [28], accountId }) // ssh
    return () => {
      // remove registration code so we don't redirect to new device page
      dispatch.devices.set({ registrationCommand: undefined })
    }
  }, [accountId])

  return (
    <Body center>
      <Box margin={`-100px 0 -160px 0 `}>
        <Icon name="linux" fontSize={260} color="grayLightest" type="brands" />
      </Box>
      <Typography variant="caption" align="center" gutterBottom>
        For any Raspberry Pi or Linux based system
      </Typography>
      <Typography variant="h3" align="center">
        Run this command to register the device{' '}
        {accountName && (
          <>
            with <Help message="You can register to any organization you are an Admin">{accountName}</Help>
          </>
        )}
      </Typography>
      <section className={css.section}>
        {/* <Box>
          <Chip label="wget" variant={type === 'wget' ? 'default' : 'outlined'} onClick={() => setType('wget')} />
          <Chip label="curl" variant={type === 'curl' ? 'default' : 'outlined'} onClick={() => setType('curl')} />
        </Box> */}
        <DataCopy showBackground value={registrationCommand ? registrationCommand : '...generating command...'} />
      </section>
      <Typography variant="body2" align="center" color="textSecondary">
        This page will automatically update when complete.
        <Link href="https://link.remote.it/support/streamline-install" target="_blank">
          Troubleshooting & instructions.
        </Link>
      </Typography>
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
    // '& .MuiBox-root': { display: 'flex', flexDirection: 'column' },
    // '& .MuiChip-root': { marginRight: -20, paddingRight: 20 },
    // '& .MuiChip-outlined': { borderWidth: 0, color: palette.gray.main },
    '& .MuiIconButton-root': { minHeight: '3em', minWidth: 600 },
  },
}))
