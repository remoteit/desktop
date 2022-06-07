import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { getOrganization, getOwnOrganization, selectPermissions } from '../models/organization'
import { makeStyles, Box, Typography, Link } from '@material-ui/core'
import { DataCopy } from '../components/DataCopy'
import { Notice } from '../components/Notice'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import { Help } from '../components/Help'
import { spacing } from '../styling'

export const SetupLinuxPage: React.FC = () => {
  const { organization, registrationCommand, permissions } = useSelector((state: ApplicationState) => ({
    organization: getOrganization(state),
    registrationCommand: state.ui.registrationCommand,
    permissions: selectPermissions(state),
  }))
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  let accountId = organization.id
  let accountName = organization.name

  useEffect(() => {
    dispatch.devices.createRegistration({ services: [{ application: 28 }], accountId }) // ssh
    return function cleanup() {
      dispatch.ui.set({ registrationCommand: undefined }) // remove registration code so we don't redirect to new device page
    }
  }, [accountId])

  if (permissions?.includes('MANAGE')) {
    accountId = organization.id
    accountName = organization.name
  } else {
    return (
      <Body center>
        <Box>
          <Notice>You must have the manage permission to add a device to this organization.</Notice>
        </Box>
      </Body>
    )
  }

  return (
    <Body center>
      <Box margin="-100px 0 -160px 0">
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
        <DataCopy showBackground value={registrationCommand ? registrationCommand : '...generating command...'} />
      </section>
      <Typography variant="body2" align="center" color="textSecondary">
        This page will automatically update when complete.
        <Link href="https://link.remote.it/support/streamline-install" target="_blank">
          Troubleshooting & instructions.
        </Link>
      </Typography>
    </Body>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& .MuiIconButton-root': { minHeight: '3em', minWidth: 600, maxWidth: 600 },
  },
}))
